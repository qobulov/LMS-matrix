import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Link as LinkIcon, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { courseApi } from "../api/endpoints";
import { EditCourseModal } from "../components/instructor/EditCourseModal";
import { EditLessonModal } from "../components/instructor/EditLessonModal";
import { StatCard } from "../components/ui/StatCard";
import { useLms } from "../data/LmsContext";
import { mapCourseDetail } from "../utils/gatewayMappers";

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

  const [editCourseId, setEditCourseId] = useState(null);
  const [editLesson, setEditLesson] = useState(null);
  const [expandedCourseId, setExpandedCourseId] = useState(null);
  const [courseDetails, setCourseDetails] = useState({});
  const [detailsLoadingId, setDetailsLoadingId] = useState(null);

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

  const loadCourseDetails = useCallback(
    async (courseId) => {
      const token = getToken();
      if (!token || !courseId) return null;
      setDetailsLoadingId(courseId);
      try {
        const raw = await courseApi.getById(courseId, { token });
        const mapped = mapCourseDetail(raw);
        if (mapped) {
          setCourseDetails((prev) => ({ ...prev, [courseId]: mapped }));
        }
        return mapped;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not load lessons");
        return null;
      } finally {
        setDetailsLoadingId((id) => (id === courseId ? null : id));
      }
    },
    [getToken],
  );

  const toggleCourseExpand = async (courseId) => {
    if (expandedCourseId === courseId) {
      setExpandedCourseId(null);
      return;
    }
    setExpandedCourseId(courseId);
    if (!courseDetails[courseId]) {
      await loadCourseDetails(courseId);
    }
  };

  const refreshAfterEdit = async () => {
    await load();
    if (expandedCourseId) {
      await loadCourseDetails(expandedCourseId);
    }
  };

  const createModule = async (event) => {
    event.preventDefault();
    if (!targetCourseId || !moduleTitle.trim()) return;
    const token = getToken();
    if (!token) return;
    try {
      const res = await courseApi.addModule(
        { courses_id: targetCourseId, title: moduleTitle.trim() },
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
      if (expandedCourseId === targetCourseId) {
        await loadCourseDetails(targetCourseId);
      }
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
          courses_id: lessonForm.courseId,
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
        courseId: "",
        moduleId: "",
        title: "",
        durationMin: 15,
        isPreview: false,
        resourceUrl: "",
      });
      toast.success("Lesson added");
      await refreshAfterEdit();
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
            myCourses.map((course) => {
              const expanded = expandedCourseId === course.id;
              const detail = courseDetails[course.id];
              const loadingDetail = detailsLoadingId === course.id;

              return (
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

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditCourseId(course.id)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-damiun-wordmark shadow-sm transition hover:border-damiun-primary/40 hover:bg-damiun-nav-tint"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      Edit course
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleCourseExpand(course.id)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-damiun-wordmark shadow-sm transition hover:border-damiun-primary/40 hover:bg-damiun-nav-tint"
                    >
                      {expanded ? (
                        <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                      )}
                      Lessons
                    </button>
                    <Link
                      to={`/courses/${course.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-damiun-primary hover:underline"
                    >
                      <LinkIcon className="h-3.5 w-3.5" aria-hidden />
                      Public page
                    </Link>
                  </div>

                  {expanded && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      {loadingDetail && !detail ? (
                        <p className="text-sm text-damiun-muted">Loading lessons…</p>
                      ) : !detail?.modules?.length ? (
                        <p className="text-sm text-damiun-muted">No modules yet. Add a module above.</p>
                      ) : (
                        <ul className="space-y-4">
                          {detail.modules.map((mod) => (
                            <li key={mod.id}>
                              <p className="text-sm font-semibold text-damiun-wordmark">{mod.title}</p>
                              {mod.lessons.length === 0 ? (
                                <p className="mt-1 text-xs text-damiun-muted">No lessons in this module.</p>
                              ) : (
                                <ul className="mt-2 space-y-1">
                                  {mod.lessons.map((lesson) => (
                                    <li
                                      key={lesson.id}
                                      className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2"
                                    >
                                      <span className="min-w-0 flex-1 truncate text-sm text-damiun-body">
                                        {lesson.title}
                                        {lesson.isPreview ? (
                                          <span className="ml-2 text-xs font-medium text-damiun-primary">
                                            preview
                                          </span>
                                        ) : null}
                                        <span className="ml-2 text-xs text-damiun-muted">
                                          {lesson.durationMin} min
                                        </span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditLesson({ courseId: course.id, lesson })
                                        }
                                        className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-damiun-primary hover:bg-damiun-nav-tint"
                                        aria-label={`Edit ${lesson.title}`}
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
                </article>
              );
            })
          )}
        </div>
      </section>

      <EditCourseModal
        open={Boolean(editCourseId)}
        onOpenChange={(open) => {
          if (!open) setEditCourseId(null);
        }}
        courseId={editCourseId}
        onSuccess={() => {
          void refreshAfterEdit();
        }}
      />

      <EditLessonModal
        open={Boolean(editLesson)}
        onOpenChange={(open) => {
          if (!open) setEditLesson(null);
        }}
        courseId={editLesson?.courseId ?? ""}
        lesson={editLesson?.lesson ?? null}
        onSuccess={() => {
          void refreshAfterEdit();
        }}
      />
    </div>
  );
}
