import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Award, BookOpen, ClipboardList } from "lucide-react";
import { StatCard } from "../components/ui/StatCard";
import { useLms } from "../data/LmsContext";
import { formatDate } from "../utils/format";

export function StudentDashboardPage() {
  const { courses, myEnrollments } = useLms();

  const stats = useMemo(() => {
    const active = myEnrollments.filter((e) => e.status === "active").length;
    const completed = myEnrollments.filter((e) => e.status === "completed").length;
    return { enrolled: myEnrollments.length, active, completed };
  }, [myEnrollments]);

  const quizRows = useMemo(() => {
    const rows = [];
    for (const en of myEnrollments) {
      const course = courses.find((c) => c.id === en.courseId);
      if (!course) continue;
      for (const att of en.attempts || []) {
        rows.push({
          id: `${en.id}-${att.submittedAt}`,
          courseTitle: course.title,
          score: att.score,
          submittedAt: att.submittedAt,
        });
      }
    }
    rows.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    return rows;
  }, [myEnrollments, courses]);

  if (myEnrollments.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
        <h2 className="text-xl font-bold text-damiun-wordmark">My learning</h2>
        <p className="mt-2 text-sm text-damiun-muted">
          Hali enroll qilgan kurs yo&apos;q.{" "}
          <Link to="/catalog" className="font-semibold text-damiun-primary hover:underline">
            Catalogdan boshlang
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-damiun-wordmark">My learning dashboard</h1>
        <p className="mt-1 text-sm text-damiun-muted">Progress, quiz attempts, and certificates (README).</p>
      </div>

      <div className="stats-grid">
        <StatCard label="Enrolled" value={stats.enrolled} helper="Total courses" />
        <StatCard label="Active" value={stats.active} helper="In progress" />
        <StatCard label="Completed" value={stats.completed} helper="Finished" />
      </div>

      <div className="flex flex-col gap-5">
        {myEnrollments.map((enrollment) => {
          const course = courses.find((item) => item.id === enrollment.courseId);
          if (!course) return null;

          const lessons = course.modules.flatMap((module) => module.lessons);
          const nextLesson = lessons.find((lesson) => !enrollment.completedLessonIds.includes(lesson.id));
          const latestAttempt = enrollment.attempts[enrollment.attempts.length - 1];

          return (
            <article
              key={enrollment.id}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm ring-1 ring-gray-50"
            >
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
                <div className="h-28 w-full shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-36">
                  <img src={course.coverImage} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold text-damiun-wordmark">{course.title}</h2>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                        enrollment.status === "completed"
                          ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"
                          : "bg-damiun-nav-tint text-damiun-primary ring-1 ring-damiun-primary/15"
                      }`}
                    >
                      {enrollment.status}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-damiun-primary transition-all"
                        style={{ width: `${enrollment.progress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs font-medium text-damiun-muted">{enrollment.progress}% completed</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {nextLesson ? (
                      <Link
                        to={`/learn/${course.id}/${nextLesson.id}`}
                        className="inline-flex rounded-full bg-damiun-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-damiun-primary-hover"
                      >
                        Continue: {nextLesson.title}
                      </Link>
                    ) : (
                      <p className="text-sm text-damiun-muted">Barcha lessonlar tugallangan.</p>
                    )}

                    <Link
                      to={`/quiz/${course.id}`}
                      className="inline-flex rounded-full border border-damiun-primary px-4 py-2 text-sm font-semibold text-damiun-primary transition hover:bg-damiun-nav-tint"
                    >
                      Final quiz
                    </Link>
                  </div>

                  {latestAttempt ? (
                    <p className="mt-3 text-xs text-damiun-muted">
                      Last attempt: {latestAttempt.score}% ({formatDate(latestAttempt.submittedAt)})
                    </p>
                  ) : (
                    <p className="mt-3 text-xs text-damiun-muted">Quiz attempt hali yo&apos;q.</p>
                  )}

                  {enrollment.certificate ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-damiun-nav-tint/60 px-3 py-2 text-xs text-damiun-body">
                      <Award className="h-4 w-4 shrink-0 text-damiun-primary" />
                      <span>
                        Certificate: <strong className="text-damiun-wordmark">{enrollment.certificate.id}</strong>
                      </span>
                      <Link
                        to="/certificates"
                        className="font-semibold text-damiun-primary hover:underline"
                      >
                        View
                      </Link>
                      <Link
                        to={`/verify/${encodeURIComponent(enrollment.certificate.id)}`}
                        className="font-semibold text-damiun-muted hover:text-damiun-primary hover:underline"
                      >
                        Public verify
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-damiun-primary" />
          <h2 className="text-lg font-bold text-damiun-wordmark">Quiz attempt history</h2>
        </div>
        {quizRows.length === 0 ? (
          <p className="text-sm text-damiun-muted">No quiz attempts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full min-w-[320px] text-left text-sm">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {quizRows.map((row) => (
                  <tr key={row.id}>
                    <td className="font-medium text-damiun-wordmark">{row.courseTitle}</td>
                    <td>{row.score}%</td>
                    <td className="text-damiun-muted">{formatDate(row.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="flex items-center gap-2 text-sm text-damiun-muted">
        <BookOpen className="h-4 w-4" />
        <Link to="/certificates" className="font-semibold text-damiun-primary hover:underline">
          Certificates hub
        </Link>
      </p>
    </div>
  );
}
