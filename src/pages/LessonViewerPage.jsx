import { CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { enrollmentApi } from "../api/endpoints";
import { useLms } from "../data/LmsContext";

function getYouTubeId(url) {
  const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return m?.[1] ?? null;
}

function mapViewerToState(data, courseIdStr, lessonIdStr) {
  const d = data ?? {};
  const lessonCurrent = d.lesson ?? {};
  const completedIds = new Set((d.completed_lesson_ids ?? []).map(String));
  const modules = (d.modules ?? []).map((m) => ({
    id: String(m.id),
    title: m.title ?? "",
    lessons: (m.lessons ?? []).map((l) => {
      const id = String(l.id);
      const isCurrent = id === String(lessonCurrent.id ?? lessonIdStr);
      return {
        id,
        title: l.title ?? "",
        isPreview: Boolean(l.is_preview),
        durationMin: isCurrent ? (lessonCurrent.duration_min ?? l.duration_min ?? 0) : (l.duration_min ?? 0),
        resourceUrl: isCurrent ? (lessonCurrent.video_url ?? "") : "",
        type: "video",
        content: "",
        moduleTitle: m.title,
        moduleId: String(m.id),
      };
    }),
  }));

  const course = {
    id: String(d.course?.id ?? courseIdStr),
    title: d.course?.title ?? "",
    coverImage: d.course?.cover_image ?? "",
    modules,
  };

  return { course, completedIds };
}

export function LessonViewerPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useLms();
  const [course, setCourse] = useState(null);
  const [completed, setCompleted] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    const token = getToken();
    if (!courseId || !lessonId) return;
    const raw = await enrollmentApi.getLessonViewer(
      courseId,
      lessonId,
      token ? { token } : {},
    );
    const { course: c, completedIds } = mapViewerToState(raw, courseId, lessonId);
    setCourse(c);
    setCompleted(completedIds);
  }, [courseId, lessonId, getToken]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        await load();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load lesson");
          setCourse(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const allLessons = useMemo(
    () => course?.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleTitle: m.title, moduleId: m.id }))) ?? [],
    [course],
  );

  const lessonIndex = allLessons.findIndex((l) => l.id === lessonId);
  const lesson = allLessons[lessonIndex] ?? allLessons[0];
  const nextLesson = allLessons[lessonIndex + 1];

  if (loading) {
    return <div className="flex h-full items-center justify-center text-gray-400">Loading…</div>;
  }

  if (error || !course) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-gray-600">{error || "Course not found."}</p>
        <Link to={`/courses/${courseId}`} className="rounded-full bg-damiun-primary px-6 py-2.5 text-sm font-semibold text-white">
          View Course
        </Link>
      </div>
    );
  }

  if (!lesson) {
    return <div className="flex h-full items-center justify-center text-gray-400">Lesson not found.</div>;
  }

  const ytId = getYouTubeId(lesson.resourceUrl);
  const completedCount = allLessons.filter((l) => completed.has(l.id)).length;
  const progressPct = allLessons.length > 0 ? completedCount / allLessons.length : 0;

  const handleMarkComplete = async () => {
    const token = getToken();
    if (!token || !courseId || !lesson?.id) return;
    setMarking(true);
    try {
      const res = await enrollmentApi.completeLesson(
        { courses_id: courseId, lesson_id: lesson.id },
        { token },
      );
      const next = new Set((res.completed_lesson_ids ?? []).map(String));
      setCompleted(next);
      toast.success("Progress saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save progress");
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      <aside className="relative flex w-[260px] flex-shrink-0 flex-col overflow-y-auto border-r border-gray-100 bg-white">
        <div className="absolute left-0 top-0 w-1 rounded-r-full bg-gray-100" style={{ height: "100%" }}>
          <div
            className="w-full rounded-r-full bg-orange-400 transition-all duration-500"
            style={{ height: `${progressPct * 100}%` }}
          />
        </div>

        <div className="overflow-hidden">
          <img src={course.coverImage} alt={course.title} className="h-40 w-full object-cover" />
        </div>

        <div className="px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Course</p>
          <p className="mt-1 text-sm font-bold leading-snug text-gray-900">{course.title}</p>
        </div>

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
                        type="button"
                        onClick={() => navigate(`/learn/${courseId}/${l.id}`)}
                        className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition ${
                          isActive ? "bg-damiun-primary text-white" : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span className="line-clamp-1 flex-1">{l.title}</span>
                        {isDone && !isActive && (
                          <CheckCircle2 size={14} className="flex-shrink-0 text-damiun-primary" />
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

      <div className="flex flex-1 flex-col overflow-hidden bg-[#f5f6fa]">
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

        <div className="flex flex-shrink-0 items-center justify-between border-t border-gray-100 bg-white px-8 py-5">
          <div>
            <p className="text-xl font-bold text-gray-900">{lesson.title}</p>
            <p className="mt-0.5 text-sm text-gray-400">{lesson.moduleTitle}</p>
          </div>

          <div className="flex items-center gap-3">
            {!completed.has(lesson.id) && (
              <button
                type="button"
                onClick={handleMarkComplete}
                disabled={marking}
                className="rounded-full border border-damiun-primary px-5 py-2.5 text-sm font-semibold text-damiun-primary transition hover:bg-damiun-nav-tint disabled:opacity-50"
              >
                {marking ? "Saving…" : "Mark Complete"}
              </button>
            )}
            {nextLesson ? (
              <Link
                to={`/learn/${courseId}/${nextLesson.id}`}
                className="rounded-full bg-damiun-primary px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-damiun-primary-hover"
              >
                Next Video
              </Link>
            ) : (
              <Link
                to={`/quiz/${courseId}`}
                className="rounded-full bg-damiun-primary px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-damiun-primary-hover"
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
