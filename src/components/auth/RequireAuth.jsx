import { Navigate, useLocation } from "react-router-dom";
import { useLms } from "../../data/LmsContext";

export function RequireAuth({ children }) {
  const { isAuthenticated, authReady } = useLms();
  const location = useLocation();

  if (!authReady) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
