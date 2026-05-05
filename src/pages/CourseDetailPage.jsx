import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { MagneticButton } from "../components/ui/magnetic-button";
import { useLms } from "../data/LmsContext";
import { formatDate, formatPrice } from "../utils/format";

export function CourseDetailPage() {
  const { courseId } = useParams();
  const {
    courses,
    instructors,
    enrollmentByCourseId,
    enrollToCourse,
    addCourseReview,
    role,
  } = useLms();

  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);

  const course = useMemo(
    () => courses.find((item) => item.id === courseId),
    [courses, courseId],
  );

  if (!course) {
    return <p>Course topilmadi.</p>;
  }

  const instructor = instructors.find((person) => person.id === course.instructorId);
  const enrollment = enrollmentByCourseId[course.id];
  const isEnrolled = Boolean(enrollment);
  const canReview = role === "student" && enrollment?.status === "completed";

  const firstLessonId = course.modules[0]?.lessons[0]?.id;

  const onReviewSubmit = (event) => {
    event.preventDefault();
    if (!reviewText.trim()) return;

    addCourseReview({
      courseId: course.id,
      rating: Number(reviewRating),
      text: reviewText,
    });

    setReviewText("");
    setReviewRating(5);
  };

  return (
    <section className="course-detail">
      <img src={course.coverImage} alt={course.title} className="cover-wide" />

      <div className="course-meta-grid">
        <div>
          <h2>{course.title}</h2>
          <div className="inline-wrap">
            <Badge tone="accent">{course.category}</Badge>
            <Badge>{course.difficulty}</Badge>
            <Badge>{course.language}</Badge>
          </div>
          <p>{course.description}</p>

          <div className="detail-section">
            <h3>What You'll Learn</h3>
            <ul>
              {course.whatYouWillLearn.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="detail-section">
            <h3>Requirements</h3>
            <ul>
              {course.requirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="detail-section">
            <h3>Syllabus</h3>
            {course.modules.map((module) => (
              <article key={module.id} className="module-box">
                <h4>{module.title}</h4>
                <ul>
                  {module.lessons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link to={`/learn/${course.id}/${lesson.id}`}>{lesson.title}</Link>
                      {` (${lesson.durationMin} min)`}
                      {lesson.isPreview ? " - Preview" : ""}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="detail-section stack">
            <h3>Reviews</h3>
            {course.reviews.length === 0 ? <p>Hali review yo'q.</p> : null}
            {course.reviews.map((review) => (
              <article key={review.id} className="review-box">
                <div className="row-between">
                  <strong>{review.author}</strong>
                  <span>{formatDate(review.date)}</span>
                </div>
                <p>{review.rating} / 5</p>
                <p>{review.text}</p>
              </article>
            ))}

            {canReview ? (
              <form className="panel stack" onSubmit={onReviewSubmit}>
                <h4>Leave a review</h4>
                <label>
                  Rating
                  <select
                    value={reviewRating}
                    onChange={(event) => setReviewRating(event.target.value)}
                  >
                    {[5, 4, 3, 2, 1].map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Comment
                  <textarea
                    rows={3}
                    value={reviewText}
                    onChange={(event) => setReviewText(event.target.value)}
                  />
                </label>
                <button className="btn btn-primary" type="submit">
                  Submit Review
                </button>
              </form>
            ) : null}
          </div>
        </div>

        <aside className="sticky-card">
          <p className="price-big">{formatPrice(course.price)}</p>
          <p>{course.durationHours} soat total duration</p>
          <p>{course.studentCount} students</p>
          <p>
            {course.rating} / 5 ({course.reviewCount} reviews)
          </p>

          {instructor ? (
            <div className="instructor-card">
              <img src={instructor.avatar} alt={instructor.fullName} className="avatar" />
              <div>
                <strong>{instructor.fullName}</strong>
                <p>{instructor.bio}</p>
              </div>
            </div>
          ) : null}

          {isEnrolled ? (
            <>
              <Link to="/student" className="btn btn-primary full">
                Continue Learning
              </Link>
              {firstLessonId ? (
                <Link to={`/learn/${course.id}/${firstLessonId}`} className="btn btn-secondary full">
                  Open First Lesson
                </Link>
              ) : null}
            </>
          ) : (
            <MagneticButton distance={0.25}>
              <button className="btn btn-primary full" onClick={() => enrollToCourse(course.id)}>
                Enroll Now
              </button>
            </MagneticButton>
          )}
        </aside>
      </div>
    </section>
  );
}
