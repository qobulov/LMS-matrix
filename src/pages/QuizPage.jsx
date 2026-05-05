/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useLms } from "../data/LmsContext";

export function QuizPage() {
  const { courseId } = useParams();
  const { courses, submitQuiz } = useLms();
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const course = useMemo(
    () => courses.find((item) => item.id === courseId),
    [courses, courseId],
  );

  const quiz = course?.finalQuiz || null;

  useEffect(() => {
    setAnswers({});
    setResult(null);
    setTimeLeft((quiz?.timeLimitMin || 30) * 60);
  }, [quiz?.id, quiz?.timeLimitMin]);

  useEffect(() => {
    if (!quiz || result !== null || timeLeft <= 0) return undefined;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, result, timeLeft]);

  if (!course || !quiz) return <p>Course topilmadi.</p>;

  if (!quiz.questions.length) {
    return (
      <section>
        <h2>{quiz.title}</h2>
        <p>Bu kurs uchun quiz savollari hali qo'shilmagan.</p>
      </section>
    );
  }

  const evaluateResult = () => {
    let correctCount = 0;

    quiz.questions.forEach((question) => {
      const answer = Number(answers[question.id]);
      if (question.correctOptionIndexes.includes(answer)) {
        correctCount += 1;
      }
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    submitQuiz(course.id, score);
    setResult(score);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (timeLeft <= 0) return;
    evaluateResult();
  };

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  return (
    <section>
      <div className="row-between">
        <h2>{quiz.title}</h2>
        <span className="badge">Timer: {mm}:{ss}</span>
      </div>
      <p>Pass threshold: {quiz.passThreshold}%</p>

      <form onSubmit={onSubmit} className="stack">
        {quiz.questions.map((question, index) => (
          <article key={question.id} className="panel">
            <h4>
              {index + 1}. {question.prompt}
            </h4>
            {question.options.map((option, optionIndex) => (
              <label key={option} className="option-label">
                <input
                  type="radio"
                  name={question.id}
                  checked={Number(answers[question.id]) === optionIndex}
                  onChange={() =>
                    setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))
                  }
                />
                {option}
              </label>
            ))}
          </article>
        ))}

        <button className="btn btn-primary" type="submit" disabled={result !== null || timeLeft <= 0}>
          Submit Quiz
        </button>
      </form>

      {timeLeft <= 0 && result === null ? (
        <p className="error-text">Vaqt tugadi. Attemptni saqlash uchun quizni qayta boshlang.</p>
      ) : null}

      {result !== null ? (
        <p>
          Natija: {result}% {result >= quiz.passThreshold ? "- Passed" : "- Try again"}
        </p>
      ) : null}
    </section>
  );
}
