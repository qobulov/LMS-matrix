import { ArrowLeft, Bell, CalendarDays, Search, ShoppingBag } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import { useLms } from "../../data/LmsContext";

export function LessonLayout() {
  const { currentUser } = useLms();
  const navigate = useNavigate();

  const initials = currentUser?.fullName
    ? currentUser.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-damiun-surface-app font-dm-sans">
      {/* Header */}
      <header className="flex h-[68px] flex-shrink-0 items-center gap-4 border-b border-gray-100 bg-white px-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 transition hover:text-damiun-primary"
        >
          <ArrowLeft size={18} />
          Dashboard
        </button>

        <div className="ml-2 flex flex-1 items-center gap-2 rounded-full bg-gray-100 px-4 py-2.5">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search your own courses..."
            className="flex-1 bg-transparent text-sm text-gray-600 outline-none placeholder:text-gray-400"
          />
        </div>

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

        <div className="flex items-center gap-3 pl-2">
          <span className="text-sm font-semibold text-gray-800">{currentUser?.fullName ?? "Guest"}</span>
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-damiun-primary text-sm font-bold text-white">
              {initials}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
