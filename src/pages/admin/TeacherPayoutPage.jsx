import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../api/endpoints";
import { useLms } from "../../data/LmsContext";
import { toast } from "sonner";

function formatMoney(amount) {
  if (!amount && amount !== 0) return "—";
  return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
}

function initials(name) {
  if (!name?.trim()) return "?";
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TeacherPayoutPage() {
  const { getToken } = useLms();
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    instructor_id: "",
    instructor_name: "",
    amount: "",
    note: "",
  });

  const [instructors, setInstructors] = useState([]);
  const [balance, setBalance] = useState(null);

  const loadPayouts = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getInstructorPayouts({}, { token });
      const list = (data.payouts ?? data ?? []).map((p) => ({
        id: String(p.id ?? p.guid ?? ""),
        instructorName: p.instructor_name ?? p.instructor?.full_name ?? "",
        instructorAvatar: p.instructor_avatar ?? p.instructor?.avatar_url ?? "",
        amount: Number(p.amount ?? 0),
        note: p.note ?? p.comment ?? "",
        status: p.status ?? "paid",
        date: p.created_at ?? p.date ?? "",
      }));
      setPayouts(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load payouts");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  const loadInstructors = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const data = await adminApi.getInstructors({ token });
      const raw = data.instructors ?? data ?? [];
      const list = (Array.isArray(raw) ? raw : []).map((u) => ({
        id: String(u.id ?? u.guid ?? ""),
        fullName: u.full_name ?? u.fullName ?? "",
        avatar: u.avatar_url ?? "",
        salary: Number(u.salary ?? u.monthly_salary ?? 0),
      }));
      setInstructors(list);
    } catch {
      // silent
    }
  }, [getToken]);

  const loadBalance = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const data = await adminApi.getBalance({ token });
      setBalance(Number(data.balance ?? 0));
    } catch {
      // silent
    }
  }, [getToken]);

  useEffect(() => {
    loadPayouts();
    loadInstructors();
    loadBalance();
  }, [loadPayouts, loadInstructors, loadBalance]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.instructor_id || !form.amount) {
      toast.error("Instructor va summa tanlang");
      return;
    }
    if (balance !== null && Number(form.amount) > balance) {
      toast.error("Balans yetarli emas");
      return;
    }
    const token = getToken();
    if (!token) return;
    setSubmitting(true);
    try {
      await adminApi.createPayout(
        {
          instructor_id: form.instructor_id,
          amount: Number(form.amount),
          note: form.note.trim(),
        },
        { token },
      );
      toast.success("To'lov muvaffaqiyatli amalga oshirildi");
      setForm({ instructor_id: "", instructor_name: "", amount: "", note: "" });
      setShowForm(false);
      loadPayouts();
      loadBalance();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "To'lov amalga oshmadi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-damiun-wordmark">Teacher Payouts</h1>
          <p className="mt-1 text-sm text-damiun-muted">Instructorlarga to'lovlar tarixi.</p>
        </div>
        <div className="flex items-center gap-4">
          {balance !== null && (
            <div className="rounded-full bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700">
              Balans: {formatMoney(balance)}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-full bg-damiun-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-damiun-primary-hover"
          >
            {showForm ? "Bekor qilish" : "+ Yangi to'lov"}
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-50"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-damiun-wordmark">
              Instructor
              <select
                value={form.instructor_id}
                onChange={(e) => {
                  const id = e.target.value;
                  const ins = instructors.find((i) => i.id === id);
                  setForm((f) => ({
                    ...f,
                    instructor_id: id,
                    amount: ins?.salary ? String(ins.salary) : f.amount,
                  }));
                }}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
                required
              >
                <option value="">Tanlang...</option>
                {instructors.map((ins) => (
                  <option key={ins.id} value={ins.id}>
                    {ins.fullName}{ins.salary ? ` — ${formatMoney(ins.salary)}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-damiun-wordmark">
              Summa (so'm)
              <input
                type="number"
                min="1000"
                step="1000"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="500000"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
                required
              />
            </label>
            <label className="block text-sm font-medium text-damiun-wordmark sm:col-span-2">
              Izoh (ixtiyoriy)
              <input
                type="text"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="May oyi uchun to'lov"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 rounded-full bg-damiun-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-damiun-primary-hover disabled:opacity-60"
          >
            {submitting ? "Yuborilmoqda…" : "To'lovni tasdiqlash"}
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <article className="overflow-x-auto rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
        {loading ? (
          <p className="text-sm text-damiun-muted">Loading…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Instructor</th>
                <th>Summa</th>
                <th>Izoh</th>
                <th>Status</th>
                <th>Sana</th>
              </tr>
            </thead>
            <tbody>
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-damiun-muted">
                    Hali to'lovlar mavjud emas.
                  </td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {p.instructorAvatar ? (
                          <img src={p.instructorAvatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-damiun-nav-tint text-xs font-bold text-damiun-primary">
                            {initials(p.instructorName)}
                          </span>
                        )}
                        <span className="font-medium text-damiun-wordmark">{p.instructorName}</span>
                      </div>
                    </td>
                    <td className="font-semibold text-damiun-wordmark">{formatMoney(p.amount)}</td>
                    <td className="text-sm text-damiun-muted">{p.note || "—"}</td>
                    <td>
                      <span className="inline-block h-4 w-4 rounded-full bg-green-500" title="paid" />
                    </td>
                    <td className="text-sm text-damiun-muted">
                      {p.date ? new Intl.DateTimeFormat("uz-UZ", { year: "numeric", month: "short", day: "numeric" }).format(new Date(p.date)) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </article>
    </div>
  );
}
