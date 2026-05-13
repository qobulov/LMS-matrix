import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  Clock,
  Globe,
  GraduationCap,
  Lock,
  PlayCircle,
  Star,
  Users,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useLms } from "../data/LmsContext";
import { formatDate } from "../utils/format";

function totalLessons(course) {
  return course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
}

function flattenLessons(course) {
  return course.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      ...lesson,
      moduleTitle: module.title,
      moduleId: module.id,
    })),
  );
}

function formatPriceUZS(n) {
  return new Intl.NumberFormat("uz-UZ").format(n) + " so'm";
}

function CourseSyllabusSection({ course, enrollment }) {
  const [openModuleIds, setOpenModuleIds] = useState(
    () => new Set(course.modules.map((m) => m.id)),
  );

  const toggleModule = (id) => {
    setOpenModuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
        <GraduationCap className="h-5 w-5 text-damiun-primary" />
        Syllabus
      </h2>
      <div className="space-y-3">
        {course.modules.map((module) => {
          const isOpen = openModuleIds.has(module.id);
          return (
            <div key={module.id} className="overflow-hidden rounded-xl border border-gray-100">
              <button
                type="button"
                onClick={() => toggleModule(module.id)}
                className="flex w-full items-center justify-between gap-2 bg-gray-50 px-4 py-3 text-left font-semibold text-damiun-wordmark transition hover:bg-gray-100"
              >
                <span>{module.title}</span>
                <ChevronDown className={`h-5 w-5 shrink-0 transition ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <ul className="divide-y divide-gray-100 bg-white">
                  {module.lessons.map((lesson) => {
                    const canPreview = lesson.isPreview;
                    const locked = !enrollment && !canPreview;
                    return (
                      <li key={lesson.id} className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm">
                        {canPreview ? (
                          <Link
                            to={`/learn/${course.id}/${lesson.id}`}
                            className="inline-flex items-center gap-2 font-medium text-damiun-primary hover:underline"
                          >
                            <PlayCircle className="h-4 w-4" />
                            {lesson.title}
                          </Link>
                        ) : (
                          <span className="font-medium text-damiun-wordmark">{lesson.title}</span>
                        )}
                        <span className="text-xs text-damiun-muted">{lesson.durationMin} min</span>
                        {canPreview && (
                          <span className="rounded-full bg-damiun-nav-tint px-2 py-0.5 text-[10px] font-bold uppercase text-damiun-primary">
                            Preview
                          </span>
                        )}
                        {locked && (
                          <span className="inline-flex items-center gap-1 text-xs text-damiun-muted">
                            <Lock className="h-3.5 w-3.5" />
                            Enroll to unlock
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const {
    courses,
    users,
    currentUser,
    role,
    enrollmentByCourseId,
    enrollToCourse,
    addCourseReview,
    isAuthenticated,
  } = useLms();

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const course = useMemo(() => courses.find((c) => c.id === courseId), [courses, courseId]);
  const instructor = useMemo(
    () => (course ? users.find((u) => u.id === course.instructorId) : null),
    [course, users],
  );
  const enrollment = course ? enrollmentByCourseId[course.id] : undefined;

  const lessonCount = useMemo(() => (course ? totalLessons(course) : 0), [course]);

  const nextLesson = useMemo(() => {
    if (!course) return null;
    const flat = flattenLessons(course);
    if (!enrollment) return flat[0] || null;
    const done = new Set(enrollment.completedLessonIds);
    return flat.find((l) => !done.has(l.id)) || flat[0] || null;
  }, [course, enrollment]);

  const handleEnroll = () => {
    if (!course || !currentUser) return;
    if (currentUser.role !== "student") return;
    if (enrollment) return;
    if (course.price > 0) {
      const ok = window.confirm(
        `Emulate payment of ${formatPriceUZS(course.price)} for "${course.title}"?`,
      );
      if (!ok) return;
    }
    enrollToCourse(course.id);
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!course || !reviewText.trim()) return;
    addCourseReview({ courseId: course.id, rating: reviewRating, text: reviewText.trim() });
    setReviewText("");
    setReviewRating(5);
  };

  if (!course) {
    return (
      <div className="min-h-screen bg-damiun-surface-app px-4 py-16 text-center">
        <p className="text-damiun-muted">Course not found.</p>
        <button
          type="button"
          onClick={() => navigate("/catalog")}
          className="mt-4 text-sm font-semibold text-damiun-primary hover:underline"
        >
          Back to catalog
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-damiun-surface-app pb-16 text-damiun-wordmark">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <button
            type="button"
            onClick={() => navigate("/catalog")}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-damiun-body transition hover:bg-gray-100"
            aria-label="Back to course catalog"
          >
            <ArrowLeft className="h-4 w-4" />
            Catalog
          </button>
          {!isAuthenticated ? (
            <Link
              to="/login"
              className="rounded-full bg-damiun-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-damiun-primary-hover"
            >
              Sign in to enroll
            </Link>
          ) : (
            <Link to="/" className="text-sm font-semibold text-damiun-primary hover:underline">
              Overview
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 space-y-8">
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
              <div className="aspect-[21/9] max-h-80 w-full overflow-hidden md:max-h-none">
                <img src={course.coverImage} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-damiun-nav-tint px-3 py-1 text-xs font-bold uppercase tracking-wide text-damiun-primary">
                    {course.category}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold capitalize text-gray-600">
                    {course.difficulty}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                    {course.status}
                  </span>
                </div>
                <h1 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl">{course.title}</h1>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-damiun-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-damiun-primary" />
                    {lessonCount} lessons
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-damiun-primary" />
                    {course.durationHours}h total
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-damiun-primary" />
                    {course.language}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-damiun-primary" />
                    {course.studentCount} students
                  </span>
                  {course.rating != null && (
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                      {course.rating} ({course.reviewCount} reviews)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {instructor && (
              <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
                <h2 className="text-lg font-bold">Instructor</h2>
                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                  {instructor.avatar ? (
                    <img src={instructor.avatar} alt="" className="h-20 w-20 rounded-2xl object-cover" />
                  ) : (
                    <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-damiun-nav-tint text-2xl font-bold text-damiun-primary">
                      {instructor.fullName?.[0]}
                    </span>
                  )}
                  <div>
                    <p className="text-xl font-semibold">{instructor.fullName}</p>
                    {instructor.rating != null && (
                      <p className="mt-1 text-sm text-amber-600">Instructor rating {instructor.rating.toFixed(1)}</p>
                    )}
                    <p className="mt-2 max-w-prose text-sm leading-relaxed text-damiun-body">{instructor.bio}</p>
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
              <h2 className="text-lg font-bold">About this course</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-damiun-body">{course.description}</p>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
              <h2 className="text-lg font-bold">What you&apos;ll learn</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {(course.whatYouWillLearn || []).map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-damiun-body">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
              <h2 className="text-lg font-bold">Requirements</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-damiun-body">
                {(course.requirements || []).map((req) => (
                  <li key={req}>{req}</li>
                ))}
              </ul>
            </section>

            <CourseSyllabusSection key={course.id} course={course} enrollment={enrollment} />

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
              <h2 className="text-lg font-bold">Student reviews</h2>
              {(course.reviews || []).length === 0 ? (
                <p className="mt-3 text-sm text-damiun-muted">No reviews yet.</p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {course.reviews.map((r) => (
                    <li key={r.id} className="rounded-xl border border-gray-100 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{r.author}</span>
                        <span className="text-amber-600">{"★".repeat(r.rating)}</span>
                        <span className="text-xs text-damiun-muted">{formatDate(r.date)}</span>
                      </div>
                      <p className="mt-2 text-sm text-damiun-body">{r.text}</p>
                    </li>
                  ))}
                </ul>
              )}

              {role === "student" && enrollment?.status === "completed" && (
                <form onSubmit={handleReviewSubmit} className="mt-6 space-y-3 rounded-xl border border-damiun-primary/20 bg-damiun-nav-tint/40 p-4">
                  <p className="text-sm font-semibold text-damiun-wordmark">Leave a review</p>
                  <label className="block text-xs font-medium text-damiun-muted">
                    Rating
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} stars
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-medium text-damiun-muted">
                    Comment
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                      placeholder="Share your experience..."
                      required
                    />
                  </label>
                  <button type="submit" className="rounded-full bg-damiun-primary px-5 py-2 text-sm font-semibold text-white hover:bg-damiun-primary-hover">
                    Submit review
                  </button>
                </form>
              )}
            </section>
          </div>

          <aside className="w-full shrink-0 space-y-4 lg:sticky lg:top-6 lg:w-80">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <p className="text-sm text-damiun-muted">Price</p>
              <p className="mt-1 text-3xl font-bold text-damiun-wordmark">
                {course.price === 0 ? "Free" : formatPriceUZS(course.price)}
              </p>
              <p className="mt-2 text-xs text-damiun-muted">{lessonCount} lessons · Pass final quiz for certificate</p>

              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="mt-6 flex w-full items-center justify-center rounded-full bg-damiun-primary py-3 text-sm font-bold text-white shadow-sm hover:bg-damiun-primary-hover"
                >
                  Sign in to enroll
                </Link>
              )}

              {isAuthenticated && role !== "student" && (
                <p className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-damiun-muted">
                  Only student accounts can enroll. Switch role or register as a student.
                </p>
              )}

              {isAuthenticated && role === "student" && !enrollment && (
                <button
                  type="button"
                  onClick={handleEnroll}
                  className="mt-6 w-full rounded-full bg-damiun-primary py-3 text-sm font-bold text-white shadow-sm transition hover:bg-damiun-primary-hover"
                >
                  {course.price > 0 ? "Enroll (mock pay)" : "Enroll free"}
                </button>
              )}

              {isAuthenticated && role === "student" && enrollment && nextLesson && (
                <Link
                  to={`/learn/${course.id}/${nextLesson.id}`}
                  className="mt-6 flex w-full items-center justify-center rounded-full bg-damiun-primary py-3 text-sm font-bold text-white shadow-sm hover:bg-damiun-primary-hover"
                >
                  Continue learning
                </Link>
              )}

              {isAuthenticated && role === "student" && enrollment && (
                <div className="mt-4 space-y-2 text-center text-xs text-damiun-muted">
                  <p>Progress: {enrollment.progress}%</p>
                  <Link to={`/quiz/${course.id}`} className="block font-semibold text-damiun-primary hover:underline">
                    Final quiz
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
