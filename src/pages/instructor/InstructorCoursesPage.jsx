import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronRight, Link as LinkIcon, Pencil } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { courseApi } from "../../api/endpoints";
import { EditCourseModal } from "../../components/instructor/EditCourseModal";
import { EditLessonModal } from "../../components/instructor/EditLessonModal";
import { useLms } from "../../data/LmsContext";
import { mapCourseDetail } from "../../utils/gatewayMappers";
import { mapInstructorCourse } from "../../utils/instructorMappers";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-damiun-primary focus:bg-white focus:ring-2 focus:ring-damiun-primary/20";
const labelClass = "block text-sm font-medium text-damiun-wordmark";

function CoursePicker({ courses, loading }) {
  if (loading) {
    return <p className="py-12 text-center text-sm text-gray-500">Loading…</p>;
  }

  if (courses.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
        <p className="text-sm text-damiun-muted">Kurs yo&apos;q.</p>
        <Link
          to="/instructor/create-course"
          className="mt-4 inline-block text-sm font-semibold text-damiun-primary hover:underline"
        >
          Create your first course
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <Link
          key={course.id}
          to={`/instructor/courses/${course.id}`}
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50 transition hover:border-damiun-primary/30 hover:shadow-md"
        >
          <p className="font-semibold text-damiun-wordmark">{course.title}</p>
          <p className="mt-1 text-xs capitalize text-damiun-primary">{course.status}</p>
          <p className="mt-3 text-xs text-damiun-muted">
            {course.modules.length} modules · {course.studentCount} students
          </p>
        </Link>
      ))}
    </div>
  );
}

function CourseBuilder({ courseId, myCourses, onCoursesChange }) {
  const { getToken } = useLms();
  const course = myCourses.find((c) => c.id === courseId);

  const [moduleTitle, setModuleTitle] = useState("");
  const [lessonForm, setLessonForm] = useState({
    moduleId: "",
    title: "",
    durationMin: 15,
    isPreview: false,
    resourceUrl: "",
  });
  const [editCourseOpen, setEditCourseOpen] = useState(false);
  const [editLesson, setEditLesson] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [courseDetail, setCourseDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadCourseDetails = useCallback(async () => {
    const token = getToken();
    if (!token || !courseId) return;
    setDetailLoading(true);
    try {
      const raw = await courseApi.getById(courseId, { token });
      setCourseDetail(mapCourseDetail(raw));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load lessons");
    } finally {
      setDetailLoading(false);
    }
  }, [courseId, getToken]);

  useEffect(() => {
    void loadCourseDetails();
  }, [loadCourseDetails]);

  const refresh = async () => {
    await onCoursesChange();
    await loadCourseDetails();
  };

  if (!course) {
    return (
      <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-4 text-sm text-amber-950">
        Course not found.{" "}
        <Link to="/instructor/courses" className="font-semibold text-damiun-primary hover:underline">
          Back to list
        </Link>
      </div>
    );
  }

  const createModule = async (event) => {
    event.preventDefault();
    if (!moduleTitle.trim()) return;
    const token = getToken();
    if (!token) return;
    try {
      await courseApi.addModule({ courses_id: courseId, title: moduleTitle.trim() }, { token });
      setModuleTitle("");
      toast.success("Module added");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const createLesson = async (event) => {
    event.preventDefault();
    if (!lessonForm.moduleId || !lessonForm.title.trim()) return;
    const token = getToken();
    if (!token) return;
    try {
      await courseApi.addLesson(
        {
          courses_id: courseId,
          modules_id: lessonForm.moduleId,
          title: lessonForm.title.trim(),
          video_url:
            lessonForm.resourceUrl.trim() ||
            "https://cdn.u-code.io/placeholder-lesson-video.mp4",
          duration_min: Number(lessonForm.durationMin) || 10,
          is_preview: lessonForm.isPreview,
        },
        { token },
      );
      setLessonForm({
        moduleId: "",
        title: "",
        durationMin: 15,
        isPreview: false,
        resourceUrl: "",
      });
      toast.success("Lesson added");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-damiun-wordmark">{course.title}</h2>
          <p className="mt-1 text-sm text-damiun-muted">
            Modul va darslarni shu yerda qo&apos;shing yoki tahrirlang.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditCourseOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-damiun-wordmark shadow-sm hover:bg-damiun-nav-tint"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Edit course info
          </button>
          <Link
            to={`/courses/${courseId}`}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-damiun-primary hover:underline"
          >
            <LinkIcon className="h-3.5 w-3.5" aria-hidden />
            Public page
          </Link>
        </div>
      </div>

      <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-50 sm:p-8">
        <h3 className="text-lg font-bold text-damiun-wordmark">Add module</h3>
        <form className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={createModule}>
          <label className={`${labelClass} flex-1`}>
            Module title
            <input
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              className={inputClass}
              placeholder="e.g. Introduction"
            />
          </label>
          <button
            type="submit"
            className="rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-damiun-wordmark shadow-sm hover:bg-damiun-nav-tint"
          >
            Add module
          </button>
        </form>
      </article>

      <article className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-50 sm:p-8">
        <h3 className="text-lg font-bold text-damiun-wordmark">Add lesson</h3>
        <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={createLesson}>
          <label className={labelClass}>
            Module
            <select
              value={lessonForm.moduleId}
              onChange={(e) => setLessonForm((p) => ({ ...p, moduleId: e.target.value }))}
              className={inputClass}
            >
              <option value="">Select module</option>
              {course.modules.map((mod) => (
                <option key={mod.id} value={mod.id}>
                  {mod.title}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Lesson title
            <input
              value={lessonForm.title}
              onChange={(e) => setLessonForm((p) => ({ ...p, title: e.target.value }))}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Duration (min)
            <input
              type="number"
              min="1"
              value={lessonForm.durationMin}
              onChange={(e) =>
                setLessonForm((p) => ({ ...p, durationMin: Number(e.target.value) || 1 }))
              }
              className={inputClass}
            />
          </label>
          <label className={`${labelClass} flex items-center gap-2 pt-6`}>
            <input
              type="checkbox"
              checked={lessonForm.isPreview}
              onChange={(e) => setLessonForm((p) => ({ ...p, isPreview: e.target.checked }))}
              className="rounded border-gray-300 text-damiun-primary"
            />
            Preview lesson
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Video URL
            <input
              value={lessonForm.resourceUrl}
              onChange={(e) => setLessonForm((p) => ({ ...p, resourceUrl: e.target.value }))}
              className={inputClass}
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-full border border-gray-200 bg-white px-8 py-2.5 text-sm font-semibold text-damiun-wordmark shadow-sm hover:bg-damiun-nav-tint"
            >
              Add lesson
            </button>
          </div>
        </form>
      </article>

      <section className="mt-8">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 text-lg font-bold text-damiun-wordmark"
        >
          {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          Course content
        </button>
        {expanded && (
          <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
            {detailLoading && !courseDetail ? (
              <p className="text-sm text-damiun-muted">Loading…</p>
            ) : !courseDetail?.modules?.length ? (
              <p className="text-sm text-damiun-muted">No modules yet.</p>
            ) : (
              <ul className="space-y-4">
                {courseDetail.modules.map((mod) => (
                  <li key={mod.id}>
                    <p className="text-sm font-semibold text-damiun-wordmark">{mod.title}</p>
                    {mod.lessons.length === 0 ? (
                      <p className="mt-1 text-xs text-damiun-muted">No lessons.</p>
                    ) : (
                      <ul className="mt-2 space-y-1">
                        {mod.lessons.map((lesson) => (
                          <li
                            key={lesson.id}
                            className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2"
                          >
                            <span className="min-w-0 flex-1 truncate text-sm text-damiun-body">
                              {lesson.title}
                              {lesson.isPreview && (
                                <span className="ml-2 text-xs font-medium text-damiun-primary">preview</span>
                              )}
                              <span className="ml-2 text-xs text-damiun-muted">{lesson.durationMin} min</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditLesson({ courseId, lesson })}
                              className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-damiun-primary hover:bg-damiun-nav-tint"
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden />
                              Edit
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <EditCourseModal
        open={editCourseOpen}
        onOpenChange={setEditCourseOpen}
        courseId={courseId}
        onSuccess={() => void refresh()}
      />

      <EditLessonModal
        open={Boolean(editLesson)}
        onOpenChange={(open) => {
          if (!open) setEditLesson(null);
        }}
        courseId={editLesson?.courseId ?? courseId}
        lesson={editLesson?.lesson ?? null}
        onSuccess={() => void refresh()}
      />
    </>
  );
}

export function InstructorCoursesPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useLms();
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCourses = useCallback(async () => {
    const token = getToken();
    if (!token) throw new Error("Not signed in");
    const data = await courseApi.getInstructorDashboard({ token });
    const list = (data.courses ?? []).map(mapInstructorCourse).filter(Boolean);
    setMyCourses(list);
    return list;
  }, [getToken]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const list = await loadCourses();
        if (cancelled) return;
        if (!courseId && list.length === 1) {
          navigate(`/instructor/courses/${list[0].id}`, { replace: true });
        }
      } catch {
        if (!cancelled) setMyCourses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId, loadCourses, navigate]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/instructor"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-damiun-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-damiun-wordmark">Course builder</h1>
        <p className="mt-1 text-sm text-damiun-muted">
          {courseId ? "Manage modules and lessons for this course." : "Select a course to edit content."}
        </p>
      </div>

      {courseId ? (
        <CourseBuilder courseId={courseId} myCourses={myCourses} onCoursesChange={loadCourses} />
      ) : (
        <CoursePicker courses={myCourses} loading={loading} />
      )}
    </div>
  );
}
