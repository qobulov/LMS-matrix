import { Navigate, useLocation } from "react-router-dom";
import { useLms } from "../../data/LmsContext";

export function RequireAuth({ children }) {
  const { isAuthenticated } = useLms();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
