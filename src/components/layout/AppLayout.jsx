import { Link, NavLink, Outlet } from "react-router-dom";
import { useLms } from "../../data/LmsContext";

export function AppLayout() {
  const { currentUser, role, logout } = useLms();

  const navItems = [
    { to: "/", label: "Home", allow: ["student", "instructor", "superadmin"] },
    { to: "/catalog", label: "Catalog", allow: ["student", "instructor", "superadmin"] },
    { to: "/student", label: "My Learning", allow: ["student"] },
    { to: "/instructor", label: "Instructor", allow: ["instructor"] },
    { to: "/admin", label: "Admin Panel", allow: ["superadmin"] },
    { to: "/certificates", label: "Certificates", allow: ["student"] },
    { to: "/profile", label: "Profile", allow: ["student", "instructor", "superadmin"] },
  ].filter((item) => item.allow.includes(role));

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          LMS Matrix
        </Link>

        <nav className="main-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="role-switcher">
          <img src={currentUser?.avatar} alt={currentUser?.fullName} className="avatar" />
          <div>
            <strong>{currentUser?.fullName}</strong>
            <p className="small-text">{role}</p>
          </div>
          <button className="btn btn-secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <main className="page-container">
        <Outlet />
      </main>
    </div>
  );
}
