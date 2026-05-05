import { Link } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { useLms } from "../data/LmsContext";
import { formatDate } from "../utils/format";

export function StudentDashboardPage() {
  const { courses, myEnrollments } = useLms();

  if (myEnrollments.length === 0) {
    return (
      <section>
        <h2>My Learning</h2>
        <p>Hali enroll qilgan kurs yo'q. Catalogdan boshlang.</p>
      </section>
    );
  }

  return (
    <section className="stack">
      <h2>My Learning Dashboard</h2>
      {myEnrollments.map((enrollment) => {
        const course = courses.find((item) => item.id === enrollment.courseId);
        if (!course) return null;

        const lessons = course.modules.flatMap((module) => module.lessons);
        const nextLesson = lessons.find(
          (lesson) => !enrollment.completedLessonIds.includes(lesson.id),
        );
        const latestAttempt = enrollment.attempts[enrollment.attempts.length - 1];

        return (
          <article className="panel" key={enrollment.id}>
            <div className="row-between">
              <h3>{course.title}</h3>
              <Badge tone={enrollment.status === "completed" ? "success" : "default"}>
                {enrollment.status}
              </Badge>
            </div>

            <div className="progress-track">
              <div style={{ width: `${enrollment.progress}%` }} className="progress-value" />
            </div>
            <p>{enrollment.progress}% completed</p>

            <div className="row-gap">
              {nextLesson ? (
                <Link className="btn btn-secondary" to={`/learn/${course.id}/${nextLesson.id}`}>
                  Continue: {nextLesson.title}
                </Link>
              ) : (
                <p>Barcha lessonlar tugallangan.</p>
              )}

              <Link className="link-btn" to={`/quiz/${course.id}`}>
                Final Quiz
              </Link>
            </div>

            {latestAttempt ? (
              <p>
                Last attempt: {latestAttempt.score}% ({formatDate(latestAttempt.submittedAt)})
              </p>
            ) : (
              <p>Quiz attempt hali yo'q.</p>
            )}

            {enrollment.certificate ? (
              <p>
                Certificate: <strong>{enrollment.certificate.id}</strong>
              </p>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
