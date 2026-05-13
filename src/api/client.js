const GATEWAY_URL =
  import.meta.env.VITE_GATEWAY_URL ||
  "https://api.admin.u-code.io/v2/invoke_function/lms-qobulov/";

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

export async function callGateway(method, objectData = {}, options = {}) {
  const body = buildGatewayBody({
    method,
    objectData,
  });

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Application-Language": options.language || getStoredLanguage(),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.status === "error") {
    const message =
      payload?.data?.message || payload?.data?.error || `Gateway error: ${response.status}`;
    throw new Error(message);
  }

  return payload?.data ?? payload;
}
