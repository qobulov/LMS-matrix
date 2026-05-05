import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { StatCard } from "../components/ui/StatCard";
import { useLms } from "../data/LmsContext";

export function InstructorDashboardPage() {
  const { currentUser, courses, enrollments, addModuleToCourse, addLessonToModule } = useLms();

  const [moduleTitle, setModuleTitle] = useState("");
  const [targetCourseId, setTargetCourseId] = useState("");

  const [lessonForm, setLessonForm] = useState({
    courseId: "",
    moduleId: "",
    title: "",
    type: "video",
    durationMin: 15,
    isPreview: false,
    content: "",
    resourceUrl: "",
  });

  const myCourses = useMemo(
    () => courses.filter((course) => course.instructorId === currentUser?.id),
    [courses, currentUser],
  );

  const myStudentCount = useMemo(
    () =>
      myCourses.reduce(
        (sum, course) =>
          sum + enrollments.filter((item) => item.courseId === course.id).length,
        0,
      ),
    [myCourses, enrollments],
  );

  const createModule = (event) => {
    event.preventDefault();
    if (!targetCourseId || !moduleTitle.trim()) return;
    addModuleToCourse(targetCourseId, moduleTitle.trim());
    setModuleTitle("");
  };

  const createLesson = (event) => {
    event.preventDefault();
    if (!lessonForm.courseId || !lessonForm.moduleId || !lessonForm.title.trim()) return;
    addLessonToModule(lessonForm.courseId, lessonForm.moduleId, lessonForm);
    setLessonForm({
      courseId: "",
      moduleId: "",
      title: "",
      type: "video",
      durationMin: 15,
      isPreview: false,
      content: "",
      resourceUrl: "",
    });
  };

  const selectedCourse = myCourses.find((course) => course.id === lessonForm.courseId);

  return (
    <section className="stack">
      <div className="row-between">
        <h2>Instructor Dashboard</h2>
        <Link to="/instructor/create-course" className="btn btn-primary">
          Create New Course
        </Link>
      </div>

      <div className="stats-grid">
        <StatCard label="My Courses" value={myCourses.length} />
        <StatCard label="Total Students" value={myStudentCount} />
        <StatCard
          label="Published"
          value={myCourses.filter((course) => course.status === "published").length}
        />
      </div>

      <article className="panel">
        <h3>Add Module</h3>
        <form className="form-grid" onSubmit={createModule}>
          <label>
            Course
            <select
              value={targetCourseId}
              onChange={(event) => setTargetCourseId(event.target.value)}
            >
              <option value="">Select</option>
              {myCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Module Title
            <input
              value={moduleTitle}
              onChange={(event) => setModuleTitle(event.target.value)}
            />
          </label>
          <button className="btn btn-secondary" type="submit">
            Add Module
          </button>
        </form>
      </article>

      <article className="panel">
        <h3>Add Lesson</h3>
        <form className="form-grid" onSubmit={createLesson}>
          <label>
            Course
            <select
              value={lessonForm.courseId}
              onChange={(event) =>
                setLessonForm((prev) => ({
                  ...prev,
                  courseId: event.target.value,
                  moduleId: "",
                }))
              }
            >
              <option value="">Select</option>
              {myCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            Module
            <select
              value={lessonForm.moduleId}
              onChange={(event) =>
                setLessonForm((prev) => ({ ...prev, moduleId: event.target.value }))
              }
            >
              <option value="">Select</option>
              {(selectedCourse?.modules || []).map((module) => (
                <option key={module.id} value={module.id}>
                  {module.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            Lesson Title
            <input
              value={lessonForm.title}
              onChange={(event) =>
                setLessonForm((prev) => ({ ...prev, title: event.target.value }))
              }
            />
          </label>

          <label>
            Type
            <select
              value={lessonForm.type}
              onChange={(event) =>
                setLessonForm((prev) => ({ ...prev, type: event.target.value }))
              }
            >
              <option value="video">video</option>
              <option value="text">text</option>
              <option value="file">file</option>
            </select>
          </label>

          <label>
            Duration (min)
            <input
              type="number"
              min="1"
              value={lessonForm.durationMin}
              onChange={(event) =>
                setLessonForm((prev) => ({ ...prev, durationMin: event.target.value }))
              }
            />
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={lessonForm.isPreview}
              onChange={(event) =>
                setLessonForm((prev) => ({ ...prev, isPreview: event.target.checked }))
              }
            />
            Preview lesson
          </label>

          <label className="full-row">
            Content
            <textarea
              rows={3}
              value={lessonForm.content}
              onChange={(event) =>
                setLessonForm((prev) => ({ ...prev, content: event.target.value }))
              }
            />
          </label>

          <label className="full-row">
            Resource URL
            <input
              value={lessonForm.resourceUrl}
              onChange={(event) =>
                setLessonForm((prev) => ({ ...prev, resourceUrl: event.target.value }))
              }
            />
          </label>

          <button className="btn btn-secondary" type="submit">
            Add Lesson
          </button>
        </form>
      </article>

      <article className="panel">
        <h3>My Courses</h3>
        <div className="stack">
          {myCourses.map((course) => (
            <article key={course.id} className="panel">
              <div className="row-between">
                <h4>{course.title}</h4>
                <span>{course.status}</span>
              </div>
              <p>{course.description}</p>
              <p>
                Modules: {course.modules.length} | Students: {" "}
                {enrollments.filter((item) => item.courseId === course.id).length}
              </p>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
