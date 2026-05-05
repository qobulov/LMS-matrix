import { useLms } from "../../data/LmsContext";

export function AdminReportsPage() {
  const { reportRows, exportReportCsv } = useLms();

  return (
    <section className="stack">
      <div className="row-between">
        <h2>Reports</h2>
        <div className="row-gap">
          <button className="btn btn-secondary" onClick={() => exportReportCsv("enrollments")}>
            Export Enrollments CSV
          </button>
          <button className="btn btn-secondary" onClick={() => exportReportCsv("instructors")}>
            Export Instructors CSV
          </button>
        </div>
      </div>

      <article className="panel">
        <h3>Enrollment Report</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Enrollments</th>
              <th>Completed</th>
              <th>Completion Rate</th>
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

      <article className="panel">
        <h3>Quiz Overview</h3>
        <p>Total attempts: {reportRows.quizOverview.totalAttempts}</p>
        <p>Average score: {reportRows.quizOverview.averageScore}%</p>
      </article>

      <article className="panel">
        <h3>Instructor Report</h3>
        <table className="data-table">
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
    </section>
  );
}
