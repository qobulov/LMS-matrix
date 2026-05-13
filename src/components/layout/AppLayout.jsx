import {
  BarChart2,
  Bell,
  BookOpen,
  Briefcase,
  CalendarDays,
  Gift,
  HelpCircle,
  LogOut,
  Search,
  ShoppingBag,
  User,
  Zap,
} from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { APP_NAME } from "../../constants/branding";
import { useLms } from "../../data/LmsContext";

const generalNav = [
  { to: "/", label: "Overview", icon: BarChart2, end: true },
  { to: "/catalog", label: "Courses", icon: BookOpen },
  { to: "#", label: "Job", icon: Briefcase },
  { to: "#", label: "Challenges", icon: Zap, badge: "Lvl 18" },
  { to: "/rewards", label: "Rewards", icon: Gift },
];

const otherNav = [
  { to: "/profile", label: "Profile", icon: User },
  { to: "#", label: "Help", icon: HelpCircle },
];

export function AppLayout() {
  const { currentUser, logout } = useLms();
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname.startsWith("/courses/")) {
    return <Outlet />;
  }

  const initials = currentUser?.fullName
    ? currentUser.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const brandWords = APP_NAME.trim().split(/\s+/);
  const brandLine1 = brandWords[0] ?? APP_NAME;
  const brandLine2 = brandWords.slice(1).join(" ");

  return (
    <div className="flex h-screen overflow-hidden bg-damiun-surface-app">
      {/* Sidebar */}
      <aside className="flex w-[240px] flex-shrink-0 flex-col border-r border-gray-100 bg-white">
        {/* Logo */}
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

        {/* Nav */}
        <nav className="flex flex-1 flex-col overflow-y-auto px-3 pb-6">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            General
          </p>
          <ul className="space-y-0.5">
            {generalNav.map(({ to, label, icon: Icon, badge, end }) => (
              <li key={label}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive && to !== "#"
                        ? "bg-damiun-nav-tint text-damiun-primary"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          isActive && to !== "#" ? "bg-damiun-primary text-white" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="flex-1">{label}</span>
                      {badge && (
                        <span className="rounded-full bg-damiun-primary px-2 py-0.5 text-[10px] font-bold text-white">
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          <p className="mb-2 mt-8 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Others
          </p>
          <ul className="space-y-0.5">
            {otherNav.map(({ to, label, icon: Icon }) => (
              <li key={label}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive && to !== "#"
                        ? "bg-damiun-nav-tint text-damiun-primary"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          isActive && to !== "#" ? "bg-damiun-primary text-white" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <Icon size={16} />
                      </span>
                      {label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
            <li>
              <button
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

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-[68px] flex-shrink-0 items-center gap-4 border-b border-gray-100 bg-white px-6">
          {/* Search */}
          <div className="flex flex-1 items-center gap-2 rounded-full bg-gray-100 px-4 py-2.5">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search your own courses..."
              className="flex-1 bg-transparent text-sm text-gray-600 outline-none placeholder:text-gray-400"
            />
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100">
              <ShoppingBag size={20} />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100">
              <CalendarDays size={20} />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100">
              <Bell size={20} />
            </button>
          </div>

          {/* User — opens profile (README) */}
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

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
