import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  ClipboardList,
  Layers,
  Link as LinkIcon,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { courseApi, quizApi } from "../../api/endpoints";
import { EditCourseModal } from "../../components/instructor/EditCourseModal";
import { EditLessonModal } from "../../components/instructor/EditLessonModal";
import { useLms } from "../../data/LmsContext";
import { mapCourseDetail } from "../../utils/gatewayMappers";
import { mapInstructorCourse } from "../../utils/instructorMappers";

const ic =
  "mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-damiun-primary focus:bg-white focus:ring-2 focus:ring-damiun-primary/20";
const lc = "block text-sm font-medium text-damiun-wordmark";

// ─── CoursePicker ─────────────────────────────────────────────────────────────

function CoursePicker({ courses, loading }) {
  if (loading) return <p className="py-12 text-center text-sm text-gray-500">Yuklanmoqda…</p>;

  if (courses.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
        <BookOpen className="mx-auto mb-3 h-10 w-10 text-gray-200" />
        <p className="text-sm font-medium text-damiun-wordmark">Hali kurs yo'q</p>
        <Link
          to="/instructor/create-course"
          className="mt-3 inline-block rounded-full bg-damiun-primary px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-damiun-primary-hover"
        >
          + Yangi kurs yaratish
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <Link
          key={course.id}
          to={`/instructor/courses/${course.id}`}
          className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50 transition hover:border-damiun-primary/30 hover:shadow-md"
        >
          <p className="font-semibold text-damiun-wordmark group-hover:text-damiun-primary">
            {course.title}
          </p>
          <span
            className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
              course.status === "published"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {course.status}
          </span>
          <p className="mt-3 text-xs text-damiun-muted">
            {course.modules.length} modul · {course.studentCount} talaba
          </p>
        </Link>
      ))}
    </div>
  );
}

// ─── CourseBuilder ────────────────────────────────────────────────────────────

const TABS = [
  { id: "content", label: "Kontent", icon: Layers },
  { id: "quiz",    label: "Quiz",    icon: ClipboardList },
];

function emptyQuestion() {
  return {
    key: Math.random(),
    prompt: "",
    question_type: "single",
    options: [
      { key: Math.random(), option_text: "", is_correct: true },
      { key: Math.random(), option_text: "", is_correct: false },
    ],
  };
}

function CourseBuilder({ courseId, myCourses, onCoursesChange }) {
  const { getToken } = useLms();
  const course = myCourses.find((c) => c.id === courseId);

  const [tab, setTab] = useState("content");
  const [editCourseOpen, setEditCourseOpen] = useState(false);
  const [editLesson, setEditLesson] = useState(null);
  const [courseDetail, setCourseDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Content state
  const [moduleTitle, setModuleTitle] = useState("");
  const [lessonForm, setLessonForm] = useState({
    moduleId: "", title: "", durationMin: 15, isPreview: false, resourceUrl: "",
  });

  // Quiz state
  const [quizList, setQuizList] = useState([]);
  const [quizListLoading, setQuizListLoading] = useState(false);
  // quizView: "list" | "detail" | "form"
  const [quizView, setQuizView] = useState("list");
  const [quizDetail, setQuizDetail] = useState(null);
  const [quizDetailLoading, setQuizDetailLoading] = useState(false);

  const EMPTY_FORM = { editingId: null, modules_id: "", title: "", time_limit_min: 30, pass_threshold: 70, max_attempts: 3, questions: [emptyQuestion()] };
  const [quizForm, setQuizForm] = useState(EMPTY_FORM);
  const [quizSaving, setQuizSaving] = useState(false);

  const loadCourseDetails = useCallback(async () => {
    const token = getToken();
    if (!token || !courseId) return;
    setDetailLoading(true);
    try {
      const raw = await courseApi.getById(courseId, { token });
      setCourseDetail(mapCourseDetail(raw));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Yuklab bo'lmadi");
    } finally {
      setDetailLoading(false);
    }
  }, [courseId, getToken]);

  const loadQuizList = useCallback(async () => {
    const token = getToken();
    if (!token || !courseId) return;
    setQuizListLoading(true);
    try {
      const data = await quizApi.list(courseId, { token });
      setQuizList(data.quizzes ?? data.data ?? []);
    } catch {
      setQuizList([]);
    } finally {
      setQuizListLoading(false);
    }
  }, [courseId, getToken]);

  useEffect(() => { void loadCourseDetails(); }, [loadCourseDetails]);
  useEffect(() => { void loadQuizList(); }, [loadQuizList]);

  const refresh = async () => { await onCoursesChange(); await loadCourseDetails(); };

  if (!course) {
    return (
      <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-4 text-sm text-amber-950">
        Kurs topilmadi.{" "}
        <Link to="/instructor/courses" className="font-semibold text-damiun-primary hover:underline">
          Ro'yxatga qaytish
        </Link>
      </div>
    );
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  const createModule = async (e) => {
    e.preventDefault();
    if (!moduleTitle.trim()) return;
    const token = getToken();
    if (!token) return;
    try {
      await courseApi.addModule({ courses_id: courseId, title: moduleTitle.trim() }, { token });
      setModuleTitle("");
      toast.success("Modul qo'shildi");
      await refresh();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Xato"); }
  };

  const createLesson = async (e) => {
    e.preventDefault();
    if (!lessonForm.moduleId || !lessonForm.title.trim()) return;
    const token = getToken();
    if (!token) return;
    try {
      await courseApi.addLesson(
        {
          courses_id: courseId,
          modules_id: lessonForm.moduleId,
          title: lessonForm.title.trim(),
          video_url: lessonForm.resourceUrl.trim() || "https://cdn.u-code.io/placeholder-lesson-video.mp4",
          duration_min: Number(lessonForm.durationMin) || 10,
          is_preview: lessonForm.isPreview,
        },
        { token },
      );
      setLessonForm({ moduleId: "", title: "", durationMin: 15, isPreview: false, resourceUrl: "" });
      toast.success("Dars qo'shildi");
      await refresh();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Xato"); }
  };

  const openQuizDetail = async (quizId) => {
    const token = getToken();
    if (!token) return;
    setQuizDetailLoading(true);
    setQuizView("detail");
    setQuizDetail(null);
    try {
      const data = await quizApi.detail(quizId, { token });
      setQuizDetail(data.quiz ?? data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Yuklab bo'lmadi");
      setQuizView("list");
    } finally {
      setQuizDetailLoading(false);
    }
  };

  const openEditForm = (q) => {
    setQuizForm({
      editingId: String(q.id),
      modules_id: q.modules_id ?? "",
      title: q.title ?? "",
      time_limit_min: q.time_limit_min ?? 30,
      pass_threshold: q.pass_threshold ?? 70,
      max_attempts: q.max_attempts ?? 3,
      questions: (q.questions ?? []).length > 0
        ? q.questions.map((sq) => ({
            key: Math.random(),
            prompt: sq.prompt ?? "",
            question_type: sq.question_type ?? "single",
            options: (sq.options ?? []).map((o) => ({
              key: Math.random(),
              option_text: o.option_text ?? "",
              is_correct: Boolean(o.is_correct),
            })),
          }))
        : [emptyQuestion()],
    });
    setQuizView("form");
  };

  const saveQuiz = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    const questions = quizForm.questions.map(({ prompt, question_type, options }) => ({
      prompt: prompt.trim(),
      question_type,
      options: options.map(({ option_text, is_correct }) => ({
        option_text: option_text.trim(), is_correct,
      })),
    }));
    if (!quizForm.title.trim() || questions.some((q) => !q.prompt || q.options.some((o) => !o.option_text))) {
      toast.error("Barcha maydonlarni to'ldiring");
      return;
    }
    setQuizSaving(true);
    try {
      if (quizForm.editingId) {
        await quizApi.update(
          {
            quiz_id: quizForm.editingId,
            title: quizForm.title.trim(),
            time_limit_min: Number(quizForm.time_limit_min),
            pass_threshold: Number(quizForm.pass_threshold),
            max_attempts: Number(quizForm.max_attempts),
            questions,
          },
          { token },
        );
        toast.success("Quiz yangilandi");
      } else {
        await quizApi.create(
          {
            courses_id: courseId,
            ...(quizForm.modules_id ? { modules_id: quizForm.modules_id } : {}),
            title: quizForm.title.trim(),
            time_limit_min: Number(quizForm.time_limit_min),
            pass_threshold: Number(quizForm.pass_threshold),
            max_attempts: Number(quizForm.max_attempts),
            questions,
          },
          { token },
        );
        toast.success("Quiz yaratildi");
      }
      const wasEditing = Boolean(quizForm.editingId);
      setQuizForm(EMPTY_FORM);
      await loadQuizList();
      if (wasEditing && quizDetail) {
        // refresh detail
        const token2 = getToken();
        if (token2) {
          try {
            const d = await quizApi.detail(quizDetail.id, { token: token2 });
            setQuizDetail(d.quiz ?? d);
          } catch { /* ignore */ }
        }
        setQuizView("detail");
      } else {
        setQuizView("list");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Quiz saqlanmadi");
    } finally {
      setQuizSaving(false);
    }
  };

  const updateQ = (qi, patch) =>
    setQuizForm((p) => {
      const questions = [...p.questions];
      questions[qi] = { ...questions[qi], ...patch };
      return { ...p, questions };
    });

  const updateOpt = (qi, oi, patch) =>
    setQuizForm((p) => {
      const questions = [...p.questions];
      const options = [...questions[qi].options];
      options[oi] = { ...options[oi], ...patch };
      questions[qi] = { ...questions[qi], options };
      return { ...p, questions };
    });

  const toggleCorrect = (qi, oi) => {
    const q = quizForm.questions[qi];
    if (q.question_type === "multiple") {
      updateOpt(qi, oi, { is_correct: !q.options[oi].is_correct });
    } else {
      setQuizForm((p) => {
        const questions = [...p.questions];
        questions[qi] = {
          ...questions[qi],
          options: questions[qi].options.map((o, i) => ({ ...o, is_correct: i === oi })),
        };
        return { ...p, questions };
      });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-damiun-wordmark">{course.title}</h2>
          <span
            className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
              course.status === "published"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {course.status}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditCourseOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-damiun-wordmark shadow-sm hover:bg-damiun-nav-tint"
          >
            <Pencil size={13} /> Tahrirlash
          </button>
          <Link
            to={`/courses/${courseId}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-damiun-primary/30 px-4 py-2 text-sm font-semibold text-damiun-primary hover:bg-damiun-nav-tint"
          >
            <LinkIcon size={13} /> Ko'rish
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              tab === id
                ? "bg-white text-damiun-primary shadow-sm"
                : "text-damiun-muted hover:text-damiun-wordmark"
            }`}
          >
            <Icon size={15} />
            {label}
            {id === "quiz" && quizList.length > 0 && (
              <span className="rounded-full bg-damiun-primary px-1.5 py-0.5 text-[10px] font-bold text-white">{quizList.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENT TAB ─────────────────────────────────────────────────────── */}
      {tab === "content" && (
        <div className="flex flex-col gap-5">

          {/* Add module */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
            <p className="mb-3 text-sm font-semibold text-damiun-wordmark">Modul qo'shish</p>
            <form onSubmit={createModule} className="flex gap-2">
              <input
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                placeholder="Modul nomi, masalan: Kirish"
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-damiun-primary focus:bg-white focus:ring-2 focus:ring-damiun-primary/20"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-damiun-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-damiun-primary-hover"
              >
                <Plus size={15} /> Qo'shish
              </button>
            </form>
          </div>

          {/* Add lesson */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
            <p className="mb-4 text-sm font-semibold text-damiun-wordmark">Dars qo'shish</p>
            <form onSubmit={createLesson} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={lc}>
                  Modul
                  <select
                    value={lessonForm.moduleId}
                    onChange={(e) => setLessonForm((p) => ({ ...p, moduleId: e.target.value }))}
                    className={ic}
                    required
                  >
                    <option value="">Modul tanlang</option>
                    {course.modules.map((m) => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </label>
                <label className={lc}>
                  Dars nomi
                  <input
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm((p) => ({ ...p, title: e.target.value }))}
                    className={ic} placeholder="Masalan: O'zgaruvchilar" required
                  />
                </label>
                <label className={lc}>
                  Davomiyligi (daqiqa)
                  <input
                    type="number" min="1"
                    value={lessonForm.durationMin}
                    onChange={(e) => setLessonForm((p) => ({ ...p, durationMin: Number(e.target.value) || 1 }))}
                    className={ic}
                  />
                </label>
                <label className={lc}>
                  Video URL
                  <input
                    value={lessonForm.resourceUrl}
                    onChange={(e) => setLessonForm((p) => ({ ...p, resourceUrl: e.target.value }))}
                    className={ic} placeholder="https://..."
                  />
                </label>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-damiun-wordmark">
                <input
                  type="checkbox" checked={lessonForm.isPreview}
                  onChange={(e) => setLessonForm((p) => ({ ...p, isPreview: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-damiun-primary"
                />
                Bepul ko'rish (preview)
              </label>
              <div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-damiun-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-damiun-primary-hover"
                >
                  <Plus size={15} /> Dars qo'shish
                </button>
              </div>
            </form>
          </div>

          {/* Course content tree */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
            <p className="mb-4 text-sm font-semibold text-damiun-wordmark">Kurs tarkibi</p>
            {detailLoading && !courseDetail ? (
              <p className="text-sm text-damiun-muted">Yuklanmoqda…</p>
            ) : !courseDetail?.modules?.length ? (
              <p className="text-sm text-damiun-muted">Hali modul yo'q.</p>
            ) : (
              <ul className="space-y-3">
                {courseDetail.modules.map((mod) => (
                  <li key={mod.id} className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2.5 text-sm font-semibold text-damiun-wordmark">
                      {mod.title}
                    </div>
                    {mod.lessons.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-damiun-muted">Dars yo'q.</p>
                    ) : (
                      <ul className="divide-y divide-gray-50">
                        {mod.lessons.map((lesson) => (
                          <li key={lesson.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                            <span className="min-w-0 flex-1 truncate text-sm text-damiun-body">
                              {lesson.title}
                              {lesson.isPreview && (
                                <span className="ml-2 text-[10px] font-bold uppercase text-damiun-primary">preview</span>
                              )}
                              <span className="ml-2 text-xs text-damiun-muted">{lesson.durationMin} min</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditLesson({ courseId, lesson })}
                              className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-damiun-primary hover:bg-damiun-nav-tint"
                            >
                              <Pencil size={12} /> Tahrir
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
        </div>
      )}

      {/* ── QUIZ TAB ─────────────────────────────────────────────────────────── */}
      {tab === "quiz" && (
        <div className="flex flex-col gap-4">

          {/* ── LIST view ──────────────────────────────────────────────────── */}
          {quizView === "list" && (
            <>
              {quizListLoading ? (
                <p className="py-8 text-center text-sm text-damiun-muted">Yuklanmoqda…</p>
              ) : quizList.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
                  <ClipboardList className="mx-auto mb-3 h-10 w-10 text-gray-200" />
                  <p className="text-sm font-medium text-damiun-wordmark">Hali quiz yo'q</p>
                  <button type="button"
                    onClick={() => { setQuizForm(EMPTY_FORM); setQuizView("form"); }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-damiun-primary px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-damiun-primary-hover">
                    <Plus size={14} /> Quiz qo'shish
                  </button>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-gray-100 bg-white shadow-sm ring-1 ring-gray-50">
                    <ul className="divide-y divide-gray-50">
                      {quizList.map((q) => (
                        <li key={q.id}
                          className="flex cursor-pointer items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition"
                          onClick={() => void openQuizDetail(String(q.id))}>
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-damiun-primary/10 text-damiun-primary">
                            <ClipboardList size={16} />
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-damiun-wordmark">{q.title}</p>
                            <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-damiun-muted">
                              {q.question_count != null && <span>{q.question_count} savol</span>}
                              {q.pass_threshold != null && <span>O'tish: {q.pass_threshold}%</span>}
                              {q.time_limit_min != null && <span>⏱ {q.time_limit_min} min</span>}
                              {q.modules_id == null && (
                                <span className="rounded-full bg-damiun-primary/10 px-2 py-0.5 font-semibold text-damiun-primary">Final</span>
                              )}
                            </div>
                          </div>
                          <ChevronRight size={16} className="shrink-0 text-gray-300" />
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button type="button"
                    onClick={() => { setQuizForm(EMPTY_FORM); setQuizView("form"); }}
                    className="self-start inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-damiun-wordmark shadow-sm hover:bg-damiun-nav-tint">
                    <Plus size={14} /> Yangi quiz
                  </button>
                </>
              )}
            </>
          )}

          {/* ── DETAIL view ────────────────────────────────────────────────── */}
          {quizView === "detail" && (
            <div className="flex flex-col gap-4">
              <button type="button" onClick={() => setQuizView("list")}
                className="self-start inline-flex items-center gap-1 text-sm font-semibold text-damiun-primary hover:underline">
                <ArrowLeft size={14} /> Ro'yxatga qaytish
              </button>

              {quizDetailLoading || !quizDetail ? (
                <p className="py-10 text-center text-sm text-damiun-muted">Yuklanmoqda…</p>
              ) : (
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm ring-1 ring-gray-50 overflow-hidden">
                  {/* Quiz header */}
                  <div className="flex items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/60 px-5 py-4">
                    <div>
                      <p className="font-semibold text-damiun-wordmark">{quizDetail.title}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-damiun-muted">
                        <span>⏱ {quizDetail.time_limit_min} daqiqa</span>
                        <span>O'tish: {quizDetail.pass_threshold}%</span>
                        <span>Maks urinish: {quizDetail.max_attempts}</span>
                        {quizDetail.modules_id == null && (
                          <span className="rounded-full bg-damiun-primary/10 px-2 py-0.5 font-semibold text-damiun-primary">Final quiz</span>
                        )}
                      </div>
                    </div>
                    <button type="button"
                      onClick={() => openEditForm(quizDetail)}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-damiun-wordmark shadow-sm hover:bg-damiun-nav-tint">
                      <Pencil size={13} /> Tahrirlash
                    </button>
                  </div>

                  {/* Questions */}
                  {!quizDetail.questions?.length ? (
                    <p className="px-5 py-6 text-sm text-damiun-muted">Savollar yo'q.</p>
                  ) : (
                    <ul className="divide-y divide-gray-50">
                      {quizDetail.questions.map((q, qi) => (
                        <li key={q.id ?? qi} className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-damiun-primary/10 text-xs font-bold text-damiun-primary">
                              {qi + 1}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-damiun-wordmark">{q.prompt}</p>
                              <ul className="mt-2 flex flex-col gap-1.5">
                                {(q.options ?? []).map((o, oi) => (
                                  <li key={o.id ?? oi}
                                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
                                      o.is_correct
                                        ? "bg-emerald-50 text-emerald-800 font-medium"
                                        : "bg-gray-50 text-damiun-muted"
                                    }`}>
                                    <span className={`h-2 w-2 shrink-0 rounded-full ${o.is_correct ? "bg-emerald-500" : "bg-gray-300"}`} />
                                    {o.option_text}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── FORM view ──────────────────────────────────────────────────── */}
          {quizView === "form" && (
            <div className="flex flex-col gap-4">
              <button type="button"
                onClick={() => { setQuizView(quizForm.editingId ? "detail" : "list"); setQuizForm(EMPTY_FORM); }}
                className="self-start inline-flex items-center gap-1 text-sm font-semibold text-damiun-primary hover:underline">
                <ArrowLeft size={14} /> {quizForm.editingId ? "Detailga qaytish" : "Ro'yxatga qaytish"}
              </button>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
                <p className="mb-5 text-sm font-semibold text-damiun-wordmark">
                  {quizForm.editingId ? "Quizni tahrirlash" : "Yangi quiz yaratish"}
                </p>

                <form onSubmit={saveQuiz} className="flex flex-col gap-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className={lc}>
                      Quiz nomi
                      <input value={quizForm.title}
                        onChange={(e) => setQuizForm((p) => ({ ...p, title: e.target.value }))}
                        className={ic} placeholder="Python asoslari testi" required />
                    </label>
                    <label className={lc}>
                      Modul <span className="text-xs font-normal text-damiun-muted">(bo'sh = final quiz)</span>
                      <select value={quizForm.modules_id}
                        onChange={(e) => setQuizForm((p) => ({ ...p, modules_id: e.target.value }))}
                        className={ic}>
                        <option value="">Final quiz</option>
                        {course.modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                      </select>
                    </label>
                    <label className={lc}>
                      Vaqt (daqiqa)
                      <input type="number" min="1" value={quizForm.time_limit_min}
                        onChange={(e) => setQuizForm((p) => ({ ...p, time_limit_min: Number(e.target.value) || 30 }))}
                        className={ic} />
                    </label>
                    <label className={lc}>
                      O'tish chegarasi (%)
                      <input type="number" min="1" max="100" value={quizForm.pass_threshold}
                        onChange={(e) => setQuizForm((p) => ({ ...p, pass_threshold: Number(e.target.value) || 70 }))}
                        className={ic} />
                    </label>
                    <label className={lc}>
                      Maksimal urinish
                      <input type="number" min="1" value={quizForm.max_attempts}
                        onChange={(e) => setQuizForm((p) => ({ ...p, max_attempts: Number(e.target.value) || 3 }))}
                        className={ic} />
                    </label>
                  </div>

                  {/* Questions */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-damiun-wordmark">
                        Savollar <span className="ml-1 rounded-full bg-damiun-primary/10 px-2 py-0.5 text-xs text-damiun-primary">{quizForm.questions.length}</span>
                      </p>
                      <button type="button"
                        onClick={() => setQuizForm((p) => ({ ...p, questions: [...p.questions, emptyQuestion()] }))}
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-damiun-primary hover:bg-damiun-nav-tint">
                        <Plus size={12} /> Savol qo'shish
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      {quizForm.questions.map((q, qi) => (
                        <div key={q.key} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-damiun-primary/10 text-xs font-bold text-damiun-primary">
                              {qi + 1}
                            </span>
                            <input value={q.prompt}
                              onChange={(e) => updateQ(qi, { prompt: e.target.value })}
                              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-damiun-primary"
                              placeholder="Savol matni" required />
                            <select value={q.question_type}
                              onChange={(e) => updateQ(qi, { question_type: e.target.value })}
                              className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs">
                              <option value="single">Bitta</option>
                              <option value="multiple">Ko'p</option>
                            </select>
                            {quizForm.questions.length > 1 && (
                              <button type="button"
                                onClick={() => setQuizForm((p) => ({ ...p, questions: p.questions.filter((_, i) => i !== qi) }))}
                                className="rounded-full p-1.5 text-red-400 hover:bg-red-50">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>

                          <div className="mt-3 flex flex-col gap-2 pl-8">
                            {q.options.map((opt, oi) => (
                              <div key={opt.key} className="flex items-center gap-2">
                                <input
                                  type={q.question_type === "multiple" ? "checkbox" : "radio"}
                                  name={`correct-${q.key}`}
                                  checked={opt.is_correct}
                                  onChange={() => toggleCorrect(qi, oi)}
                                  className="h-4 w-4 text-damiun-primary"
                                  title="To'g'ri javob"
                                />
                                <input value={opt.option_text}
                                  onChange={(e) => updateOpt(qi, oi, { option_text: e.target.value })}
                                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-damiun-primary"
                                  placeholder={`Javob ${oi + 1}`} required />
                                {q.options.length > 2 && (
                                  <button type="button"
                                    onClick={() => setQuizForm((p) => {
                                      const questions = [...p.questions];
                                      questions[qi] = { ...questions[qi], options: questions[qi].options.filter((_, i) => i !== oi) };
                                      return { ...p, questions };
                                    })}
                                    className="rounded-full p-1 text-red-400 hover:bg-red-50">
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button type="button"
                              onClick={() => setQuizForm((p) => {
                                const questions = [...p.questions];
                                questions[qi] = { ...questions[qi], options: [...questions[qi].options, { key: Math.random(), option_text: "", is_correct: false }] };
                                return { ...p, questions };
                              })}
                              className="mt-1 inline-flex w-fit items-center gap-1 text-xs font-medium text-damiun-primary hover:underline">
                              <Plus size={11} /> Javob qo'shish
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <button type="submit" disabled={quizSaving}
                      className="inline-flex items-center gap-2 rounded-xl bg-damiun-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-damiun-primary-hover disabled:opacity-60">
                      <ClipboardList size={15} />
                      {quizSaving ? "Saqlanmoqda…" : quizForm.editingId ? "Saqlash" : "Quiz yaratish"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      <EditCourseModal open={editCourseOpen} onOpenChange={setEditCourseOpen}
        courseId={courseId} onSuccess={() => void refresh()} />
      <EditLessonModal
        open={Boolean(editLesson)}
        onOpenChange={(open) => { if (!open) setEditLesson(null); }}
        courseId={editLesson?.courseId ?? courseId}
        lesson={editLesson?.lesson ?? null}
        onSuccess={() => void refresh()}
      />
    </>
  );
}

// ─── InstructorCoursesPage ────────────────────────────────────────────────────

export function InstructorCoursesPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useLms();
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCourses = useCallback(async () => {
    const token = getToken();
    if (!token) throw new Error("Not signed in");
    const data = await courseApi.getInstructorDashboard({ token });
    const list = (data.courses ?? []).map(mapInstructorCourse).filter(Boolean);
    setMyCourses(list);
    return list;
  }, [getToken]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const list = await loadCourses();
        if (cancelled) return;
        if (!courseId && list.length === 1) {
          navigate(`/instructor/courses/${list[0].id}`, { replace: true });
        }
      } catch {
        if (!cancelled) setMyCourses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [courseId, loadCourses, navigate]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/instructor"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-damiun-primary hover:underline">
          <ArrowLeft size={15} /> Dashboard
        </Link>
        {courseId && (
          <>
            <ChevronRight size={14} className="text-gray-300" />
            <Link to="/instructor/courses"
              className="text-sm font-semibold text-damiun-muted hover:text-damiun-primary">
              Kurslar
            </Link>
          </>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-damiun-wordmark">Course builder</h1>
        <p className="mt-1 text-sm text-damiun-muted">
          {courseId ? "Modul, dars va quiz boshqaruvi." : "Kurs tanlang."}
        </p>
      </div>

      {courseId ? (
        <CourseBuilder courseId={courseId} myCourses={myCourses} onCoursesChange={loadCourses} />
      ) : (
        <CoursePicker courses={myCourses} loading={loading} />
      )}
    </div>
  );
}
