import { Link } from "react-router-dom";
import { CourseCard } from "../components/ui/CourseCard";
import { StatCard } from "../components/ui/StatCard";
import { useLms } from "../data/LmsContext";

export function HomePage() {
  const {
    featuredCourses,
    categories,
    instructors,
    financeSummary,
    role,
    myEnrollments,
    enrollmentByCourseId,
  } = useLms();

  return (
    <section className="stack">
      <div className="hero hero-strong">
        <div>
          <p className="eyebrow">LMS Platform</p>
          <h1>Coursera/Udemy uslubidagi modern learning experience</h1>
          <p>
            Student uchun learning flow, Instructor uchun course management, Admin uchun
            alohida boshqaruv paneli tayyor.
          </p>
          <div className="hero-actions">
            <Link to="/catalog" className="btn btn-primary">
              Explore Courses
            </Link>
            {role === "student" ? (
              <Link to="/student" className="btn btn-secondary">
                My Learning
              </Link>
            ) : null}
            {role === "instructor" ? (
              <Link to="/instructor" className="btn btn-secondary">
                Instructor Workspace
              </Link>
            ) : null}
            {role === "superadmin" ? (
              <Link to="/admin" className="btn btn-secondary">
                Open Admin Panel
              </Link>
            ) : null}
          </div>
        </div>

        <div className="hero-grid">
          <StatCard label="Featured Courses" value={featuredCourses.length} />
          <StatCard label="My Enrollments" value={myEnrollments.length} />
          <StatCard
            label="Platform Net"
            value={`${new Intl.NumberFormat("uz-UZ").format(financeSummary.net)} so'm`}
          />
        </div>
      </div>

      <article className="panel">
        <h2>Top Instructors</h2>
        <div className="cards-grid cards-grid-compact">
          {instructors.map((person) => (
            <div key={person.id} className="panel">
              <div className="instructor-card">
                <img src={person.avatar} alt={person.fullName} className="avatar" />
                <div>
                  <strong>{person.fullName}</strong>
                  <p>{person.bio}</p>
                  <p>Rating: {person.rating || "-"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="panel">
        <div className="row-between">
          <h2>Featured Courses</h2>
          <Link to="/catalog" className="link-btn">
            View all
          </Link>
        </div>
        <div className="cards-grid">
          {featuredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isEnrolled={Boolean(enrollmentByCourseId[course.id])}
            />
          ))}
        </div>
      </article>

      <article className="panel">
        <h2>Categories</h2>
        <div className="inline-wrap">
          {categories.map((category) => (
            <span key={category} className="badge badge-accent">
              {category}
            </span>
          ))}
        </div>
      </article>
    </section>
  );
}
