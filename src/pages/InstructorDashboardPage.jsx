import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Layers, PlusCircle, Users, X } from "lucide-react";
import { Link } from "react-router-dom";
import { courseApi, instructorApi, profileApi } from "../api/endpoints";
import { StatCard } from "../components/ui/StatCard";
import { useLms } from "../data/LmsContext";
import { mapInstructorCourse } from "../utils/instructorMappers";
import { formatPrice } from "../utils/format";

function StudentsModal({ course, onClose, getToken }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    instructorApi
      .getStudents(course.id, { token })
      .then((data) => setStudents(data.students ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [course.id, getToken]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-damiun-wordmark">Students</h2>
            <p className="mt-0.5 text-sm text-damiun-muted line-clamp-1">{course.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-damiun-muted">Loading…</p>
          ) : error ? (
            <p className="py-8 text-center text-sm text-red-500">{error}</p>
          ) : students.length === 0 ? (
            <p className="py-8 text-center text-sm text-damiun-muted">No students enrolled yet.</p>
          ) : (
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.enrollment_id ?? s.student_id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        {s.avatar_url ? (
                          <img src={s.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-damiun-primary text-xs font-bold text-white">
                            {(s.full_name ?? s.email ?? "?")[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-damiun-wordmark">{s.full_name || "—"}</p>
                          <p className="text-xs text-damiun-muted">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="rounded-full bg-damiun-nav-tint px-2 py-0.5 text-xs font-semibold capitalize text-damiun-primary">
                        {s.status ?? "active"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-damiun-primary"
                            style={{ width: `${s.progress_percent ?? 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-damiun-muted">{s.progress_percent ?? 0}%</span>
                      </div>
                    </td>
                    <td className="text-xs text-damiun-muted">
                      {s.enrolled_at ? new Date(s.enrolled_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t border-gray-100 px-6 py-3 text-right">
          <span className="text-xs text-damiun-muted">{students.length} student{students.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  );
}

export function InstructorDashboardPage() {
  const { getToken, currentUser } = useLms();
  const [myCourses, setMyCourses] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

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
      setError(null);
      try {
        await load();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard");
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

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    profileApi.getBalance({ token }).then((data) => {
      setBalance(Number(data.balance ?? 0));
    }).catch(() => {});
  }, [getToken]);

  const stats = useMemo(() => {
    const published = myCourses.filter((c) => c.status === "published").length;
    const drafts = myCourses.filter((c) => c.status === "draft").length;
    const moduleTotal = myCourses.reduce((sum, c) => sum + c.modules.length, 0);
    return { published, drafts, moduleTotal };
  }, [myCourses]);

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50/80 p-4 text-sm text-red-800">
        {error}
      </div>
    );
  }

  return (
    <>
    {selectedCourse && (
      <StudentsModal
        course={selectedCourse}
        onClose={() => setSelectedCourse(null)}
        getToken={getToken}
      />
    )}
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-damiun-wordmark">Instructor dashboard</h1>
          <p className="mt-1 text-sm text-damiun-muted">
            {currentUser?.fullName ? `Salom, ${currentUser.fullName}. ` : ""}
            Kurslar, o&apos;qituvchilar va talabalar bo&apos;yicha qisqa ko&apos;rinish.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/instructor/create-course"
            className="inline-flex items-center gap-2 rounded-full bg-damiun-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-damiun-primary-hover"
          >
            <PlusCircle className="h-4 w-4" aria-hidden />
            New course
          </Link>
          {myCourses.length > 0 && (
            <Link
              to="/instructor/courses"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-damiun-wordmark shadow-sm transition hover:border-damiun-primary/40 hover:bg-damiun-nav-tint"
            >
              <Layers className="h-4 w-4 text-damiun-primary" aria-hidden />
              Course builder
            </Link>
          )}
        </div>
      </div>

      <div className="stats-grid">
        {balance !== null && (
          <StatCard label="Balance" value={formatPrice(balance)} helper="Sizning hisobingiz" />
        )}
        <StatCard label="My courses" value={myCourses.length} helper="Created by you" />
        <StatCard label="Total students" value={totalStudents} helper="Across all courses" />
        <StatCard label="Published" value={stats.published} helper={`${stats.drafts} draft`} />
        <StatCard label="Modules" value={stats.moduleTotal} helper="Total sections" />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-damiun-wordmark">Your courses</h2>
          {myCourses.length > 0 && (
            <Link
              to="/instructor/courses"
              className="text-sm font-semibold text-damiun-primary hover:underline"
            >
              Open course builder
            </Link>
          )}
        </div>

        {myCourses.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
            <BookOpen className="mx-auto h-10 w-10 text-damiun-primary/70" aria-hidden />
            <h3 className="mt-4 text-lg font-semibold text-damiun-wordmark">No courses yet</h3>
            <p className="mt-2 text-sm text-damiun-muted">
              Birinchi kursingizni yarating, keyin modul va darslarni course builder orqali qo&apos;shing.
            </p>
            <Link
              to="/instructor/create-course"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-damiun-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-damiun-primary-hover"
            >
              Create course
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm ring-1 ring-gray-50">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Status</th>
                  <th>Students</th>
                  <th>Modules</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {myCourses.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <p className="font-semibold text-damiun-wordmark">{course.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-damiun-muted">{course.description}</p>
                    </td>
                    <td>
                      <span className="rounded-full bg-damiun-nav-tint px-2.5 py-0.5 text-xs font-bold capitalize text-damiun-primary">
                        {course.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => course.studentCount > 0 && setSelectedCourse(course)}
                        className={`inline-flex items-center gap-1 text-sm transition ${
                          course.studentCount > 0
                            ? "cursor-pointer font-semibold text-damiun-primary hover:underline"
                            : "cursor-default text-damiun-body"
                        }`}
                      >
                        <Users className="h-3.5 w-3.5 text-damiun-muted" aria-hidden />
                        {course.studentCount}
                      </button>
                    </td>
                    <td className="text-sm text-damiun-body">{course.modules.length}</td>
                    <td>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          to={`/instructor/courses/${course.id}`}
                          className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-damiun-wordmark hover:bg-damiun-nav-tint"
                        >
                          Build content
                        </Link>
                        <Link
                          to={`/learn-preview/${course.id}`}
                          className="rounded-full border border-damiun-primary/30 px-3 py-1.5 text-xs font-semibold text-damiun-primary hover:bg-damiun-nav-tint"
                        >
                          Preview
                        </Link>
                        <Link
                          to={`/courses/${course.id}`}
                          className="rounded-full px-3 py-1.5 text-xs font-semibold text-damiun-muted hover:underline"
                        >
                          Public page
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
    </>
  );
}
