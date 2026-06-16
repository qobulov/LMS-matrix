const SESSION_KEY = "lms_session_v1";

const GATEWAY_URL = `${import.meta.env.VITE_GATEWAY_URL}?project-id=${import.meta.env.VITE_GATEWAY_PROJECT_ID}`;
const GATEWAY_ENVIRONMENT_ID = import.meta.env.VITE_GATEWAY_ENVIRONMENT_ID;

let refreshInFlight = null;

export function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function persistSession(session) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("user_id");
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem("user_id", session.userId);
}

function normalizeRefreshResponse(raw) {
  if (!raw || typeof raw !== "object") {
    return { accessToken: null, refreshToken: null };
  }
  const accessToken = raw.access_token ?? raw.token?.access_token ?? null;
  const refreshToken = raw.refresh_token ?? raw.token?.refresh_token ?? null;
  return { accessToken, refreshToken };
}

function unwrapInvokeFunctionData(envelope) {
  if (!envelope || typeof envelope !== "object") {
    return envelope;
  }
  const inner = envelope.data;
  if (!inner || typeof inner !== "object") {
    return envelope;
  }
  const isUcodeInvokeShell =
    typeof envelope.description === "string" &&
    envelope.status != null &&
    inner.description == null;
  if (isUcodeInvokeShell) {
    return inner;
  }
  const looksLikeNestedPayload =
    inner.token != null ||
    inner.user_data != null ||
    inner.user_id != null ||
    inner.access_token != null ||
    inner.refresh_token != null;
  if (looksLikeNestedPayload) {
    return inner;
  }
  return envelope;
}

/**
 * Calls refresh_token and updates stored access token. Dedupes concurrent refresh calls.
 * @returns {Promise<string|null>} New access token or null on failure.
 */
export async function refreshStoredAccessToken() {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const session = readSession();
    if (!session?.refreshToken) {
      return null;
    }

    const headers = {
      "Content-Type": "application/json",
      "Application-Language": localStorage.getItem("lang") || "uz",
    };
    if (GATEWAY_ENVIRONMENT_ID) {
      headers["environment-id"] = GATEWAY_ENVIRONMENT_ID;
    }

    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        data: {
          method: "refresh_token",
          object_data: { refresh_token: session.refreshToken },
        },
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload?.status === "error") {
      persistSession(null);
      return null;
    }

    const envelope = payload?.data ?? payload;
    const data = unwrapInvokeFunctionData(envelope);
    let { accessToken, refreshToken } = normalizeRefreshResponse(data);

    if (!refreshToken) {
      refreshToken = session.refreshToken;
    }

    if (!accessToken) {
      persistSession(null);
      return null;
    }

    persistSession({
      ...session,
      token: accessToken,
      refreshToken,
    });

    return accessToken;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}
