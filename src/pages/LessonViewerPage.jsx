import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useLms } from "../data/LmsContext";

export function LessonViewerPage() {
  const { courseId, lessonId } = useParams();
  const { courses, enrollmentByCourseId, completeLesson } = useLms();

  const course = useMemo(
    () => courses.find((item) => item.id === courseId),
    [courses, courseId],
  );

  if (!course) return <p>Course topilmadi.</p>;

  const lessons = course.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({ ...lesson, moduleTitle: module.title })),
  );

  const lessonIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
  const lesson = lessons[lessonIndex] || lessons[0];

  if (!lesson) return <p>Lesson topilmadi.</p>;

  const nextLesson = lessons[lessonIndex + 1];
  const enrollment = enrollmentByCourseId[courseId];
  const canAccess = lesson.isPreview || Boolean(enrollment);

  if (!canAccess) {
    return (
      <section className="panel">
        <h2>Bu lesson faqat enrolled studentlar uchun.</h2>
        <Link to={`/courses/${courseId}`} className="btn btn-primary">
          Coursega qaytish
        </Link>
      </section>
    );
  }

  const markCompleted = () => completeLesson(courseId, lesson.id);

  return (
    <section className="lesson-view">
      <article className="panel">
        <p className="eyebrow">{lesson.moduleTitle}</p>
        <h2>{lesson.title}</h2>
        <p>
          Type: <strong>{lesson.type}</strong> | Duration: <strong>{lesson.durationMin} min</strong>
        </p>

        <div className="lesson-content">
          <p>{lesson.content}</p>
          {lesson.resourceUrl ? (
            <a href={lesson.resourceUrl} target="_blank" rel="noreferrer" className="link-btn">
              Open Resource
            </a>
          ) : null}
        </div>

        <div className="row-gap">
          <button className="btn btn-primary" onClick={markCompleted}>
            Complete Lesson
          </button>
          {nextLesson ? (
            <Link
              className="btn btn-secondary"
              to={`/learn/${courseId}/${nextLesson.id}`}
            >
              Next Lesson
            </Link>
          ) : (
            <Link className="btn btn-secondary" to={`/quiz/${courseId}`}>
              Take Final Quiz
            </Link>
          )}
        </div>
      </article>

      <article className="panel">
        <h3>Module Navigation</h3>
        <div className="stack">
          {course.modules.map((module) => (
            <div key={module.id}>
              <strong>{module.title}</strong>
              <ul>
                {module.lessons.map((item) => (
                  <li key={item.id}>
                    <Link to={`/learn/${courseId}/${item.id}`}>{item.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
