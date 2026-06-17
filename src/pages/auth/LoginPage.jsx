import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authApi } from "../../api/endpoints";
import TravelConnectSignIn from "../../components/ui/travel-connect-signin-1";
import { useLms } from "../../data/LmsContext";
import { getHomePathForRole } from "../../utils/authRouting";

function normalizeLoginPayload({ email, password }) {
  return {
    email: String(email ?? "").trim().toLowerCase(),
    password: String(password ?? ""),
  };
}

export function LoginPage() {
  const { applyGatewayAuth } = useLms();
  const navigate = useNavigate();

  const onSubmit = useCallback(
    async (values) => {
      const payload = normalizeLoginPayload(values);

      if (!payload.email || !payload.password) {
        toast.error("Email va parolni kiriting");
        return;
      }

      try {
        const data = await authApi.login(payload);
        const user = applyGatewayAuth(data);
        toast.success(`Welcome back, ${user.fullName}!`);
        navigate(getHomePathForRole(user.role), { replace: true });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Email yoki parol noto'g'ri";
        toast.error(message);
      }
    },
    [applyGatewayAuth, navigate],
  );

  return (
    <TravelConnectSignIn
      mode="login"
      onSubmit={onSubmit}
      onSwitchMode={() => navigate("/register")}
      onForgotPassword={() => navigate("/forgot-password")}
    />
  );
}
