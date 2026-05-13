import { useMemo, useState } from "react";
import { StatCard } from "../components/ui/StatCard";
import { useLms } from "../data/LmsContext";

const PERIODS = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

export function AdminDashboardPage() {
  const { courses, financeSummary, students, instructors, users } = useLms();
  const [period, setPeriod] = useState("month");

  const isProfit = financeSummary.net >= 0;

  const adjustedFinance = useMemo(() => {
    const factor = period === "day" ? 0.12 : period === "week" ? 0.45 : 1;
    const revenue = Math.round(financeSummary.revenue * factor);
    const expenses = Math.round(financeSummary.expenses * factor);
    return {
      revenue,
      expenses,
      net: revenue - expenses,
      factorLabel: period === "day" ? "last 24h (demo)" : period === "week" ? "last 7 days (demo)" : "full period (demo)",
    };
  }, [financeSummary, period]);

  const publishedCount = useMemo(
    () => courses.filter((c) => c.status === "published").length,
    [courses],
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-damiun-wordmark">SuperAdmin overview</h1>
        <p className="mt-1 text-sm text-damiun-muted">Finance summary and platform snapshot (README).</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-damiun-muted">Period</span>
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              period === p.id
                ? "bg-damiun-primary text-white shadow-sm"
                : "bg-white text-damiun-body shadow-sm ring-1 ring-gray-100 hover:bg-gray-50"
            }`}
          >
            {p.label}
          </button>
        ))}
        <span className="text-xs text-damiun-muted">({adjustedFinance.factorLabel})</span>
      </div>

      <div
        className={`rounded-2xl border p-6 shadow-sm sm:p-8 ${
          adjustedFinance.net >= 0
            ? "border-emerald-200 bg-emerald-50/90 text-emerald-950"
            : "border-red-200 bg-red-50/90 text-red-950"
        }`}
      >
        <p className="text-sm font-bold uppercase tracking-wide opacity-80">
          {adjustedFinance.net >= 0 ? "In profit" : "At a loss"}
        </p>
        <p className="mt-2 text-3xl font-black tabular-nums sm:text-4xl">
          {new Intl.NumberFormat("uz-UZ").format(adjustedFinance.net)} so&apos;m
        </p>
        <p className="mt-2 text-sm opacity-90">Net = revenue ({adjustedFinance.revenue.toLocaleString()}) minus expenses ({adjustedFinance.expenses.toLocaleString()}) for selected window.</p>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Revenue"
          value={`${new Intl.NumberFormat("uz-UZ").format(adjustedFinance.revenue)} so'm`}
        />
        <StatCard
          label="Expenses"
          value={`${new Intl.NumberFormat("uz-UZ").format(adjustedFinance.expenses)} so'm`}
        />
        <StatCard
          label="Net"
          value={`${new Intl.NumberFormat("uz-UZ").format(adjustedFinance.net)} so'm`}
          helper={isProfit ? "Platform positive" : "Review payouts"}
        />
      </div>

      <div className="stats-grid">
        <StatCard label="All Users" value={users.length} />
        <StatCard label="Students" value={students.length} />
        <StatCard label="Instructors" value={instructors.length} />
      </div>

      <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50 sm:p-6">
        <h3 className="text-lg font-semibold text-damiun-wordmark">Platform snapshot</h3>
        <p className="mt-2 text-sm text-damiun-muted">Published courses: {publishedCount}</p>
        <p className="mt-1 text-sm text-damiun-muted">Total courses in catalog: {courses.length}</p>
        <p className="mt-1 text-sm text-damiun-muted">Role-based access: student / instructor / superadmin</p>
        <p className="mt-1 text-sm text-damiun-muted">Admin reports and users live in the sidebar.</p>
      </article>
    </div>
  );
}
