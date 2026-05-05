import { StatCard } from "../components/ui/StatCard";
import { useLms } from "../data/LmsContext";

export function AdminDashboardPage() {
  const { courses, financeSummary, students, instructors, users } = useLms();

  const isProfit = financeSummary.net >= 0;

  return (
    <section className="stack">
      <h2>SuperAdmin Overview</h2>
      <div className="stats-grid">
        <StatCard
          label="Revenue"
          value={`${new Intl.NumberFormat("uz-UZ").format(financeSummary.revenue)} so'm`}
        />
        <StatCard
          label="Expenses"
          value={`${new Intl.NumberFormat("uz-UZ").format(financeSummary.expenses)} so'm`}
        />
        <StatCard
          label="Net"
          value={`${new Intl.NumberFormat("uz-UZ").format(financeSummary.net)} so'm`}
          helper={isProfit ? "In Profit" : "At a Loss"}
        />
      </div>

      <div className="stats-grid">
        <StatCard label="All Users" value={users.length} />
        <StatCard label="Students" value={students.length} />
        <StatCard label="Instructors" value={instructors.length} />
      </div>

      <article className="panel">
        <h3>Platform Snapshot</h3>
        <p>Published courses: {courses.length}</p>
        <p>Role-based access active: student / instructor / superadmin</p>
        <p>Admin reports and user list alohida panelda joylashgan.</p>
      </article>
    </section>
  );
}
