import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button-1";
import { CourseCard } from "../components/ui/CourseCard";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "../components/ui/pagination";
import { useLms } from "../data/LmsContext";

const pageSize = 6;

export function CatalogPage() {
  const { courses, categories, enrollmentByCourseId } = useLms();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [priceType, setPriceType] = useState("all");
  const [language, setLanguage] = useState("all");
  const [sortBy, setSortBy] = useState("popularity");
  const [page, setPage] = useState(1);

  const languages = useMemo(
    () => ["all", ...new Set(courses.map((item) => item.language))],
    [courses],
  );

  const filtered = useMemo(() => {
    const list = courses
      .filter((course) =>
        course.title.toLowerCase().includes(search.trim().toLowerCase()),
      )
      .filter((course) => (category === "all" ? true : course.category === category))
      .filter((course) =>
        difficulty === "all" ? true : course.difficulty === difficulty,
      )
      .filter((course) => {
        if (priceType === "free") return course.price === 0;
        if (priceType === "paid") return course.price > 0;
        return true;
      })
      .filter((course) => (language === "all" ? true : course.language === language))
      .sort((a, b) => {
        if (sortBy === "rating") return b.rating - a.rating;
        if (sortBy === "priceAsc") return a.price - b.price;
        if (sortBy === "priceDesc") return b.price - a.price;
        return b.studentCount - a.studentCount;
      });

    return list;
  }, [courses, search, category, difficulty, priceType, language, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const normalizedPage = Math.min(page, pageCount);
  const pagedCourses = filtered.slice(
    (normalizedPage - 1) * pageSize,
    normalizedPage * pageSize,
  );

  const pageItems = useMemo(() => {
    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, (_, index) => index + 1);
    }

    if (normalizedPage <= 3) {
      return [1, 2, 3, 4, "ellipsis", pageCount];
    }

    if (normalizedPage >= pageCount - 2) {
      return [1, "ellipsis", pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
    }

    return [
      1,
      "ellipsis",
      normalizedPage - 1,
      normalizedPage,
      normalizedPage + 1,
      "ellipsis",
      pageCount,
    ];
  }, [normalizedPage, pageCount]);

  return (
    <section>
      <h2>Course Catalog</h2>
      <div className="filters filters-wide">
        <input
          placeholder="Search by title"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />

        <select
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={difficulty}
          onChange={(event) => {
            setDifficulty(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>

        <select
          value={priceType}
          onChange={(event) => {
            setPriceType(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Prices</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>

        <select
          value={language}
          onChange={(event) => {
            setLanguage(event.target.value);
            setPage(1);
          }}
        >
          {languages.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          <option value="popularity">Popularity</option>
          <option value="rating">Rating</option>
          <option value="priceAsc">Price: Low to High</option>
          <option value="priceDesc">Price: High to Low</option>
        </select>
      </div>

      <div className="cards-grid">
        {pagedCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            isEnrolled={Boolean(enrollmentByCourseId[course.id])}
          />
        ))}
      </div>

      <div className="pagination">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="ghost"
                disabled={normalizedPage === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                <ChevronLeft className="rtl:rotate-180" />
                Prev
              </Button>
            </PaginationItem>

            {pageItems.map((item, index) => (
              <PaginationItem key={`${item}-${index}`}>
                {item === "ellipsis" ? (
                  <PaginationEllipsis />
                ) : (
                  <Button
                    mode="icon"
                    variant={item === normalizedPage ? "outline" : "ghost"}
                    onClick={() => setPage(item)}
                  >
                    {item}
                  </Button>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <Button
                variant="ghost"
                disabled={normalizedPage === pageCount}
                onClick={() => setPage((prev) => Math.min(prev + 1, pageCount))}
              >
                Next
                <ChevronRight className="rtl:rotate-180" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </section>
  );
}
