import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../api/endpoints";
import { StatCard } from "../components/ui/StatCard";
import { useLms } from "../data/LmsContext";

const PERIODS = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

export function AdminDashboardPage() {
  const { getToken } = useLms();
  const [period, setPeriod] = useState("month");
  const [finance, setFinance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) throw new Error("Not signed in");
    return adminApi.getFinanceSummary({ preset: period }, { token });
  }, [getToken, period]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await load();
        if (!cancelled) setFinance(data);
      } catch (e) {
        if (!cancelled) {
          setFinance(null);
          setError(e instanceof Error ? e.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const isProfit = finance?.is_profit ?? Number(finance?.net ?? 0) >= 0;
  const revenue = Number(finance?.revenue ?? 0);
  const expenses = Number(finance?.expenses ?? 0);
  const net = Number(finance?.net ?? 0);
  const publishedCourses = Number(finance?.published_courses ?? 0);
  const totalCourses = Number(finance?.total_courses ?? 0);
  const totalUsers = Number(finance?.total_users ?? 0);
  const students = Number(finance?.students ?? 0);
  const instructors = Number(finance?.instructors ?? 0);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-damiun-wordmark">Director overview</h1>
        <p className="mt-1 text-sm text-damiun-muted">Finance summary and platform snapshot from the gateway.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-damiun-muted">Period</span>
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            disabled={loading}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              period === p.id
                ? "bg-damiun-primary text-white shadow-sm"
                : "bg-white text-damiun-body shadow-sm ring-1 ring-gray-100 hover:bg-gray-50"
            }`}
          >
            {p.label}
          </button>
        ))}
        {loading ? <span className="text-xs text-damiun-muted">Updating…</span> : null}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div
        className={`rounded-2xl border p-6 shadow-sm sm:p-8 ${
          isProfit
            ? "border-emerald-200 bg-emerald-50/90 text-emerald-950"
            : "border-red-200 bg-red-50/90 text-red-950"
        }`}
      >
        <p className="text-sm font-bold uppercase tracking-wide opacity-80">
          {isProfit ? "In profit" : "At a loss"}
        </p>
        <p className="mt-2 text-3xl font-black tabular-nums sm:text-4xl">
          {new Intl.NumberFormat("uz-UZ").format(net)} so&apos;m
        </p>
        <p className="mt-2 text-sm opacity-90">
          Net = revenue ({revenue.toLocaleString()}) minus expenses ({expenses.toLocaleString()}) for
          selected period.
        </p>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Revenue"
          value={`${new Intl.NumberFormat("uz-UZ").format(revenue)} so'm`}
        />
        <StatCard
          label="Expenses"
          value={`${new Intl.NumberFormat("uz-UZ").format(expenses)} so'm`}
        />
        <StatCard
          label="Net"
          value={`${new Intl.NumberFormat("uz-UZ").format(net)} so'm`}
          helper={isProfit ? "Platform positive" : "Review payouts"}
        />
      </div>

      <div className="stats-grid">
        <StatCard label="All Users" value={totalUsers} />
        <StatCard label="Students" value={students} />
        <StatCard label="Instructors" value={instructors} />
      </div>

      <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50 sm:p-6">
        <h3 className="text-lg font-semibold text-damiun-wordmark">Platform snapshot</h3>
        <p className="mt-2 text-sm text-damiun-muted">Published courses: {publishedCourses}</p>
        <p className="mt-1 text-sm text-damiun-muted">Total courses in catalog: {totalCourses}</p>
        <p className="mt-1 text-sm text-damiun-muted">Role-based access: student / instructor / director</p>
        <p className="mt-1 text-sm text-damiun-muted">Admin reports and users live in the sidebar.</p>
      </article>
    </div>
  );
}
