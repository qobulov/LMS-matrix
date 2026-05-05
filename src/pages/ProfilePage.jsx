import { useState } from "react";
import { AvatarUploader } from "../components/ui/avatar-uploader";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { useLms } from "../data/LmsContext";

export function ProfilePage() {
  const {
    currentUser,
    updateProfile,
    role,
    courses,
    myEnrollments,
    enrollments,
    students,
    instructors,
  } = useLms();
  const [form, setForm] = useState({
    fullName: currentUser?.fullName || "",
    bio: currentUser?.bio || "",
    avatar: currentUser?.avatar || "",
  });

  const onSubmit = (event) => {
    event.preventDefault();
    updateProfile(form);
  };

  const handleUpload = async (file) => {
    const nextUrl = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, avatar: nextUrl }));
    return { success: true };
  };

  const resetForm = () => {
    setForm({
      fullName: currentUser?.fullName || "",
      bio: currentUser?.bio || "",
      avatar: currentUser?.avatar || "",
    });
  };

  const completedCount = myEnrollments.filter((item) => item.status === "completed").length;
  const activeCount = myEnrollments.filter((item) => item.status === "active").length;
  const myCoursesCount = courses.filter((course) => course.instructorId === currentUser?.id).length;
  const myStudentsCount = enrollments.filter((item) =>
    courses.some(
      (course) => course.id === item.courseId && course.instructorId === currentUser?.id,
    ),
  ).length;

  const statsByRole = {
    student: [
      { label: "Enrolled", value: myEnrollments.length, helper: "My courses" },
      { label: "Active", value: activeCount, helper: "In progress" },
      { label: "Completed", value: completedCount, helper: "Finished" },
    ],
    instructor: [
      { label: "Courses", value: myCoursesCount, helper: "Published" },
      { label: "Students", value: myStudentsCount, helper: "Total reach" },
      {
        label: "Completion",
        value: `${Math.max(
          0,
          Math.round(
            (myStudentsCount
              ? enrollments.filter(
                  (item) =>
                    item.status === "completed" &&
                    courses.some(
                      (course) =>
                        course.id === item.courseId && course.instructorId === currentUser?.id,
                    ),
                ).length / myStudentsCount
              : 0) * 100,
          ),
        )}%`,
        helper: "Avg. outcome",
      },
    ],
    superadmin: [
      { label: "Users", value: students.length + instructors.length + 1, helper: "Platform" },
      { label: "Students", value: students.length, helper: "Learners" },
      { label: "Instructors", value: instructors.length, helper: "Creators" },
    ],
  };

  const profileStats = statsByRole[role] || statsByRole.student;

  if (!currentUser) return null;

  return (
    <section className="stack">
      <div className="row-between">
        <div>
          <h2>Profile Settings</h2>
          <p className="muted">Account details, bio and avatar management</p>
        </div>
      </div>
      <div className="profile-grid profile-grid-enhanced">
        <article className="panel profile-overview">
          <div className="profile-cover" />
          <AvatarUploader onUpload={handleUpload}>
            <Avatar className="profile-avatar-large profile-avatar-elevated cursor-pointer transition-opacity hover:opacity-80">
              <AvatarImage src={form.avatar} alt={form.fullName} />
              <AvatarFallback className="border text-2xl font-bold">
                {form.fullName?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </AvatarUploader>
          <p className="small-text">Tap avatar to upload or crop image</p>

          <div className="stack" style={{ gap: "0.35rem" }}>
            <h3>{form.fullName || currentUser.fullName}</h3>
            <p>{currentUser.email}</p>
            <div className="inline-wrap">
              <span className="badge badge-accent">Role: {currentUser.role}</span>
            </div>
          </div>

          <p className="profile-bio-preview">
            {form.bio?.trim() || "Add a short bio so students and teammates know you better."}
          </p>

          <div className="stats-grid profile-stats-grid">
            {profileStats.map((item) => (
              <div key={item.label} className="stat-card">
                <p className="stat-label">{item.label}</p>
                <h3 className="stat-value">{item.value}</h3>
                <p className="stat-helper">{item.helper}</p>
              </div>
            ))}
          </div>
        </article>

        <form className="panel stack profile-form-panel" onSubmit={onSubmit}>
          <label>
            Full Name
            <input
              value={form.fullName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, fullName: event.target.value }))
              }
            />
          </label>
          <p className="small-text">This name is shown in nav and certificates</p>

          <label>
            Bio
            <textarea
              rows={5}
              value={form.bio}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, bio: event.target.value }))
              }
            />
          </label>
          <p className="small-text">{form.bio.length}/240 characters</p>

          <label>
            Avatar URL
            <input
              value={form.avatar}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, avatar: event.target.value }))
              }
            />
          </label>
          <p className="small-text">You can paste image URL or upload avatar from left card</p>

          <div className="row-between profile-form-actions">
            <button className="btn btn-secondary" type="button" onClick={resetForm}>
              Reset
            </button>
            <button className="btn btn-primary" type="submit">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
