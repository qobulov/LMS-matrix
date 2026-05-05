import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import TravelConnectSignIn from "../../components/ui/travel-connect-signin-1";
import { useLms } from "../../data/LmsContext";

export function LoginPage() {
  const { login } = useLms();
  const navigate = useNavigate();

  const onSubmit = async ({ email, password }) => {
    const result = await login({ email, password });

    if (!result.ok) {
      toast.error(result.error ?? "Email or password is incorrect");
      return;
    }

    toast.success(`Welcome back, ${result.user.fullName}!`);
    navigate("/", { replace: true });
  };

  return (
    <TravelConnectSignIn
      mode="login"
      onSubmit={onSubmit}
      onSwitchMode={() => navigate("/register")}
    />
  );
}
