import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "../../api/endpoints";
import { useLms } from "../../data/LmsContext";
import { normalizeLmsRole } from "../../utils/authRouting";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from "../../components/ui/dialog";

function initials(name) {
  if (!name?.trim()) return "?";
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const ROLES = ["all", "student", "instructor", "director"];

function formatMoney(amount) {
  if (!amount && amount !== 0) return "—";
  return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
}

function mapUser(u) {
  if (!u || typeof u !== "object") return null;
  return {
    id: String(u.id),
    fullName: u.full_name ?? "",
    email: u.email ?? "",
    role: normalizeLmsRole(u.role),
    avatar: u.avatar_url ?? "",
    status: u.status ?? "",
    salary: Number(u.salary ?? u.monthly_salary ?? 0),
  };
}

const ASSIGNABLE_ROLES = ["student", "instructor", "director"];

function EditUserModal({ user, onClose, onSaved }) {
  const { getToken } = useLms();
  const [salary, setSalary] = useState(String(user.salary || ""));
  const [role, setRole] = useState(user.role);
  const [saving, setSaving] = useState(false);

  const isInstructor = role === "instructor";

  async function handleSubmit(e) {
    e.preventDefault();
    const token = getToken();
    const tasks = [];

    if (role !== user.role) {
      tasks.push(adminApi.assignRole({ user_id: user.id, role }, { token }));
    }

    if (isInstructor) {
      const amount = Number(salary);
      if (isNaN(amount) || amount < 0) {
        toast.error("Iltimos, to'g'ri summa kiriting");
        return;
      }
      if (amount !== user.salary) {
        tasks.push(
          adminApi.updateInstructorSalary({ instructor_id: user.id, salary: amount }, { token }),
        );
      }
    }

    if (tasks.length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      await Promise.all(tasks);
      toast.success("Saqlandi");
      onSaved({ role, salary: isInstructor ? Number(salary) : user.salary });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Foydalanuvchini tahrirlash</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-damiun-nav-tint text-xs font-bold text-damiun-primary">
                  {initials(user.fullName)}
                </span>
              )}
              <div>
                <p className="font-semibold text-damiun-wordmark">{user.fullName}</p>
                <p className="text-xs text-damiun-muted">{user.email}</p>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-damiun-wordmark">Role</label>
              <div className="flex gap-2">
                {ASSIGNABLE_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold capitalize transition ${
                      role === r
                        ? "bg-damiun-primary text-white"
                        : "bg-gray-100 text-damiun-muted hover:text-damiun-wordmark"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {isInstructor && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-damiun-wordmark">
                  Oylik maosh (so'm)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="Masalan: 3000000"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-damiun-primary"
                />
                {salary && !isNaN(Number(salary)) && Number(salary) > 0 && (
                  <p className="text-xs text-damiun-muted">{formatMoney(Number(salary))}</p>
                )}
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-damiun-muted hover:text-damiun-wordmark"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-damiun-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saqlanmoqda…" : "Saqlash"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
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
  const [editTarget, setEditTarget] = useState(null);

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
        <p className="mt-1 text-sm text-damiun-muted">Roles and accounts (Director).</p>
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
                <th>Salary</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-damiun-muted">
                    No users match.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => setEditTarget(user)}
                    className="cursor-pointer hover:bg-damiun-nav-tint/40 transition-colors"
                  >
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
                    <td className="text-sm text-damiun-muted">
                      {user.role === "instructor" ? (
                        <span className="inline-flex items-center gap-1">
                          {user.salary ? formatMoney(user.salary) : <span className="text-gray-400">Set salary</span>}
                          <svg className="h-3.5 w-3.5 text-damiun-primary opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.5-6.5a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-.828.481l-3 .75.75-3a2 2 0 01.481-.828z" />
                          </svg>
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </article>

      {editTarget && (
        <EditUserModal
          user={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={({ role, salary }) => {
            setUsers((prev) =>
              prev.map((u) => u.id === editTarget.id ? { ...u, role, salary } : u),
            );
            setEditTarget(null);
          }}
        />
      )}

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
