import { useEffect, useRef, useState } from "react";
import {
  Award,
  BarChart2,
  Bell,
  BookOpen,
  FileText,
  Gift,
  Layers,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Search,
  ShoppingBag,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { APP_NAME } from "../../constants/branding";
import { useLms } from "../../data/LmsContext";

function getNavForRole(role) {
  switch (role) {
    case "instructor":
      return [
        { to: "/instructor", label: "Dashboard", icon: LayoutDashboard, end: true },
        { to: "/instructor/courses", label: "Course builder", icon: Layers },
        { to: "/instructor/create-course", label: "Create course", icon: PlusCircle },
        { to: "/profile", label: "Profile", icon: User },
      ];
    case "director":
      return [
        { to: "/admin", label: "Overview", icon: BarChart2, end: true },
        { to: "/admin/reports", label: "Reports", icon: FileText },
        { to: "/admin/users", label: "Users", icon: Users },
        { to: "/admin/payouts", label: "Payouts", icon: Wallet },
        { to: "/profile", label: "Profile", icon: User },
      ];
    case "student":
    default:
      return [
        { to: "/student", label: "Dashboard", icon: LayoutDashboard, end: true },
        { to: "/catalog", label: "Courses", icon: BookOpen },
        { to: "/certificates", label: "Certificates", icon: Award },
        { to: "/rewards", label: "Rewards", icon: Gift },
        { to: "/profile", label: "Profile", icon: User },
      ];
  }
}

export function AppLayout() {
  const { currentUser, logout, role } = useLms();
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname.startsWith("/courses/")) {
    return <Outlet />;
  }

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = getNavForRole(role);

  const initials = currentUser?.fullName
    ? currentUser.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const brandWords = APP_NAME.trim().split(/\s+/);
  const brandLine1 = brandWords[0] ?? APP_NAME;
  const brandLine2 = brandWords.slice(1).join(" ");

  return (
    <div className="flex h-screen overflow-hidden bg-damiun-surface-app">
      <aside className="flex w-[240px] flex-shrink-0 flex-col border-r border-gray-100 bg-white">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-damiun-primary">
            <svg viewBox="0 0 28 36" fill="none" className="h-6 w-6">
              <rect x="4" y="2" width="20" height="30" rx="4" stroke="white" strokeWidth="2.5" />
              <rect x="9" y="8" width="10" height="2" rx="1" fill="white" />
              <circle cx="14" cy="26" r="2.5" fill="white" />
            </svg>
          </div>
          <div className="leading-tight">
            <p className="text-base font-bold text-damiun-wordmark">{brandLine1}</p>
            {brandLine2 ? (
              <p className="text-base font-bold text-damiun-wordmark">{brandLine2}</p>
            ) : null}
          </div>
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto px-3 pb-6">
          <ul className="space-y-0.5">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <li key={to + label}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? "bg-damiun-nav-tint text-damiun-primary" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          isActive ? "bg-damiun-primary text-white" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="flex-1">{label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  <LogOut size={16} />
                </span>
                Sign Out
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-[68px] flex-shrink-0 items-center gap-4 border-b border-gray-100 bg-white px-6">
          <div className="flex flex-1 items-center gap-2 rounded-full bg-gray-100 px-4 py-2.5">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search your own courses..."
              className="flex-1 bg-transparent text-sm text-gray-600 outline-none placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100"
              aria-label="Shopping"
            >
              <ShoppingBag size={20} />
            </button>
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100"
                aria-label="Notifications"
              >
                <Bell size={20} />
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-gray-100 bg-white p-4 shadow-lg">
                  <p className="text-sm font-semibold text-gray-800">Notifications</p>
                  <p className="mt-3 text-center text-sm text-gray-400">No notifications yet.</p>
                </div>
              )}
            </div>
          </div>

          <Link
            to="/profile"
            className="group flex items-center gap-3 rounded-full py-1.5 pl-3 pr-1.5 transition hover:bg-gray-100"
            aria-label="Open profile"
          >
            <span className="max-w-[140px] truncate text-sm font-semibold text-gray-800 group-hover:text-damiun-primary sm:max-w-[200px]">
              {currentUser?.fullName ?? "Guest"}
            </span>
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt=""
                className="h-9 w-9 rounded-full object-cover ring-2 ring-transparent transition group-hover:ring-damiun-primary/30"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-damiun-primary text-sm font-bold text-white ring-2 ring-transparent transition group-hover:ring-damiun-primary/50">
                {initials}
              </div>
            )}
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
