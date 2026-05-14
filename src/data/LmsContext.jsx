/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi, profileApi } from "../api/endpoints";

const LmsContext = createContext(null);

const SESSION_KEY = "lms_session_v1";

export function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persistSession(session) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("user_id");
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem("user_id", session.userId);
}

function mapProfileToUser(api) {
  if (!api || typeof api !== "object") return null;
  return {
    id: String(api.id ?? ""),
    fullName: String(api.full_name ?? "").trim() || "User",
    email: String(api.email ?? "").trim().toLowerCase(),
    role: api.role,
    avatar: api.avatar_url ?? "",
    bio: api.bio ?? "",
    stats: api.stats ?? null,
  };
}

/**
 * `raw` is the object returned by callGateway (API body `data`), which may be:
 * - LMS-style: { access_token, refresh_token, user: { id, full_name, email, role, ... } }
 * - U-code-style: { token: { access_token, refresh_token }, user_id, user, user_data, ... }
 */
function normalizeGatewayAuthPayload(raw, profileHints = {}) {
  if (!raw || typeof raw !== "object") {
    return { accessToken: null, refreshToken: null, mapped: null };
  }

  const accessToken = raw.access_token ?? raw.token?.access_token ?? null;
  const refreshToken = raw.refresh_token ?? raw.token?.refresh_token ?? null;

  const userObj = raw.user ?? raw.user_data;
  const appUserId = String(
    raw.user_id ?? raw.user_id_auth ?? userObj?.id ?? "",
  ).trim();

  const fullName =
    String(userObj?.full_name ?? profileHints.fullName ?? "").trim() ||
    (userObj?.email ? String(userObj.email).split("@")[0] : "") ||
    "User";
  const email = String(
    userObj?.email ?? profileHints.email ?? "",
  ).trim().toLowerCase();
  const role = userObj?.role ?? profileHints.role ?? "student";
  const avatar = userObj?.avatar_url ?? profileHints.avatar ?? "";
  const bio = userObj?.bio ?? "";

  if (!accessToken || !refreshToken || !appUserId || !email) {
    return { accessToken: null, refreshToken: null, mapped: null };
  }

  return {
    accessToken,
    refreshToken,
    mapped: {
      id: appUserId,
      fullName,
      email,
      role,
      avatar,
      bio,
      stats: null,
    },
  };
}

function normalizeRefreshResponse(raw) {
  if (!raw || typeof raw !== "object") {
    return { accessToken: null, refreshToken: null };
  }
  const accessToken = raw.access_token ?? raw.token?.access_token ?? null;
  const refreshToken = raw.refresh_token ?? raw.token?.refresh_token ?? null;
  return { accessToken, refreshToken };
}

function readInitialUser() {
  const s = readSession();
  if (!s?.user?.id) return null;
  if (s.userId != null && String(s.user.id) !== String(s.userId)) return null;
  return s.user;
}

export function LmsProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(readInitialUser);
  const [authReady, setAuthReady] = useState(() => {
    const s = readSession();
    if (!s?.token) return true;
    return Boolean(s.user?.id && String(s.user.id) === String(s.userId));
  });

  const isAuthenticated = Boolean(
    authReady && currentUser?.id && readSession()?.token,
  );
  const role = currentUser?.role ?? null;

  const getToken = useCallback(() => readSession()?.token ?? null, []);

  useEffect(() => {
    let cancelled = false;
    const s = readSession();
    if (!s?.token) {
      setAuthReady(true);
      return;
    }
    const hasUser = s.user?.id && String(s.user.id) === String(s.userId);
    if (hasUser) {
      setCurrentUser((prev) => prev ?? s.user);
      setAuthReady(true);
      return;
    }

    void (async () => {
      try {
        const data = await profileApi.me({ token: s.token });
        const mapped = mapProfileToUser(data);
        if (cancelled || !mapped?.id) return;
        setCurrentUser(mapped);
        persistSession({ ...s, userId: mapped.id, user: mapped });
      } catch {
        persistSession(null);
        setCurrentUser(null);
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const applyGatewayAuth = useCallback((authData, profileHints = {}) => {
    const { accessToken, refreshToken, mapped } = normalizeGatewayAuthPayload(
      authData,
      profileHints,
    );
    if (!accessToken || !refreshToken || !mapped?.id) {
      throw new Error("Invalid response from server");
    }

    setCurrentUser(mapped);
    const nextSession = {
      userId: mapped.id,
      token: accessToken,
      refreshToken,
      user: mapped,
    };
    persistSession(nextSession);
    return mapped;
  }, []);

  const refreshAuthTokens = useCallback(async () => {
    const s = readSession();
    if (!s?.refreshToken || !s?.userId) {
      return false;
    }
    try {
      const data = await authApi.refresh({ refresh_token: s.refreshToken });
      let { accessToken, refreshToken } = normalizeRefreshResponse(data);
      if (!refreshToken) {
        refreshToken = s.refreshToken;
      }
      if (!accessToken) {
        return false;
      }
      const next = { ...s, token: accessToken, refreshToken };
      persistSession(next);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    const s = readSession();
    const accessToken = s?.token;
    if (accessToken) {
      try {
        await authApi.logout({ access_token: accessToken });
      } catch {
        // still clear local session
      }
    }
    setCurrentUser(null);
    persistSession(null);
  }, []);

  const updateProfile = useCallback(
    async ({ fullName, bio, avatar }) => {
      if (!currentUser) {
        throw new Error("Not signed in");
      }
      const token = readSession()?.token;
      if (!token) {
        throw new Error("Not signed in");
      }

      const full_name = String(fullName ?? "").trim();
      const bioText = String(bio ?? "").trim();
      const avatarRaw = String(avatar ?? "").trim();
      const payload = {
        full_name,
        bio: bioText,
      };
      if (avatarRaw && !avatarRaw.startsWith("blob:")) {
        payload.avatar_url = avatarRaw;
      }

      await profileApi.update(payload, { token });

      const nextUser = {
        ...currentUser,
        fullName: full_name,
        bio: bioText,
        avatar: payload.avatar_url ?? currentUser.avatar,
      };
      setCurrentUser(nextUser);
      const s = readSession();
      if (s) {
        persistSession({ ...s, user: nextUser });
      }
    },
    [currentUser],
  );

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated,
      authReady,
      role,
      getToken,
      applyGatewayAuth,
      refreshAuthTokens,
      logout,
      updateProfile,
    }),
    [
      currentUser,
      isAuthenticated,
      authReady,
      role,
      getToken,
      applyGatewayAuth,
      refreshAuthTokens,
      logout,
      updateProfile,
    ],
  );

  return <LmsContext.Provider value={value}>{children}</LmsContext.Provider>;
}

export function useLms() {
  const context = useContext(LmsContext);
  if (!context) {
    throw new Error("useLms must be used within LmsProvider");
  }
  return context;
}
