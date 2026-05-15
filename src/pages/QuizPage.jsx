/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { quizApi } from "../api/endpoints";
import { useLms } from "../data/LmsContext";
import { formatDate } from "../utils/format";

function mapQuizPayload(data) {
  const q = data?.quiz;
  if (!q) return { quiz: null, attempts: [] };
  const quiz = {
    id: String(q.id),
    title: q.title ?? "Quiz",
    timeLimitMin: q.time_limit_min ?? 30,
    passThreshold: q.pass_threshold ?? 70,
    maxAttempts: q.max_attempts ?? 3,
    questions: (q.questions ?? []).map((qu) => ({
      id: String(qu.id),
      prompt: qu.prompt ?? "",
      questionType: qu.question_type,
      options: (qu.options ?? []).map((o) => ({
        id: String(o.id),
        label: o.option_text ?? o.label ?? "",
      })),
    })),
  };
  const attempts = (data?.attempts ?? []).map((a) => ({
    score: a.score,
    submittedAt: a.submitted_at ?? a.submittedAt,
  }));
  return { quiz, attempts };
}

export function QuizPage() {
  const { courseId } = useParams();
  const { getToken } = useLms();
  const [quiz, setQuiz] = useState(null);
  const [attemptHistory, setAttemptHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [passed, setPassed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const token = getToken();
    if (!courseId || !token) {
      throw new Error("Sign in required");
    }
    const data = await quizApi.get(courseId, { token });
    const { quiz: q, attempts } = mapQuizPayload(data);
    setQuiz(q);
    setAttemptHistory(attempts);
  }, [courseId, getToken]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        await load();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load quiz");
          setQuiz(null);
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
    setAnswers({});
    setResult(null);
    setPassed(false);
    setTimeLeft((quiz?.timeLimitMin || 30) * 60);
  }, [quiz?.id, quiz?.timeLimitMin]);

  useEffect(() => {
    if (!quiz || result !== null || timeLeft <= 0) return undefined;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, result, timeLeft]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm ring-1 ring-gray-100">
        Loading…
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
        <p className="text-damiun-body">{error || "Quiz topilmadi."}</p>
      </div>
    );
  }

  if (!quiz.questions.length) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
        <h2 className="text-xl font-bold text-damiun-wordmark">{quiz.title}</h2>
        <p className="mt-2 text-sm text-damiun-muted">Bu kurs uchun quiz savollari hali qo&apos;shilmagan.</p>
      </div>
    );
  }

  const onSubmit = async (event) => {
    event.preventDefault();
    if (timeLeft <= 0 || result !== null) return;
    const token = getToken();
    if (!token) return;

    const missing = quiz.questions.some((q) => !answers[q.id]);
    if (missing) {
      toast.error("Barcha savollarga javob bering");
      return;
    }

    const answersPayload = quiz.questions.map((q) => ({
      question_id: q.id,
      selected_option_ids: [answers[q.id]],
    }));

    setSubmitting(true);
    try {
      const spent = (quiz.timeLimitMin || 30) * 60 - timeLeft;
      const res = await quizApi.submitAttempt(
        {
          courses_id: courseId,
          quiz_id: quiz.id,
          answers: answersPayload,
          time_spent_sec: Math.max(0, spent),
        },
        { token },
      );
      setResult(res.score ?? 0);
      setPassed(Boolean(res.passed));
      setAttemptHistory((prev) => [
        { score: res.score, submittedAt: new Date().toISOString() },
        ...prev,
      ]);
      toast.success(res.passed ? "Tabriklaymiz!" : "Natija saqlandi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Yuborishda xato");
    } finally {
      setSubmitting(false);
    }
  };

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const passedUi = result !== null && (passed || result >= quiz.passThreshold);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-10">
      <div className="flex flex-col gap-2 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-damiun-wordmark">{quiz.title}</h1>
          <p className="mt-1 text-sm text-damiun-muted">
            Pass threshold:{" "}
            <span className="font-semibold text-damiun-primary">{quiz.passThreshold}%</span>
            {quiz.maxAttempts != null && (
              <>
                {" "}
                · Max attempts: <span className="font-semibold text-damiun-wordmark">{quiz.maxAttempts}</span>
              </>
            )}
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-bold sm:self-auto ${
            timeLeft < 120 ? "bg-red-50 text-red-700 ring-1 ring-red-100" : "bg-damiun-nav-tint text-damiun-primary"
          }`}
        >
          <span className="tabular-nums">
            {mm}:{ss}
          </span>
        </div>
      </div>

      {attemptHistory.length > 0 && (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
          <h2 className="text-sm font-bold uppercase tracking-wide text-damiun-muted">Your attempts</h2>
          <ul className="mt-3 divide-y divide-gray-100">
            {attemptHistory.map((a, i) => (
              <li key={`${a.submittedAt}-${i}`} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                <span className="font-semibold text-damiun-wordmark">{a.score}%</span>
                <span className="text-damiun-muted">{formatDate(a.submittedAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        {quiz.questions.map((question, index) => (
          <article
            key={question.id}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <h2 className="text-base font-semibold text-damiun-wordmark">
              {index + 1}. {question.prompt}
            </h2>
            <div className="mt-4 flex flex-col gap-2">
              {question.options.map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 px-3 py-2.5 text-sm transition hover:border-damiun-primary/40 hover:bg-damiun-nav-tint/50"
                >
                  <input
                    type="radio"
                    name={question.id}
                    className="mt-1 text-damiun-primary focus:ring-damiun-primary"
                    checked={answers[question.id] === option.id}
                    onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option.id }))}
                  />
                  <span className="text-damiun-body">{option.label}</span>
                </label>
              ))}
            </div>
          </article>
        ))}

        <button
          className="rounded-full bg-damiun-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-damiun-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          type="submit"
          disabled={result !== null || timeLeft <= 0 || submitting}
        >
          {submitting ? "Submitting…" : "Submit quiz"}
        </button>
      </form>

      {timeLeft <= 0 && result === null ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
          Vaqt tugadi. Attemptni saqlash uchun quizni qayta boshlang.
        </p>
      ) : null}

      {result !== null ? (
        <div
          className={`rounded-2xl border-2 p-8 text-center ${
            passedUi
              ? "border-emerald-300 bg-emerald-50/90 text-emerald-950"
              : "border-amber-300 bg-amber-50/90 text-amber-950"
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-widest opacity-80">Quiz result</p>
          <p className="mt-3 text-5xl font-black tabular-nums">{result}%</p>
          <p className="mt-2 text-lg font-bold">{passedUi ? "Passed" : "Not passed"}</p>
          <p className="mt-2 text-sm opacity-90">
            Pass threshold: {quiz.passThreshold}% · {passedUi ? "Great work." : "Review lessons and try again."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
