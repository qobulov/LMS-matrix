import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import bannerImage from "../assets/images/Banner.png";
import { courseApi, homeApi } from "../api/endpoints";
import { mapCourseListItem, mapInstructorHome } from "../utils/gatewayMappers";

/* ── Donut chart (decorative) ─────────────────────────── */
const RINGS = [
  { r: 84, sw: 12, color: "#22c55e", label: "UI/UX Design", pct: 78 },
  { r: 63, sw: 12, color: "#a855f7", label: "HTML", pct: 62 },
  { r: 42, sw: 12, color: "#f97316", label: "Javascript", pct: 48 },
  { r: 21, sw: 12, color: "#3b82f6", label: "React", pct: 32 },
];

function DonutRings() {
  const cx = 100,
    cy = 100;
  return (
    <svg viewBox="0 0 200 200" className="h-56 w-56 flex-shrink-0">
      {RINGS.map(({ r, sw, color, pct }) => {
        const circ = 2 * Math.PI * r;
        const filled = (pct / 100) * circ;
        return (
          <g key={r}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f0f0" strokeWidth={sw} />
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={sw}
              strokeDasharray={`${filled} ${circ - filled}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          </g>
        );
      })}
    </svg>
  );
}

function totalLessons(course) {
  if (course.lessonCount != null) return course.lessonCount;
  if (!course.modules?.length) return 0;
  return course.modules.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0);
}

export function HomePage() {
  const [tab, setTab] = useState("progress");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [catalogCourses, setCatalogCourses] = useState([]);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [categoryList, setCategoryList] = useState([]);
  const [topInstructors, setTopInstructors] = useState([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [home, catalog] = await Promise.all([
          homeApi.getData(),
          courseApi.getCatalog({ page: 1, page_size: 24, sort: "rating" }),
        ]);
        if (cancelled) return;
        const feat = (home.featured_courses ?? [])
          .map(mapCourseListItem)
          .filter(Boolean);
        const cats = home.categories ?? [];
        const inst = (home.top_instructors ?? []).map(mapInstructorHome).filter(Boolean);
        setFeaturedCourses(feat);
        setCategoryList(Array.isArray(cats) ? cats.map((c) => (typeof c === "string" ? c : c.name ?? c.title ?? "")).filter(Boolean) : []);
        setTopInstructors(inst);
        setCatalogCourses((catalog.courses ?? []).map(mapCourseListItem).filter(Boolean));
        setCatalogTotal(Number(catalog.total ?? 0));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load home");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryChips = useMemo(() => {
    const fromCourses = new Set(catalogCourses.map((c) => c.category).filter(Boolean));
    const merged = new Set([...categoryList, ...fromCourses]);
    return Array.from(merged).sort((a, b) => a.localeCompare(b));
  }, [catalogCourses, categoryList]);

  const allCoursesForGrid = useMemo(() => {
    const ids = new Set(featuredCourses.map((c) => c.id));
    const rest = catalogCourses.filter((c) => !ids.has(c.id));
    return [...featuredCourses, ...rest];
  }, [featuredCourses, catalogCourses]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50/80 p-6 text-sm text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Link
        to="/catalog"
        className="mx-auto block w-full  overflow-hidden   transition hover:opacity-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-damiun-primary"
        aria-label="Start learning — open course catalog"
      >
        <img
          src={bannerImage}
          alt="All-in-One Career Toolkit: courses, mentoring, and job matching. Start Learning Now."
          width={985}
          height={320}
          className="h-auto w-full object-cover align-middle"
          decoding="async"
          fetchPriority="high"
        />
      </Link>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 sm:p-6">
        <h2 className="text-lg font-bold text-damiun-wordmark">Browse by category</h2>
        <p className="mt-1 text-sm text-damiun-muted">Jump into the catalog with one tap.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {categoryChips.map((cat) => (
            <Link
              key={cat}
              to={`/catalog?category=${encodeURIComponent(cat)}`}
              className="rounded-full border border-gray-200 bg-damiun-nav-tint px-4 py-2 text-sm font-semibold capitalize text-damiun-primary transition hover:border-damiun-primary/40 hover:bg-white"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-damiun-wordmark">Top instructors</h2>
            <p className="mt-1 text-sm text-damiun-muted">Highly rated creators on the platform.</p>
          </div>
          <Link to="/catalog" className="text-sm font-semibold text-damiun-primary hover:underline">
            View all courses
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {topInstructors.map((inst) => (
            <article
              key={inst.id}
              className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-gray-50"
            >
              <div className="flex items-center gap-3">
                {inst.avatar ? (
                  <img src={inst.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-damiun-nav-tint text-lg font-bold text-damiun-primary">
                    {inst.fullName?.[0] ?? "?"}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-damiun-wordmark">{inst.fullName}</p>
                  <p className="text-xs text-damiun-muted">
                    {inst.courseCount} courses · {inst.studentTotal} students
                  </p>
                </div>
              </div>
              {inst.rating != null && (
                <p className="text-sm font-semibold text-amber-600">Rating {Number(inst.rating).toFixed(1)}</p>
              )}
              <p className="line-clamp-2 text-xs text-damiun-body">{inst.bio}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        {[
          ["progress", "Learning Progress"],
          ["courses", "All courses"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              tab === key
                ? "bg-damiun-primary text-white shadow-sm"
                : "bg-white text-gray-500 shadow-sm ring-1 ring-gray-100 hover:text-gray-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "progress" ? (
        <div className="max-w-lg rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-8 text-xl font-bold text-damiun-wordmark">Learning Progress</h2>
          <div className="flex items-center gap-10">
            <DonutRings />
            <ul className="flex flex-col gap-4">
              {RINGS.map(({ color, label, pct }) => (
                <li key={label} className="flex items-center gap-3">
                  <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ background: color }} />
                  <span className="text-sm text-damiun-body">{label}</span>
                  <span className="ml-auto pl-4 text-xs font-semibold text-damiun-muted">{pct}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div>
          <p className="mb-4 text-sm text-damiun-muted">
            Featured picks first, then more from the catalog ({catalogTotal} published).
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {allCoursesForGrid.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition hover:shadow-md hover:ring-damiun-primary/20"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={course.coverImage}
                    alt={course.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <div className="mb-1 flex flex-wrap gap-1">
                    <span className="rounded-full bg-damiun-nav-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-damiun-primary">
                      {course.category}
                    </span>
                    {featuredCourses.some((f) => f.id === course.id) && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm font-bold leading-snug text-damiun-wordmark">{course.title}</p>
                  <p className="mt-1 text-xs text-damiun-muted">
                    {totalLessons(course)} lessons · {course.durationHours}h
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
