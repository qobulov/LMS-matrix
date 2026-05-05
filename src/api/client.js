const GATEWAY_URL =
  import.meta.env.VITE_GATEWAY_URL || "http://localhost:8080/";

const APP_ID = import.meta.env.VITE_GATEWAY_APP_ID || "";
const PROJECT_ID = import.meta.env.VITE_GATEWAY_PROJECT_ID || "";
const ENVIRONMENT_ID = import.meta.env.VITE_GATEWAY_ENVIRONMENT_ID || "";

function buildGatewayBody({ method, objectData = {}, userId = "", tableSlug = "" }) {
  return {
    auth: { type: "", data: null },
    data: {
      app_id: APP_ID,
      project_id: PROJECT_ID,
      environment_id: ENVIRONMENT_ID,
      method,
      action_type: "",
      table_slug: tableSlug,
      object_data: objectData,
      user_id: userId,
    },
    request_data: {
      method: "POST",
      path: "/",
      headers: null,
      params: null,
      body: null,
    },
  };
}

function getStoredUserId() {
  return localStorage.getItem("user_id") || "";
}

function getStoredLanguage() {
  return localStorage.getItem("lang") || "uz";
}

export async function callGateway(method, objectData = {}, options = {}) {
  const body = buildGatewayBody({
    method,
    objectData,
    userId: options.userId ?? getStoredUserId(),
    tableSlug: options.tableSlug ?? "",
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
