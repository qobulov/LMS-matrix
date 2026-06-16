import { readSession, refreshStoredAccessToken } from "./session";

const GATEWAY_URL = `${import.meta.env.VITE_GATEWAY_URL}?project-id=${import.meta.env.VITE_GATEWAY_PROJECT_ID}`;
const GATEWAY_ENVIRONMENT_ID = import.meta.env.VITE_GATEWAY_ENVIRONMENT_ID;
const GATEWAY_RESOURCE_ID = import.meta.env.VITE_GATEWAY_RESOURCE_ID;

const FOLDER_UPLOAD_URL = "https://api.admin.u-code.io/v1/files/folder_upload";
const CDN_BASE = "https://cdn.u-code.io/";

function buildGatewayBody({ method, objectData = {} }) {
  return {
    data: {
      method,
      object_data: objectData,
    },
  };
}

function getStoredLanguage() {
  return localStorage.getItem("lang") || "uz";
}

/**
 * U-code invoke_function often wraps the real body in `data.data`
 * (outer: description/status; inner: token, user_data, user_id, …).
 */
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

function extractErrorMessage(payload, status) {
  const errBlock = payload?.data;
  return (
    errBlock?.message ||
    errBlock?.data?.message ||
    errBlock?.error ||
    payload?.error ||
    `Gateway error: ${status}`
  );
}

function isUnauthorized(status) {
  return status === 401;
}

async function executeGatewayRequest(method, objectData, options) {
  const body = buildGatewayBody({ method, objectData });
  const token = options.token ?? null;

  const headers = {
    "Content-Type": "application/json",
    "Application-Language": options.language || getStoredLanguage(),
    ...(options.headers || {}),
  };
  if (GATEWAY_ENVIRONMENT_ID) {
    headers["environment-id"] = GATEWAY_ENVIRONMENT_ID;
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  return { response, payload, token };
}

export async function callGateway(method, objectData = {}, options = {}) {
  // Public auth methods must not trigger refresh loops.
  const skipRefresh =
    options.skipAuthRefresh ||
    method === "login" ||
    method === "register" ||
    method === "refresh_token";

  let token = options.token ?? null;
  let retried = Boolean(options._retried);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { response, payload } = await executeGatewayRequest(method, objectData, {
      ...options,
      token,
    });

    const unauthorized =
      isUnauthorized(response.status) ||
      (payload?.status === "error" && isUnauthorized(Number(payload?.data?.status ?? 0)));

    if (
      unauthorized &&
      !skipRefresh &&
      !retried &&
      (token || readSession()?.refreshToken)
    ) {
      const newToken = await refreshStoredAccessToken();
      if (newToken) {
        token = newToken;
        retried = true;
        continue;
      }
    }

    if (!response.ok || payload?.status === "error") {
      throw new Error(extractErrorMessage(payload, response.status));
    }

    const envelope = payload?.data ?? payload;
    return unwrapInvokeFunctionData(envelope);
  }

  throw new Error("Session expired. Please sign in again.");
}

/**
 * Upload a file to U-code media storage; returns public CDN URL for `data.link`.
 */
export async function uploadFile(file, { token } = {}) {
  if (!GATEWAY_RESOURCE_ID) {
    throw new Error("Missing VITE_GATEWAY_RESOURCE_ID for file upload");
  }

  let authToken = token ?? readSession()?.token ?? null;
  let retried = false;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const form = new FormData();
    form.append("file", file);

    const headers = {
      "resource-id": GATEWAY_RESOURCE_ID,
    };
    if (GATEWAY_ENVIRONMENT_ID) {
      headers["environment-id"] = GATEWAY_ENVIRONMENT_ID;
    }
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(FOLDER_UPLOAD_URL, {
      method: "POST",
      headers,
      body: form,
    });

    const payload = await response.json().catch(() => ({}));

    if (response.status === 401 && !retried && readSession()?.refreshToken) {
      const newToken = await refreshStoredAccessToken();
      if (newToken) {
        authToken = newToken;
        retried = true;
        continue;
      }
    }

    if (!response.ok) {
      const message =
        payload?.description ||
        payload?.data?.message ||
        payload?.message ||
        `Upload failed: ${response.status}`;
      throw new Error(message);
    }

    const link = payload?.data?.link;
    if (!link || typeof link !== "string") {
      throw new Error(payload?.description || "Upload succeeded but no link returned");
    }

    const path = link.replace(/^\//, "");
    const base = CDN_BASE.endsWith("/") ? CDN_BASE : `${CDN_BASE}/`;
    return `${base}${path}`;
  }

  throw new Error("Session expired. Please sign in again.");
}
