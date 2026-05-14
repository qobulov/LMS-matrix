import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BookOpen,
  Briefcase,
  Gift,
  LayoutDashboard,
  Mail,
  PenSquare,
  Settings2,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { AvatarUploader } from "../components/ui/avatar-uploader";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { fileApi, profileApi } from "../api/endpoints";
import { APP_NAME } from "../constants/branding";
import { useLms } from "../data/LmsContext";

const inputClass =
  "mt-2 w-full rounded-xl border border-gray-200/90 bg-white px-4 py-3 text-sm text-damiun-wordmark shadow-sm outline-none transition placeholder:text-gray-400 focus:border-damiun-primary focus:ring-2 focus:ring-damiun-primary/15";

function ProfileStat({ label, value, helper }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_14px_rgba(26,34,53,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-damiun-primary/25 hover:shadow-[0_12px_28px_rgba(0,153,216,0.1)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-damiun-primary via-sky-400 to-damiun-primary/40 opacity-60 transition group-hover:opacity-100" />
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-damiun-wordmark">{value}</p>
      {helper ? <p className="mt-1.5 text-xs font-medium leading-snug text-damiun-muted">{helper}</p> : null}
    </div>
  );
}

const experienceCopy = {
  student: "Building practical skills through courses, quizzes, and certificates on the platform.",
  instructor: "Creating courses, structuring lessons, and supporting learners day to day.",
  superadmin: `Overseeing users, content quality, and platform health on ${APP_NAME}.`,
};

export function ProfilePage() {
  const { currentUser, updateProfile, role, getToken } = useLms();
  const [tab, setTab] = useState("overview");
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [apiStats, setApiStats] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState({
    fullName: currentUser?.fullName || "",
    bio: currentUser?.bio || "",
    avatar: currentUser?.avatar || "",
  });
  const [form, setForm] = useState({
    fullName: currentUser?.fullName || "",
    bio: currentUser?.bio || "",
    avatar: currentUser?.avatar || "",
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = getToken();
      if (!token) {
        setProfileLoading(false);
        return;
      }
      setProfileLoading(true);
      try {
        const data = await profileApi.me({ token });
        if (cancelled) return;
        const snap = {
          fullName: String(data.full_name ?? "").trim(),
          bio: String(data.bio ?? ""),
          avatar: String(data.avatar_url ?? ""),
        };
        setForm(snap);
        setSavedSnapshot(snap);
        setApiStats(data.stats && typeof data.stats === "object" ? data.stats : null);
      } catch {
        if (!cancelled && currentUser) {
          const snap = {
            fullName: currentUser.fullName || "",
            bio: currentUser.bio || "",
            avatar: currentUser.avatar || "",
          };
          setForm(snap);
          setSavedSnapshot(snap);
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken, currentUser?.id]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      setSavedSnapshot({ ...form });
      const token = getToken();
      if (token) {
        try {
          const data = await profileApi.me({ token });
          setApiStats(data.stats && typeof data.stats === "object" ? data.stats : null);
        } catch {
          // ignore
        }
      }
      toast.success("Profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file) => {
    const token = getToken();
    if (!token) {
      toast.error("Not signed in");
      throw new Error("Not signed in");
    }
    try {
      const cdnUrl = await fileApi.upload(file, { token });
      let nextForm;
      setForm((prev) => {
        nextForm = { ...prev, avatar: cdnUrl };
        return nextForm;
      });
      await updateProfile({
        fullName: nextForm.fullName,
        bio: nextForm.bio,
        avatar: cdnUrl,
      });
      setSavedSnapshot({ ...nextForm, avatar: cdnUrl });
      toast.success("Avatar updated");
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast.error(message);
      throw err instanceof Error ? err : new Error(message);
    }
  };

  const resetForm = () => {
    setForm({ ...savedSnapshot });
    toast.message("Form reset to saved profile");
  };

  const statsSource = apiStats ?? currentUser?.stats ?? {};

  const certCount = Number(statsSource.certificates ?? statsSource.certificates_count ?? 0);

  const profileStats = useMemo(() => {
    const s = statsSource;
    if (role === "student") {
      return [
        { label: "Enrolled", value: s.enrolled ?? 0, helper: "Courses you are taking" },
        { label: "Active", value: s.active ?? 0, helper: "Currently in progress" },
        { label: "Completed", value: s.completed ?? 0, helper: "Finished journeys" },
      ];
    }
    if (role === "instructor") {
      const courseCount = s.courses ?? s.course_count ?? 0;
      const studentCount = s.students ?? s.total_students ?? 0;
      const completion = s.completion_rate ?? 0;
      return [
        { label: "Courses", value: courseCount, helper: "Created under your account" },
        { label: "Students", value: studentCount, helper: "Learners across your courses" },
        {
          label: "Completion",
          value: `${Math.max(0, Math.round(Number(completion) || 0))}%`,
          helper: "Average learner completion",
        },
      ];
    }
    if (role === "superadmin") {
      return [
        { label: "Users", value: s.total_users ?? 0, helper: "Registered accounts" },
        { label: "Students", value: s.students ?? s.students_count ?? 0, helper: "Learner role" },
        {
          label: "Instructors",
          value: s.instructors ?? s.instructors_count ?? 0,
          helper: "Content creators",
        },
      ];
    }
    return [
      { label: "Enrolled", value: 0, helper: "Courses you are taking" },
      { label: "Active", value: 0, helper: "Currently in progress" },
      { label: "Completed", value: 0, helper: "Finished journeys" },
    ];
  }, [role, statsSource]);
  const experienceText = experienceCopy[role] || experienceCopy.student;

  if (!currentUser) return null;

  if (profileLoading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 pb-4">
        <p className="py-16 text-center text-sm text-damiun-muted">Loading profile…</p>
      </div>
    );
  }

  const initials =
    currentUser.fullName
      ?.split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const shortcutBtn =
    "inline-flex items-center gap-2 rounded-full border border-gray-200/90 bg-white px-4 py-2.5 text-sm font-semibold text-damiun-wordmark shadow-sm transition hover:border-damiun-primary/35 hover:bg-damiun-nav-tint/80 hover:text-damiun-primary";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 pb-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-damiun-wordmark">Profile</h1>
        <p className="max-w-xl text-sm leading-relaxed text-damiun-muted">
          Your public presence, activity snapshot, and account details in one calm layout.
        </p>
      </header>

      <div className="inline-flex w-fit rounded-full bg-gray-100/90 p-1 ring-1 ring-gray-200/70">
        <button
          type="button"
          onClick={() => setTab("overview")}
          className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
            tab === "overview"
              ? "bg-white text-damiun-primary shadow-sm ring-1 ring-gray-200/80"
              : "text-gray-500 hover:text-damiun-wordmark"
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setTab("settings")}
          className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition ${
            tab === "settings"
              ? "bg-white text-damiun-primary shadow-sm ring-1 ring-gray-200/80"
              : "text-gray-500 hover:text-damiun-wordmark"
          }`}
        >
          <PenSquare className="h-4 w-4" aria-hidden />
          Account
        </button>
      </div>

      {tab === "overview" ? (
        <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-[0_8px_40px_rgba(26,34,53,0.08)] ring-1 ring-gray-100/90">
          <div className="relative h-44 overflow-hidden sm:h-52">
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(115deg, #01A0E7 0%, #0099d8 38%, #0d3d5c 72%, #121212 100%)",
              }}
            />
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 left-1/4 h-40 w-40 rounded-full bg-sky-300/20 blur-3xl" />
          </div>

          <div className="relative space-y-8 px-6 pb-10 pt-0 sm:px-10">
            <div className="-mt-[4.5rem] flex flex-col items-center gap-6 sm:-mt-20 sm:flex-row sm:items-end sm:gap-8">
              <div className="relative shrink-0">
                <AvatarUploader onUpload={handleUpload}>
                  <Avatar className="h-[7.5rem] w-[7.5rem] cursor-pointer border-[5px] border-white shadow-[0_12px_40px_rgba(0,0,0,0.18)] ring-1 ring-gray-200/80 transition hover:ring-2 hover:ring-damiun-primary/40 sm:h-32 sm:w-32">
                    <AvatarImage src={form.avatar} alt="" className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-damiun-nav-tint to-sky-100 text-3xl font-bold text-damiun-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </AvatarUploader>
                <p className="mt-3 text-center text-[11px] text-damiun-muted/90 sm:text-left">Click photo to update</p>
              </div>

              <div className="min-w-0 flex-1 pb-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold tracking-tight text-damiun-wordmark sm:text-3xl">
                  {form.fullName || currentUser.fullName}
                </h2>
                <p className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-gray-50 px-3 py-1.5 text-sm text-damiun-body ring-1 ring-gray-100 sm:justify-start">
                  <Mail className="h-4 w-4 shrink-0 text-damiun-primary" aria-hidden />
                  <span className="truncate">{currentUser.email}</span>
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <span className="rounded-full bg-damiun-nav-tint px-4 py-1.5 text-xs font-bold capitalize tracking-wide text-damiun-primary ring-1 ring-damiun-primary/20">
                    {currentUser.role}
                  </span>
                  {role === "student" && certCount > 0 && (
                    <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-100/80">
                      {certCount} certificate{certCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {profileStats.map((item) => (
                <ProfileStat key={item.label} label={item.label} value={item.value} helper={item.helper} />
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-gray-100 bg-gradient-to-b from-gray-50/80 to-white p-6 shadow-inner">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-damiun-muted">
                  <User className="h-4 w-4 text-damiun-primary" aria-hidden />
                  About
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-damiun-body">
                  {form.bio?.trim() ||
                    "Add a short bio from the Account tab. It helps teammates and learners understand who you are."}
                </p>
              </section>

              <section className="rounded-2xl border border-gray-100 bg-gradient-to-b from-gray-50/80 to-white p-6 shadow-inner">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-damiun-muted">
                  <Briefcase className="h-4 w-4 text-damiun-primary" aria-hidden />
                  Experience
                </h3>
                <p className="mt-4 flex gap-3 text-sm leading-relaxed text-damiun-body">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                  {experienceText}
                </p>
              </section>
            </div>

            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-damiun-muted">Shortcuts</h3>
              <div className="mt-4 flex flex-wrap gap-3">
                {role === "student" && (
                  <>
                    <Link to="/catalog" className={shortcutBtn}>
                      <BookOpen className="h-4 w-4 text-damiun-primary" />
                      Catalog
                    </Link>
                    <Link to="/student" className={shortcutBtn}>
                      <LayoutDashboard className="h-4 w-4 text-damiun-primary" />
                      My learning
                    </Link>
                    <Link to="/certificates" className={shortcutBtn}>
                      <Award className="h-4 w-4 text-damiun-primary" />
                      Certificates
                    </Link>
                    <Link to="/rewards" className={shortcutBtn}>
                      <Gift className="h-4 w-4 text-damiun-primary" />
                      Rewards
                    </Link>
                  </>
                )}
                {role === "instructor" && (
                  <>
                    <Link to="/instructor" className={shortcutBtn}>
                      <LayoutDashboard className="h-4 w-4 text-damiun-primary" />
                      Dashboard
                    </Link>
                    <Link
                      to="/instructor/create-course"
                      className="inline-flex items-center gap-2 rounded-full bg-damiun-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-damiun-primary-hover"
                    >
                      New course
                    </Link>
                  </>
                )}
                {role === "superadmin" && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-2 rounded-full bg-damiun-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-damiun-primary-hover"
                  >
                    <Settings2 className="h-4 w-4" aria-hidden />
                    Admin panel
                  </Link>
                )}
              </div>
            </section>

            <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl bg-gradient-to-r from-damiun-nav-tint/60 via-white to-damiun-nav-tint/40 p-5 ring-1 ring-damiun-primary/10 sm:flex-row sm:items-center">
              <p className="text-sm text-damiun-body">Update your name, bio, or avatar URL anytime.</p>
              <button
                type="button"
                onClick={() => setTab("settings")}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-damiun-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-damiun-primary-hover"
              >
                <PenSquare className="h-4 w-4" aria-hidden />
                Edit profile
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-6 shadow-[0_8px_40px_rgba(26,34,53,0.06)] sm:p-10">
          <div className="mx-auto max-w-lg">
            <h2 className="text-xl font-bold text-damiun-wordmark">Account</h2>
            <p className="mt-2 text-sm leading-relaxed text-damiun-muted">
              Changes apply to the header, this profile, and issued certificates.
            </p>

            <form className="mt-10 flex flex-col gap-8" onSubmit={onSubmit}>
              <label className="block text-sm font-semibold text-damiun-wordmark">
                Full name
                <input
                  value={form.fullName}
                  onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  className={inputClass}
                />
              </label>

              <label className="block text-sm font-semibold text-damiun-wordmark">
                Bio
                <textarea
                  rows={5}
                  value={form.bio}
                  onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
                  className={inputClass}
                  maxLength={240}
                />
                <span className="mt-1.5 block text-right text-xs text-damiun-muted">{form.bio.length} / 240</span>
              </label>

              <label className="block text-sm font-semibold text-damiun-wordmark">
                Avatar URL
                <input
                  value={form.avatar}
                  onChange={(event) => setForm((prev) => ({ ...prev, avatar: event.target.value }))}
                  className={inputClass}
                  placeholder="https://…"
                />
                <span className="mt-1.5 block text-xs text-damiun-muted">Or upload a photo from the Overview tab.</span>
              </label>

              <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-8">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-damiun-wordmark shadow-sm transition hover:bg-gray-50"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-damiun-primary px-8 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-damiun-primary-hover disabled:pointer-events-none disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
