import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "../../api/endpoints";
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

function mapUser(u) {
  if (!u || typeof u !== "object") return null;
  return {
    id: String(u.id),
    fullName: u.full_name ?? "",
    email: u.email ?? "",
    role: u.role ?? "student",
    avatar: u.avatar_url ?? "",
    status: u.status ?? "",
  };
}

export function AdminUsersPage() {
  const { getToken } = useLms();
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, debouncedSearch]);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) throw new Error("Not signed in");
    const filters = {
      search: debouncedSearch || undefined,
      page,
      page_size: pageSize,
    };
    if (roleFilter !== "all") {
      filters.role = roleFilter;
    }
    return adminApi.getUsers(filters, { token });
  }, [getToken, roleFilter, debouncedSearch, page]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await load();
        if (cancelled) return;
        const list = (data.users ?? []).map(mapUser).filter(Boolean);
        setUsers(list);
        setTotal(Number(data.total ?? list.length));
      } catch (e) {
        if (!cancelled) {
          setUsers([]);
          setTotal(0);
          setError(e instanceof Error ? e.message : "Failed to load users");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize) || 1),
    [total, pageSize],
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-damiun-wordmark">Users</h1>
        <p className="mt-1 text-sm text-damiun-muted">Roles and accounts (SuperAdmin).</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
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
        <input
          type="search"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-full border border-gray-200 px-4 py-2 text-sm shadow-sm outline-none focus:border-damiun-primary sm:w-64"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <article className="overflow-x-auto rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
        {loading ? (
          <p className="text-sm text-damiun-muted">Loading…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-damiun-muted">
                    No users match.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
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
                    <td className="text-sm capitalize text-damiun-muted">{user.status || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </article>

      {total > pageSize && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-damiun-muted">
          <span>
            Page {page} of {totalPages} ({total} users)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 font-semibold text-damiun-wordmark shadow-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 font-semibold text-damiun-wordmark shadow-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
