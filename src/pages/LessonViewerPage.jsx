import { CheckCircle2 } from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useLms } from "../data/LmsContext";

function getYouTubeId(url) {
  const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return m?.[1] ?? null;
}

export function LessonViewerPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { courses, enrollmentByCourseId, completeLesson } = useLms();

  const course = useMemo(() => courses.find((c) => c.id === courseId), [courses, courseId]);

  const allLessons = useMemo(
    () => course?.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleTitle: m.title, moduleId: m.id }))) ?? [],
    [course],
  );

  const lessonIndex = allLessons.findIndex((l) => l.id === lessonId);
  const lesson = allLessons[lessonIndex] ?? allLessons[0];
  const nextLesson = allLessons[lessonIndex + 1];

  const enrollment = enrollmentByCourseId[courseId];
  const completed = new Set(enrollment?.completedLessonIds ?? []);

  if (!course) return <div className="flex h-full items-center justify-center text-gray-400">Course not found.</div>;
  if (!lesson) return <div className="flex h-full items-center justify-center text-gray-400">Lesson not found.</div>;

  const canAccess = lesson.isPreview || Boolean(enrollment);
  if (!canAccess) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-gray-600">This lesson is only available after enrollment.</p>
        <Link to={`/courses/${courseId}`} className="rounded-full bg-[#149ad9] px-6 py-2.5 text-sm font-semibold text-white">
          View Course
        </Link>
      </div>
    );
  }

  const ytId = getYouTubeId(lesson.resourceUrl);
  const completedCount = allLessons.filter((l) => completed.has(l.id)).length;
  const progressPct = allLessons.length > 0 ? completedCount / allLessons.length : 0;

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left sidebar: course + lesson list ── */}
      <aside className="relative flex w-[260px] flex-shrink-0 flex-col overflow-y-auto border-r border-gray-100 bg-white">
        {/* orange progress bar along left edge */}
        <div className="absolute left-0 top-0 w-1 rounded-r-full bg-gray-100" style={{ height: "100%" }}>
          <div
            className="w-full rounded-r-full bg-orange-400 transition-all duration-500"
            style={{ height: `${progressPct * 100}%` }}
          />
        </div>

        {/* Course thumbnail */}
        <div className="overflow-hidden">
          <img src={course.coverImage} alt={course.title} className="h-40 w-full object-cover" />
        </div>

        {/* Course meta */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Course</p>
          <p className="mt-1 text-sm font-bold leading-snug text-gray-900">{course.title}</p>
        </div>

        {/* Module + lesson list */}
        <div className="flex flex-col gap-5 px-4 pb-6">
          {course.modules.map((mod) => (
            <div key={mod.id}>
              <p className="mb-2 px-1 text-xs font-bold text-gray-800">{mod.title}</p>
              <ul className="flex flex-col gap-1">
                {mod.lessons.map((l) => {
                  const isActive = l.id === lesson.id;
                  const isDone = completed.has(l.id);
                  return (
                    <li key={l.id}>
                      <button
                        onClick={() => navigate(`/learn/${courseId}/${l.id}`)}
                        className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition ${
                          isActive
                            ? "bg-[#149ad9] text-white"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span className="line-clamp-1 flex-1">{l.title}</span>
                        {isDone && !isActive && (
                          <CheckCircle2 size={14} className="flex-shrink-0 text-[#149ad9]" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Right: video + controls ── */}
      <div className="flex flex-1 flex-col overflow-hidden bg-[#f5f6fa]">
        {/* Video player */}
        <div className="flex-1 overflow-hidden bg-gray-900">
          {ytId ? (
            <iframe
              key={ytId}
              src={`https://www.youtube.com/embed/${ytId}?autoplay=0`}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          ) : lesson.resourceUrl ? (
            <iframe
              key={lesson.resourceUrl}
              src={lesson.resourceUrl}
              title={lesson.title}
              className="h-full w-full border-0"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full flex-col items-start justify-start overflow-y-auto bg-gray-900 p-10">
              <p className="max-w-2xl text-base leading-relaxed text-gray-200">{lesson.content}</p>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-shrink-0 items-center justify-between border-t border-gray-100 bg-white px-8 py-5">
          <div>
            <p className="text-xl font-bold text-gray-900">{lesson.title}</p>
            <p className="mt-0.5 text-sm text-gray-400">{lesson.moduleTitle}</p>
          </div>

          <div className="flex items-center gap-3">
            {!completed.has(lesson.id) && (
              <button
                onClick={() => completeLesson(courseId, lesson.id)}
                className="rounded-full border border-[#149ad9] px-5 py-2.5 text-sm font-semibold text-[#149ad9] transition hover:bg-[#e8f5fd]"
              >
                Mark Complete
              </button>
            )}
            {nextLesson ? (
              <Link
                to={`/learn/${courseId}/${nextLesson.id}`}
                className="rounded-full bg-[#149ad9] px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f8dc8]"
              >
                Next Video
              </Link>
            ) : (
              <Link
                to={`/quiz/${courseId}`}
                className="rounded-full bg-[#149ad9] px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f8dc8]"
              >
                Take Quiz
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
