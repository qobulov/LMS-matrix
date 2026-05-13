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
      { label: "Courses", value: myCoursesCount, helper: "Created" },
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
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-damiun-wordmark">Profile settings</h1>
        <p className="mt-1 text-sm text-damiun-muted">Account details, bio and avatar (README).</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <article className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-50 sm:p-8">
          <div className="h-24 rounded-xl bg-gradient-to-r from-damiun-primary/90 to-damiun-hero-deep/80" />
          <div className="-mt-10 flex flex-col items-center px-2 pb-2 text-center">
            <AvatarUploader onUpload={handleUpload}>
              <Avatar className="h-24 w-24 cursor-pointer border-4 border-white shadow-md ring-2 ring-gray-100 transition hover:opacity-90">
                <AvatarImage src={form.avatar} alt={form.fullName} />
                <AvatarFallback className="bg-damiun-nav-tint text-2xl font-bold text-damiun-primary">
                  {form.fullName?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </AvatarUploader>
            <p className="mt-2 text-xs text-damiun-muted">Tap avatar to upload</p>
            <h2 className="mt-4 text-xl font-bold text-damiun-wordmark">{form.fullName || currentUser.fullName}</h2>
            <p className="text-sm text-damiun-muted">{currentUser.email}</p>
            <span className="mt-2 rounded-full bg-damiun-nav-tint px-3 py-1 text-xs font-bold capitalize text-damiun-primary">
              {currentUser.role}
            </span>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-damiun-body">
              {form.bio?.trim() || "Add a short bio so students and teammates know you better."}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {profileStats.map((item) => (
              <div key={item.label} className="rounded-xl border border-gray-100 bg-damiun-surface-app/80 p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wide text-damiun-muted">{item.label}</p>
                <p className="mt-1 text-lg font-bold text-damiun-wordmark">{item.value}</p>
                <p className="text-[10px] text-damiun-muted">{item.helper}</p>
              </div>
            ))}
          </div>
        </article>

        <form
          className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-50 sm:p-8"
          onSubmit={onSubmit}
        >
          <h2 className="text-lg font-bold text-damiun-wordmark">Edit profile</h2>

          <label className="block text-sm font-medium text-damiun-wordmark">
            Full name
            <input
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-damiun-primary focus:bg-white focus:ring-2 focus:ring-damiun-primary/20"
            />
          </label>
          <p className="text-xs text-damiun-muted">Shown in navigation and certificates.</p>

          <label className="block text-sm font-medium text-damiun-wordmark">
            Bio
            <textarea
              rows={5}
              value={form.bio}
              onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-damiun-primary focus:bg-white focus:ring-2 focus:ring-damiun-primary/20"
              maxLength={240}
            />
          </label>
          <p className="text-xs text-damiun-muted">{form.bio.length}/240 characters</p>

          <label className="block text-sm font-medium text-damiun-wordmark">
            Avatar URL
            <input
              value={form.avatar}
              onChange={(event) => setForm((prev) => ({ ...prev, avatar: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-damiun-primary focus:bg-white focus:ring-2 focus:ring-damiun-primary/20"
            />
          </label>
          <p className="text-xs text-damiun-muted">Paste an image URL or upload from the left card.</p>

          <div className="mt-2 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-damiun-wordmark shadow-sm transition hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              type="submit"
              className="rounded-full bg-damiun-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-damiun-primary-hover"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
