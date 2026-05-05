import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLms } from "../data/LmsContext";

const PAGE_SIZE = 8;

function totalLessons(course) {
  return course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
}

function CourseCard({ course }) {
  const count = totalLessons(course);
  return (
    <Link
      to={`/courses/${course.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-[4/3] w-full overflow-hidden">
        <img
          src={course.coverImage}
          alt={course.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col gap-1.5 p-4">
        <p className="line-clamp-2 text-sm font-bold leading-snug text-gray-900">{course.title}</p>
        <p className="text-xs text-gray-400">{count > 0 ? `${count} videos` : `${course.durationHours}h total`}</p>
      </div>
    </Link>
  );
}

export function CatalogPage() {
  const { courses, myEnrollments } = useLms();
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);

  const enrolledCourseIds = useMemo(
    () => new Set(myEnrollments.map((e) => e.courseId)),
    [myEnrollments],
  );

  const myCourses = useMemo(
    () => courses.filter((c) => enrolledCourseIds.has(c.id)),
    [courses, enrolledCourseIds],
  );

  const activeCourses = tab === "all" ? courses : myCourses;

  const pageCount = Math.max(1, Math.ceil(activeCourses.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = activeCourses.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleTab = (next) => {
    setTab(next);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex gap-3">
        <button
          onClick={() => handleTab("all")}
          className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
            tab === "all"
              ? "bg-[#149ad9] text-white shadow-sm"
              : "bg-white text-gray-500 shadow-sm hover:text-gray-800"
          }`}
        >
          All Course
        </button>
        <button
          onClick={() => handleTab("my")}
          className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
            tab === "my"
              ? "bg-[#149ad9] text-white shadow-sm"
              : "bg-white text-gray-500 shadow-sm hover:text-gray-800"
          }`}
        >
          My Course
        </button>
      </div>

      {/* Grid */}
      {paged.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 text-center">
          <p className="text-base font-semibold text-gray-500">No courses found</p>
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

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center gap-2">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${
                n === safePage
                  ? "bg-[#149ad9] text-white shadow-sm"
                  : "bg-white text-gray-500 shadow-sm hover:text-gray-800"
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
