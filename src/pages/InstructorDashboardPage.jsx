import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Layers, PlusCircle, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { courseApi, profileApi } from "../api/endpoints";
import { StatCard } from "../components/ui/StatCard";
import { useLms } from "../data/LmsContext";
import { mapInstructorCourse } from "../utils/instructorMappers";
import { formatPrice } from "../utils/format";

export function InstructorDashboardPage() {
  const { getToken, currentUser } = useLms();
  const [myCourses, setMyCourses] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState(null);

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
                      <span className="inline-flex items-center gap-1 text-sm text-damiun-body">
                        <Users className="h-3.5 w-3.5 text-damiun-muted" aria-hidden />
                        {course.studentCount}
                      </span>
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
  );
}
