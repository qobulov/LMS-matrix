import { useLocation, useNavigate } from "react-router-dom";
import TravelConnectSignIn from "../../components/ui/travel-connect-signin-1";
import { useLms } from "../../data/LmsContext";
import { useState } from "react";

export function LoginPage() {
  const { login } = useLms();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || "/";

  const onSubmit = async ({ email, password }) => {
    setError("");

    const normalizedEmail = String(email || "").trim();
    const normalizedPassword = String(password || "").trim();

    if (!normalizedEmail || !normalizedPassword) {
      setError("Email va parolni to'ldiring");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Email formati noto'g'ri");
      return;
    }

    setLoading(true);
    const result = await login({ email: normalizedEmail, password: normalizedPassword });
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    navigate(from, { replace: true });
  };

  return (
    <TravelConnectSignIn
      loading={loading}
      error={error}
      onSubmit={onSubmit}
      onSwitchMode={() => navigate("/register")}
    />
  );
}
