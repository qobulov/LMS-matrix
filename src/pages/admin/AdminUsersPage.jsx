import { useMemo, useState } from "react";
import { useLms } from "../../data/LmsContext";

function initials(name) {
  if (!name?.trim()) return "?";
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const ROLES = ["all", "student", "instructor", "superadmin"];

export function AdminUsersPage() {
  const { users } = useLms();
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = useMemo(() => {
    if (roleFilter === "all") return users;
    return users.filter((u) => u.role === roleFilter);
  }, [users, roleFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-damiun-wordmark">Users</h1>
        <p className="mt-1 text-sm text-damiun-muted">Roles and accounts (README — SuperAdmin).</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRoleFilter(r)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
              roleFilter === r
                ? "bg-damiun-primary text-white shadow-sm"
                : "bg-white text-damiun-muted shadow-sm ring-1 ring-gray-100 hover:text-damiun-wordmark"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <article className="overflow-x-auto rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id}>
                <td>
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-damiun-nav-tint text-xs font-bold text-damiun-primary">
                      {initials(user.fullName)}
                    </span>
                  )}
                </td>
                <td className="font-medium text-damiun-wordmark">{user.fullName}</td>
                <td>{user.email}</td>
                <td>
                  <span className="rounded-full bg-damiun-nav-tint px-2 py-0.5 text-xs font-semibold capitalize text-damiun-primary">
                    {user.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </div>
  );
}
