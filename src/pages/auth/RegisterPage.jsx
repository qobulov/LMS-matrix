import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authApi } from "../../api/endpoints";
import TravelConnectSignIn from "../../components/ui/travel-connect-signin-1";
import { useLms } from "../../data/LmsContext";

export function RegisterPage() {
  const { applyGatewayAuth } = useLms();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const onSubmit = useCallback(
    async ({ fullName, email, password, role }) => {
      setError("");

      const normalizedFullName = String(fullName ?? "").trim();
      const normalizedEmail = String(email ?? "").trim().toLowerCase();
      const normalizedPassword = String(password ?? "");
      const chosenRole = role === "instructor" ? "instructor" : "student";

      if (!normalizedFullName || !normalizedEmail || !normalizedPassword) {
        setError("Barcha maydonlarni to'ldiring");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        setError("Email formati noto'g'ri");
        return;
      }

      if (normalizedPassword.length < 6) {
        setError("Parol kamida 6 ta belgidan iborat bo'lsin");
        return;
      }

      try {
        const data = await authApi.register({
          full_name: normalizedFullName,
          email: normalizedEmail,
          password: normalizedPassword,
          role: chosenRole,
        });
        const user = applyGatewayAuth(data, {
          fullName: normalizedFullName,
          email: normalizedEmail,
          role: chosenRole,
        });
        toast.success(`Welcome, ${user.fullName}!`);
        navigate("/", { replace: true });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Ro'yxatdan o'tish amalga oshmadi";
        setError(message);
        toast.error(message);
      }
    },
    [applyGatewayAuth, navigate],
  );

  return (
    <TravelConnectSignIn
      mode="register"
      error={error}
      onSubmit={onSubmit}
      onSwitchMode={() => navigate("/login")}
    />
  );
}
