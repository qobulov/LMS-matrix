import { Outlet } from "react-router-dom";

/** Admin pages render inside AppLayout; no nested sidebar needed. */
export function AdminLayout() {
  return <Outlet />;
}
