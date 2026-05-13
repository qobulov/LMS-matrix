import { NavLink, Outlet } from "react-router-dom";

const adminNav = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/reports", label: "Reports" },
  { to: "/admin/users", label: "Users" },
];

export function AdminLayout() {
  return (
    <div className="admin-shell font-dm-sans">
      <aside className="admin-sidebar">
        <p className="eyebrow">SuperAdmin Panel</p>
        <h3>LMS Control</h3>
        <nav className="admin-nav">
          {adminNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? "admin-nav-link active" : "admin-nav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <section className="admin-content">
        <Outlet />
      </section>
    </div>
  );
}
