import { useMemo, useState } from "react";
import { payments } from "../../data/mockData";
import { useLms } from "../../data/LmsContext";
import { formatDate } from "../../utils/format";

const TABS = [
  { id: "enrollments", label: "Enrollments" },
  { id: "revenue", label: "Revenue" },
  { id: "students", label: "Students" },
  { id: "progress", label: "Progress" },
  { id: "quiz", label: "Quiz" },
  { id: "certificates", label: "Certificates" },
  { id: "instructors", label: "Instructors" },
  { id: "reviews", label: "Reviews" },
];

export function AdminReportsPage() {
  const { reportRows, exportReportCsv, courses, enrollments, students, users } = useLms();
  const [tab, setTab] = useState("enrollments");

  const revenueRows = useMemo(() => {
    return payments.map((p) => {
      const c = courses.find((x) => x.id === p.courseId);
      return {
        course: c?.title || p.courseId,
        amount: p.amount,
        payout: p.instructorPayout,
        net: p.amount - p.instructorPayout,
        date: p.date,
      };
    });
  }, [courses]);

  const totalRevenue = useMemo(() => revenueRows.reduce((s, r) => s + r.amount, 0), [revenueRows]);
  const freeVsPaid = useMemo(() => {
    let free = 0;
    let paid = 0;
    for (const r of revenueRows) {
      if (r.amount === 0) free += 1;
      else paid += 1;
    }
    return { free, paid };
  }, [revenueRows]);

  const studentsReport = useMemo(
    () =>
      students.map((s) => ({
        name: s.fullName,
        email: s.email,
        enrollments: enrollments.filter((e) => e.userId === s.id).length,
        completed: enrollments.filter((e) => e.userId === s.id && e.status === "completed").length,
      })),
    [students, enrollments],
  );

  const progressRows = useMemo(
    () =>
      courses.map((c) => {
        const rows = enrollments.filter((e) => e.courseId === c.id);
        const avgProgress = rows.length
          ? Math.round(rows.reduce((sum, e) => sum + (e.progress || 0), 0) / rows.length)
          : 0;
        const stuck = rows.filter((e) => e.status === "active" && (e.progress || 0) < 25).length;
        return { course: c.title, avgProgress, stuckLearners: stuck, active: rows.length };
      }),
    [courses, enrollments],
  );

  const quizAttemptRows = useMemo(
    () =>
      enrollments.flatMap((e) => {
        const c = courses.find((x) => x.id === e.courseId);
        const user = users.find((u) => u.id === e.userId);
        return (e.attempts || []).map((a, i) => ({
          id: `${e.id}-${i}`,
          course: c?.title,
          user: user?.fullName,
          score: a.score,
          date: a.submittedAt,
        }));
      }),
    [enrollments, courses, users],
  );

  const certRows = useMemo(
    () =>
      enrollments
        .filter((e) => e.certificate)
        .map((e) => {
          const c = courses.find((x) => x.id === e.courseId);
          const user = users.find((u) => u.id === e.userId);
          return {
            id: e.certificate.id,
            course: c?.title,
            student: user?.fullName,
            issued: e.certificate.issuedAt,
          };
        }),
    [enrollments, courses, users],
  );

  const reviewRows = useMemo(
    () =>
      courses.flatMap((c) =>
        (c.reviews || []).map((r) => ({
          id: r.id,
          course: c.title,
          author: r.author,
          rating: r.rating,
          text: r.text,
          date: r.date,
        })),
      ),
    [courses],
  );

  const coursesNoReviews = useMemo(
    () => courses.filter((c) => !(c.reviews && c.reviews.length)).map((c) => c.title),
    [courses],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-damiun-wordmark">Reports</h1>
          <p className="mt-1 text-sm text-damiun-muted">
            README report types with mock aggregates. Date-range filter can wire to backend later.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-damiun-wordmark shadow-sm transition hover:border-damiun-primary/40 hover:bg-damiun-nav-tint"
            onClick={() => exportReportCsv("enrollments")}
          >
            Export enrollments CSV
          </button>
          <button
            type="button"
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-damiun-wordmark shadow-sm transition hover:border-damiun-primary/40 hover:bg-damiun-nav-tint"
            onClick={() => exportReportCsv("instructors")}
          >
            Export instructors CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === t.id
                ? "bg-damiun-primary text-white shadow-sm"
                : "bg-white text-damiun-muted shadow-sm ring-1 ring-gray-100 hover:text-damiun-wordmark"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "enrollments" && (
        <article className="overflow-x-auto rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
          <h3 className="text-lg font-semibold text-damiun-wordmark">Enrollment report</h3>
          <table className="data-table mt-3">
            <thead>
              <tr>
                <th>Course</th>
                <th>Enrollments</th>
                <th>Completed</th>
                <th>Completion rate</th>
              </tr>
            </thead>
            <tbody>
              {reportRows.enrollmentsReport.map((row) => (
                <tr key={row.course}>
                  <td>{row.course}</td>
                  <td>{row.enrollments}</td>
                  <td>{row.completed}</td>
                  <td>{row.completionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      )}

      {tab === "revenue" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
              <p className="text-xs font-bold uppercase text-damiun-muted">Total revenue</p>
              <p className="mt-2 text-2xl font-bold text-damiun-wordmark">
                {new Intl.NumberFormat("uz-UZ").format(totalRevenue)} so&apos;m
              </p>
            </article>
            <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
              <p className="text-xs font-bold uppercase text-damiun-muted">Paid rows</p>
              <p className="mt-2 text-2xl font-bold text-damiun-wordmark">{freeVsPaid.paid}</p>
            </article>
            <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
              <p className="text-xs font-bold uppercase text-damiun-muted">Free rows</p>
              <p className="mt-2 text-2xl font-bold text-damiun-wordmark">{freeVsPaid.free}</p>
            </article>
          </div>
          <article className="overflow-x-auto rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
            <h3 className="text-lg font-semibold text-damiun-wordmark">Revenue by payment</h3>
            <table className="data-table mt-3">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Amount</th>
                  <th>Instructor payout</th>
                  <th>Net</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {revenueRows.map((row, i) => (
                  <tr key={`${row.course}-${i}`}>
                    <td>{row.course}</td>
                    <td>{row.amount}</td>
                    <td>{row.payout}</td>
                    <td>{row.net}</td>
                    <td>{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        </div>
      )}

      {tab === "students" && (
        <article className="overflow-x-auto rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
          <h3 className="text-lg font-semibold text-damiun-wordmark">Students report</h3>
          <table className="data-table mt-3">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Enrollments</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {studentsReport.map((row) => (
                <tr key={row.email}>
                  <td>{row.name}</td>
                  <td>{row.email}</td>
                  <td>{row.enrollments}</td>
                  <td>{row.completed}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-sm text-damiun-muted">
            Growth (mock): {reportRows.studentsGrowth.map((g) => `${g.month}:${g.value}`).join(" · ")}
          </p>
        </article>
      )}

      {tab === "progress" && (
        <article className="overflow-x-auto rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
          <h3 className="text-lg font-semibold text-damiun-wordmark">Progress report</h3>
          <p className="mt-1 text-sm text-damiun-muted">Average progress and potentially stuck learners (progress under 25%).</p>
          <table className="data-table mt-3">
            <thead>
              <tr>
                <th>Course</th>
                <th>Avg progress</th>
                <th>Stuck (&lt;25%)</th>
                <th>Active enrollments</th>
              </tr>
            </thead>
            <tbody>
              {progressRows.map((row) => (
                <tr key={row.course}>
                  <td>{row.course}</td>
                  <td>{row.avgProgress}%</td>
                  <td>{row.stuckLearners}</td>
                  <td>{row.active}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      )}

      {tab === "quiz" && (
        <div className="space-y-4">
          <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
            <h3 className="text-lg font-semibold text-damiun-wordmark">Quiz overview</h3>
            <p className="mt-2 text-sm text-damiun-muted">Total attempts: {reportRows.quizOverview.totalAttempts}</p>
            <p className="mt-1 text-sm text-damiun-muted">Average score: {reportRows.quizOverview.averageScore}%</p>
          </article>
          <article className="overflow-x-auto rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
            <h3 className="text-lg font-semibold text-damiun-wordmark">Attempts</h3>
            <table className="data-table mt-3">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Student</th>
                  <th>Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {quizAttemptRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-damiun-muted">
                      No attempts
                    </td>
                  </tr>
                ) : (
                  quizAttemptRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.course}</td>
                      <td>{row.user}</td>
                      <td>{row.score}%</td>
                      <td>{formatDate(row.date)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </article>
        </div>
      )}

      {tab === "certificates" && (
        <article className="overflow-x-auto rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
          <h3 className="text-lg font-semibold text-damiun-wordmark">Certificates issued</h3>
          <table className="data-table mt-3">
            <thead>
              <tr>
                <th>ID</th>
                <th>Course</th>
                <th>Student</th>
                <th>Issued</th>
              </tr>
            </thead>
            <tbody>
              {certRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-damiun-muted">
                    No certificates
                  </td>
                </tr>
              ) : (
                certRows.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono text-xs">{row.id}</td>
                    <td>{row.course}</td>
                    <td>{row.student}</td>
                    <td>{formatDate(row.issued)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </article>
      )}

      {tab === "instructors" && (
        <article className="overflow-x-auto rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
          <h3 className="text-lg font-semibold text-damiun-wordmark">Instructor report</h3>
          <table className="data-table mt-3">
            <thead>
              <tr>
                <th>Instructor</th>
                <th>Courses</th>
                <th>Students</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {reportRows.instructorReport.map((row) => (
                <tr key={row.instructor}>
                  <td>{row.instructor}</td>
                  <td>{row.courses}</td>
                  <td>{row.students}</td>
                  <td>{row.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      )}

      {tab === "reviews" && (
        <div className="space-y-4">
          <article className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 text-sm text-amber-950">
            <p className="font-semibold">Courses with no reviews</p>
            <p className="mt-1 text-damiun-body">
              {coursesNoReviews.length ? coursesNoReviews.join(", ") : "All courses have at least one review."}
            </p>
          </article>
          <article className="overflow-x-auto rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
            <h3 className="text-lg font-semibold text-damiun-wordmark">Recent reviews</h3>
            <table className="data-table mt-3">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Author</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {reviewRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-damiun-muted">
                      No reviews
                    </td>
                  </tr>
                ) : (
                  reviewRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.course}</td>
                      <td>{row.author}</td>
                      <td>{row.rating}</td>
                      <td className="max-w-xs truncate">{row.text}</td>
                      <td>{formatDate(row.date)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </article>
        </div>
      )}
    </div>
  );
}
