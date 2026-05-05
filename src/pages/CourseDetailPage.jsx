import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  Circle,
  Expand,
  Gift,
  Play,
  Search,
  ShoppingBag,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useLms } from "../data/LmsContext";

function getYouTubeId(url) {
  const m = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return m?.[1] ?? null;
}

function flattenLessons(modules = []) {
  return modules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      ...lesson,
      moduleId: module.id,
      moduleTitle: module.title,
    })),
  );
}

export function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { courses, currentUser, enrollmentByCourseId, completeLesson } = useLms();
  const [searchQuery, setSearchQuery] = useState("");

  const course = useMemo(
    () => courses.find((item) => item.id === courseId),
    [courses, courseId],
  );

  const lessons = useMemo(() => flattenLessons(course?.modules || []), [course]);
  const [activeLessonId, setActiveLessonId] = useState(lessons[0]?.id || "");

  if (!course) {
    return <p className="p-8 text-sm text-gray-500">Course topilmadi.</p>;
  }

  const enrollment = enrollmentByCourseId[course.id];
  const completedSet = new Set(enrollment?.completedLessonIds || []);
  const activeIndex = lessons.findIndex((lesson) => lesson.id === activeLessonId);
  const activeLesson = activeIndex >= 0 ? lessons[activeIndex] : lessons[0];
  const completedCount = lessons.filter((lesson) => completedSet.has(lesson.id)).length;
  const progress = enrollment?.progress ?? Math.round((completedCount / Math.max(lessons.length, 1)) * 100);
  const initials = currentUser?.fullName
    ? currentUser.fullName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()
    : "A";

  const handleNext = () => {
    if (!activeLesson) return;
    completeLesson(course.id, activeLesson.id);
    const nextLesson = lessons[activeIndex + 1];
    if (nextLesson) {
      setActiveLessonId(nextLesson.id);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f5f6fa] text-[#111a2f]">
      <header className="grid h-[120px] grid-cols-[374px_1fr] border-b border-[#e8ebf2] bg-white max-md:h-auto max-md:grid-cols-1">
        <div className="flex items-center gap-5 border-r border-[#e8ebf2] px-9 py-6 max-md:border-r-0 max-md:border-b">
          <button
            type="button"
            onClick={() => navigate("/student")}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#111a2f] transition hover:bg-[#f2f4f8]"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={31} strokeWidth={2.4} />
          </button>
          <span className="text-[20px] font-medium text-[#111a2f]">Overview</span>
        </div>

        <div className="flex items-center justify-between gap-8 px-11 py-7 max-md:flex-col max-md:items-stretch max-md:px-5">
          <div className="flex h-[64px] max-w-[650px] flex-1 items-center gap-4 rounded-full border border-[#dce2ea] bg-white px-7 shadow-[0_0_0_28px_rgba(245,246,250,0.9)] max-md:max-w-none max-md:shadow-none">
            <input
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[18px] text-[#6e778e] outline-none placeholder:text-[#8f98ad] max-md:text-base"
              placeholder="Search your own courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={32} className="shrink-0 text-[#101827] max-md:h-6 max-md:w-6" />
          </div>

          <div className="flex items-center justify-end gap-8 max-md:justify-between">
            <div className="flex items-center gap-7 text-[#111827]">
              {[Gift, ShoppingBag, Bell].map((Icon, index) => (
                <button
                  key={index}
                  type="button"
                  className="relative flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-[#f2f4f8]"
                >
                  <Icon size={31} strokeWidth={2.2} />
                  <span className="absolute right-1 top-1 h-3 w-3 rounded-full bg-[#149ad9]" />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 border-l border-[#e8ebf2] pl-9 max-md:border-l-0 max-md:pl-0">
              <span className="whitespace-nowrap text-[18px] font-semibold text-[#111827] max-md:text-base">
                {currentUser?.fullName || "Adam Rezki"}
              </span>
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.fullName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#149ad9] text-[18px] font-bold text-white">
                  {initials}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="grid h-[calc(100vh-120px)] grid-cols-[374px_1fr] max-md:h-[calc(100vh-190px)] max-md:grid-cols-1 max-md:overflow-y-auto">
        <aside className="overflow-hidden border-r border-[#e8ebf2] bg-white max-md:border-r-0">
          <div className="h-[239px] overflow-hidden max-md:h-56">
            <img src={course.coverImage} alt={course.title} className="h-full w-full object-cover" />
          </div>

          <div className="border-b border-[#e8ebf2] px-9 py-10">
            <p className="text-[20px] text-[#7b849b]">Course</p>
            <h1 className="mt-2 text-[24px] font-bold leading-[1.35] text-[#111a2f]">
              {course.title}
            </h1>
          </div>

          <div className="h-[calc(100vh-521px)] overflow-y-auto px-9 py-9 max-md:h-auto">
            <div className="space-y-10">
              {course.modules.map((module) => (
                <section key={module.id}>
                  <h2 className="mb-5 text-[20px] font-bold text-[#111a2f]">
                    {module.title}
                  </h2>
                  <div className="space-y-6">
                    {module.lessons.map((lesson) => {
                      const active = lesson.id === activeLesson?.id;
                      const done = completedSet.has(lesson.id);

                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => setActiveLessonId(lesson.id)}
                          className={`flex h-[56px] w-full items-center gap-5 rounded-[28px] px-5 text-left text-xs font-medium transition ${
                            active ? "bg-[#149ad9] text-white" : "bg-[#f3f6fa] text-[#151d31] hover:bg-[#ebf4fb]"
                          }`}
                        >
                          <span
                            className={`flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full ${
                              active ? "bg-white/20 text-white" : "bg-white text-[#149ad9]"
                            }`}
                          >
                            {active || done ? <Check size={18} strokeWidth={2.5} /> : <Circle size={18} />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[18px] font-medium leading-tight">
                              {lesson.title}
                            </span>
                            <span className={`mt-1 block text-xs ${active ? "text-white/85" : "text-[#7f889e]"}`}>
                              {lesson.durationMin} min
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </aside>

        <section className="min-w-0 overflow-hidden bg-[#f5f6fa]">
          <div className="relative h-[calc(100vh-280px)] min-h-[350px] bg-[#111827] max-md:h-[45vw] max-md:min-h-[280px]">
            {(() => {
              const ytId = getYouTubeId(activeLesson?.resourceUrl);
              if (ytId) {
                return (
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=0`}
                    title={activeLesson?.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                );
              }
              if (activeLesson?.resourceUrl && !ytId) {
                return (
                  <iframe
                    src={activeLesson.resourceUrl}
                    title={activeLesson.title}
                    className="h-full w-full border-0"
                    allowFullScreen
                  />
                );
              }
              return (
                <>
                  <img
                    src="/course-player-reference.png"
                    alt=""
                    className="h-full w-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-black/12" />
                </>
              );
            })()}

            {!getYouTubeId(activeLesson?.resourceUrl) && !activeLesson?.resourceUrl && (
              <>
                <button
                  type="button"
                  onClick={() => navigate(`/courses/${courseId}`)}
                  className="absolute bottom-4 left-8 flex h-12 w-12 items-center justify-center rounded-full bg-white/35 text-white backdrop-blur"
                  aria-label="Play video"
                >
                  <Play size={32} fill="currentColor" />
                </button>

                <div className="absolute bottom-8 left-[100px] right-[80px] flex items-center gap-0 max-md:left-20 max-md:right-16">
                  <div className="h-[8px] flex-1 rounded-full bg-white/40">
                    <div
                      className="h-full rounded-full bg-[#ff9500]"
                      style={{ width: `${Math.max(progress, 48)}%` }}
                    />
                  </div>
                  <span className="ml-4 text-[16px] font-bold text-white">{Math.max(progress, 50)}%</span>
                </div>

                <button
                  type="button"
                  className="absolute bottom-6 right-11 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white/35 text-white backdrop-blur"
                  aria-label="Fullscreen"
                >
                  <Expand size={38} />
                </button>
              </>
            )}
          </div>

          <div className="flex min-h-[180px] items-center justify-between gap-6 bg-[#f5f6fa] px-10 py-8 max-md:flex-col max-md:items-start max-md:px-6">
            <div>
              <h2 className="text-[28px] font-bold leading-tight text-[#111a2f] max-md:text-2xl">
                {activeLesson?.title}
              </h2>
              <p className="mt-3 text-[18px] text-[#717b94] max-md:text-base">
                {activeLesson?.moduleTitle}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/courses/${courseId}`)}
              className="h-14 min-w-[180px] rounded-[28px] bg-[#149ad9] px-8 text-[20px] font-bold text-white transition hover:bg-[#0f89c2] max-md:h-12 max-md:min-w-0 max-md:text-lg"
            >
              {getYouTubeId(activeLesson?.resourceUrl) || activeLesson?.resourceUrl ? 'Continue Learning' : 'Start Lesson'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
