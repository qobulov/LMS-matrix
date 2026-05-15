import { Navigate } from "react-router-dom";
import { useLms } from "../../data/LmsContext";
import { getHomePathForRole } from "../../utils/authRouting";

/** Sends authenticated user from `/` to their role home. */
export function RoleRedirect() {
  const { role } = useLms();
  return <Navigate to={getHomePathForRole(role)} replace />;
}
