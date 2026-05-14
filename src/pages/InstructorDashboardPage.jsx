import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { courseApi } from "../api/endpoints";
import { StatCard } from "../components/ui/StatCard";
import { useLms } from "../data/LmsContext";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-damiun-primary focus:bg-white focus:ring-2 focus:ring-damiun-primary/20";
const labelClass = "block text-sm font-medium text-damiun-wordmark";

function mapInstructorCourse(c) {
  if (!c || typeof c !== "object") return null;
  return {
    id: String(c.id),
    title: c.title ?? "",
    status: c.status ?? "draft",
    description: c.description ?? "",
    studentCount: c.student_count ?? 0,
    modules: (c.modules ?? []).map((m) => ({
      id: String(m.id),
      title: m.title ?? "",
      lessons: [],
    })),
  };
}

export function InstructorDashboardPage() {
  const { getToken } = useLms();
  const [myCourses, setMyCourses] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  const [moduleTitle, setModuleTitle] = useState("");
  const [targetCourseId, setTargetCourseId] = useState("");

  const [lessonForm, setLessonForm] = useState({
    courseId: "",
    moduleId: "",
    title: "",
    durationMin: 15,
    isPreview: false,
    resourceUrl: "",
  });

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) throw new Error("Not signed in");
    const data = await courseApi.getInstructorDashboard({ token });
    const list = (data.courses ?? []).map(mapInstructorCourse).filter(Boolean);
    setMyCourses(list);
    setTotalStudents(Number(data.total_students ?? 0));
  }, [getToken]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        await load();
      } catch {
        if (!cancelled) {
          setMyCourses([]);
          setTotalStudents(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const createModule = async (event) => {
    event.preventDefault();
    if (!targetCourseId || !moduleTitle.trim()) return;
    const token = getToken();
    if (!token) return;
    try {
      const res = await courseApi.addModule(
        { course_id: targetCourseId, title: moduleTitle.trim() },
        { token },
      );
      const mod = res.module ?? res;
      setMyCourses((prev) =>
        prev.map((c) =>
          c.id === targetCourseId
            ? {
                ...c,
                modules: [
                  ...c.modules,
                  { id: String(mod.id), title: mod.title ?? moduleTitle.trim(), lessons: [] },
                ],
              }
            : c,
        ),
      );
      setModuleTitle("");
      toast.success("Module added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const createLesson = async (event) => {
    event.preventDefault();
    if (!lessonForm.courseId || !lessonForm.moduleId || !lessonForm.title.trim()) return;
    const token = getToken();
    if (!token) return;
    try {
      await courseApi.addLesson(
        {
          course_id: lessonForm.courseId,
          module_id: lessonForm.moduleId,
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
        courseId: "",
        moduleId: "",
        title: "",
        durationMin: 15,
        isPreview: false,
        resourceUrl: "",
      });
      toast.success("Lesson added");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const selectedCourse = myCourses.find((course) => course.id === lessonForm.courseId);

  if (loading) {
    return <div className="py-12 text-center text-sm text-gray-500">Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-damiun-wordmark">Instructor dashboard</h1>
          <p className="mt-1 text-sm text-damiun-muted">Courses, modules, lessons.</p>
        </div>
        <Link
          to="/instructor/create-course"
          className="inline-flex shrink-0 justify-center rounded-full bg-damiun-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-damiun-primary-hover"
        >
          Create new course
        </Link>
      </div>

      <div className="stats-grid">
        <StatCard label="My Courses" value={myCourses.length} />
        <StatCard label="Total Students" value={totalStudents} />
        <StatCard label="Published" value={myCourses.filter((course) => course.status === "published").length} />
      </div>

      <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-50 sm:p-8">
        <h2 className="text-lg font-bold text-damiun-wordmark">Add module</h2>
        <p className="mt-1 text-sm text-damiun-muted">Attach a new section to one of your courses.</p>
        <form className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={createModule}>
          <label className={labelClass}>
            Course
            <select
              value={targetCourseId}
              onChange={(event) => setTargetCourseId(event.target.value)}
              className={inputClass}
            >
              <option value="">Select</option>
              {myCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Module title
            <input
              value={moduleTitle}
              onChange={(event) => setModuleTitle(event.target.value)}
              className={inputClass}
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-full border border-gray-200 bg-white py-2.5 text-sm font-semibold text-damiun-wordmark shadow-sm transition hover:border-damiun-primary/40 hover:bg-damiun-nav-tint sm:w-auto sm:px-8"
            >
              Add module
            </button>
          </div>
        </form>
      </article>

      <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-50 sm:p-8">
        <h2 className="text-lg font-bold text-damiun-wordmark">Add lesson</h2>
        <p className="mt-1 text-sm text-damiun-muted">Video URL and metadata for a lesson inside a module.</p>
        <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={createLesson}>
          <label className={labelClass}>
            Course
            <select
              value={lessonForm.courseId}
              onChange={(event) =>
                setLessonForm((prev) => ({
                  ...prev,
                  courseId: event.target.value,
                  moduleId: "",
                }))
              }
              className={inputClass}
            >
              <option value="">Select</option>
              {myCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            Module
            <select
              value={lessonForm.moduleId}
              onChange={(event) =>
                setLessonForm((prev) => ({ ...prev, moduleId: event.target.value }))
              }
              className={inputClass}
            >
              <option value="">Select</option>
              {(selectedCourse?.modules || []).map((module) => (
                <option key={module.id} value={module.id}>
                  {module.title}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            Lesson title
            <input
              value={lessonForm.title}
              onChange={(event) =>
                setLessonForm((prev) => ({ ...prev, title: event.target.value }))
              }
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Duration (min)
            <input
              type="number"
              min="1"
              value={lessonForm.durationMin}
              onChange={(event) =>
                setLessonForm((prev) => ({
                  ...prev,
                  durationMin: Number(event.target.value) || 1,
                }))
              }
              className={inputClass}
            />
          </label>

          <label className={`${labelClass} flex items-center gap-2 pt-6`}>
            <input
              type="checkbox"
              checked={lessonForm.isPreview}
              onChange={(event) =>
                setLessonForm((prev) => ({ ...prev, isPreview: event.target.checked }))
              }
              className="rounded border-gray-300 text-damiun-primary focus:ring-damiun-primary"
            />
            Preview lesson
          </label>

          <label className={`${labelClass} sm:col-span-2`}>
            Video URL
            <input
              value={lessonForm.resourceUrl}
              onChange={(event) =>
                setLessonForm((prev) => ({ ...prev, resourceUrl: event.target.value }))
              }
              className={inputClass}
            />
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-full border border-gray-200 bg-white px-8 py-2.5 text-sm font-semibold text-damiun-wordmark shadow-sm transition hover:border-damiun-primary/40 hover:bg-damiun-nav-tint"
            >
              Add lesson
            </button>
          </div>
        </form>
      </article>

      <section>
        <h2 className="text-lg font-bold text-damiun-wordmark">My courses</h2>
        <div className="mt-4 flex flex-col gap-4">
          {myCourses.length === 0 ? (
            <p className="rounded-2xl bg-white p-8 text-center text-sm text-damiun-muted shadow-sm ring-1 ring-gray-100">
              No courses yet. Create one to get started.
            </p>
          ) : (
            myCourses.map((course) => (
              <article
                key={course.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-damiun-wordmark">{course.title}</h3>
                  <span className="rounded-full bg-damiun-nav-tint px-3 py-1 text-xs font-bold capitalize text-damiun-primary">
                    {course.status}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-damiun-body">{course.description}</p>
                <p className="mt-3 text-xs font-medium text-damiun-muted">
                  Modules: {course.modules.length} · Students: {course.studentCount}
                </p>
                <Link
                  to={`/courses/${course.id}`}
                  className="mt-4 inline-block text-sm font-semibold text-damiun-primary hover:underline"
                >
                  View public page
                </Link>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
