import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { courseApi, enrollmentApi } from "../api/endpoints";
import { CatalogGridSkeleton } from "../components/ui/skeleton";
import { useLms } from "../data/LmsContext";
import { mapCourseListItem } from "../utils/gatewayMappers";

const PAGE_SIZE = 8;

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];

function totalLessons(course) {
  if (course.lessonCount != null) return course.lessonCount;
  if (!course.modules?.length) return 0;
  return course.modules.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0);
}

function CourseCard({ course }) {
  const count = totalLessons(course);
  return (
    <Link
      to={`/courses/${course.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition hover:shadow-md hover:ring-damiun-primary/20"
    >
      <div className="aspect-[4/3] w-full overflow-hidden">
        <img
          src={course.coverImage}
          alt={course.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col gap-1.5 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-damiun-nav-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-damiun-primary">
            {course.category}
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium capitalize text-gray-600">
            {course.difficulty}
          </span>
        </div>
        <p className="line-clamp-2 text-sm font-bold leading-snug text-damiun-wordmark">{course.title}</p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{count > 0 ? `${count} lessons` : `${course.durationHours}h total`}</span>
          {course.rating != null && (
            <span className="font-semibold text-amber-600">★ {Number(course.rating).toFixed(1)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function CatalogPage() {
  const { getToken } = useLms();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [sort, setSort] = useState("rating");
  const [isPending, startTransition] = useTransition();
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const category = useMemo(() => {
    const raw = searchParams.get("category");
    if (!raw) return "all";
    return decodeURIComponent(raw);
  }, [searchParams]);

  const setCategory = (next) => {
    startTransition(() => {
      setPage(1);
      setSearchParams((prev) => {
        const n = new URLSearchParams(prev);
        if (next === "all") n.delete("category");
        else n.set("category", next);
        return n;
      });
    });
  };

  const fetchData = useCallback(async () => {
    setError(null);
    const token = getToken();

    if (tab === "my") {
      if (!token) {
        setCourses([]);
        setTotal(0);
        return;
      }
      const data = await enrollmentApi.myCourses({ token });
      const raw = (data.enrollments ?? []).map((e) => e.course).filter(Boolean);
      let list = raw.map(mapCourseListItem).filter(Boolean);
      const q = searchQuery.trim().toLowerCase();
      if (q) list = list.filter((c) => c.title.toLowerCase().includes(q));
      if (category !== "all") list = list.filter((c) => c.category === category);
      if (difficulty !== "all") list = list.filter((c) => c.difficulty === difficulty);
      list = [...list];
      if (sort === "title") list.sort((a, b) => a.title.localeCompare(b.title));
      else if (sort === "newest") list.reverse();
      else list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      setCourses(list);
      setTotal(list.length);
      return;
    }

    const filters = {
      page,
      page_size: PAGE_SIZE,
      sort,
      search: searchQuery.trim() || undefined,
      category: category !== "all" ? category : undefined,
      difficulty: difficulty !== "all" ? difficulty : undefined,
    };
    const data = await courseApi.getCatalog(filters, {});
    const list = (data.courses ?? []).map(mapCourseListItem).filter(Boolean);
    setCourses(list);
    setTotal(Number(data.total ?? list.length));
  }, [getToken, tab, page, sort, searchQuery, category, difficulty]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(
      () => {
        void (async () => {
          try {
            if (cancelled) return;
            await fetchData();
          } catch (err) {
            if (!cancelled) {
              setError(err instanceof Error ? err.message : "Failed to load catalog");
              setCourses([]);
              setTotal(0);
            }
          } finally {
            if (!cancelled) setLoading(false);
          }
        })();
      },
      searchQuery.trim() ? 350 : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [fetchData, searchQuery]);

  const categories = useMemo(() => {
    const set = new Set(["all", ...courses.map((c) => c.category).filter(Boolean)]);
    if (category !== "all") set.add(category);
    const rest = Array.from(set).filter((c) => c !== "all").sort((a, b) => a.localeCompare(b));
    return ["all", ...rest];
  }, [courses, category]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged =
    tab === "my" ? courses.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE) : courses;

  const handleTab = (next) => {
    startTransition(() => {
      setTab(next);
      setPage(1);
    });
  };

  const showSkeleton = isPending || loading;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-damiun-wordmark">Course catalog</h1>
        <p className="mt-1 text-sm text-damiun-muted">
          Search, filter by category and level, sort by rating or title.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50/80 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => {
              const v = e.target.value;
              startTransition(() => {
                setSearchQuery(v);
                setPage(1);
              });
            }}
            className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none ring-damiun-primary/30 transition focus:border-damiun-primary focus:ring-2"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="self-center text-xs font-semibold uppercase tracking-wide text-gray-400">
            Category
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                category === cat
                  ? "bg-damiun-primary text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Level</span>
            <select
              value={difficulty}
              onChange={(e) => {
                startTransition(() => {
                  setDifficulty(e.target.value);
                  setPage(1);
                });
              }}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-damiun-wordmark outline-none focus:border-damiun-primary focus:ring-2 focus:ring-damiun-primary/25"
            >
              <option value="all">All levels</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Sort</span>
            <select
              value={sort}
              onChange={(e) => {
                startTransition(() => {
                  setSort(e.target.value);
                  setPage(1);
                });
              }}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-damiun-wordmark outline-none focus:border-damiun-primary focus:ring-2 focus:ring-damiun-primary/25"
            >
              <option value="rating">Popularity (rating)</option>
              <option value="newest">Newest</option>
              <option value="title">Title A–Z</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleTab("all")}
          className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
            tab === "all"
              ? "bg-damiun-primary text-white shadow-sm"
              : "bg-white text-gray-500 shadow-sm ring-1 ring-gray-100 hover:text-gray-800"
          }`}
        >
          All courses
        </button>
        <button
          type="button"
          onClick={() => handleTab("my")}
          className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
            tab === "my"
              ? "bg-damiun-primary text-white shadow-sm"
              : "bg-white text-gray-500 shadow-sm ring-1 ring-gray-100 hover:text-gray-800"
          }`}
        >
          My courses
        </button>
      </div>

      {showSkeleton ? (
        <CatalogGridSkeleton />
      ) : paged.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 text-center shadow-sm ring-1 ring-gray-100">
          <p className="text-base font-semibold text-gray-500">No courses match your filters</p>
          {tab === "my" && (
            <p className="mt-1 text-sm text-gray-400">Enroll in a course to see it here.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {paged.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}

      {!showSkeleton && tab === "all" && pageCount > 1 && (
        <div className="flex items-center gap-2">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => startTransition(() => setPage(n))}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${
                n === safePage
                  ? "bg-damiun-primary text-white shadow-sm"
                  : "bg-white text-gray-500 shadow-sm ring-1 ring-gray-100 hover:text-gray-800"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {!showSkeleton && tab === "my" && pageCount > 1 && (
        <div className="flex items-center gap-2">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => startTransition(() => setPage(n))}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${
                n === safePage
                  ? "bg-damiun-primary text-white shadow-sm"
                  : "bg-white text-gray-500 shadow-sm ring-1 ring-gray-100 hover:text-gray-800"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
