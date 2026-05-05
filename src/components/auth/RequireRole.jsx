import { Navigate } from "react-router-dom";
import { useLms } from "../../data/LmsContext";

export function RequireRole({ allow, children }) {
  const { role } = useLms();

  if (!allow.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
