import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Award, Gift, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { useLms } from "../data/LmsContext";
import { formatDate } from "../utils/format";

const rewards = [
  {
    id: "reward-1",
    title: "Perfect Score",
    description: "Score 100% on any quiz",
    icon: Star,
    claimed: false,
    points: 50,
  },
  {
    id: "reward-2",
    title: "Fast Learner",
    description: "Complete a course in under 2 weeks",
    icon: Award,
    claimed: true,
    points: 100,
  },
  {
    id: "reward-3",
    title: "Course Master",
    description: "Complete 5 courses",
    icon: Gift,
    claimed: false,
    points: 200,
  },
];

function matchesSearch(cert, q) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const hay = [cert.courseTitle, cert.studentName, cert.id].filter(Boolean).join(" ").toLowerCase();
  return hay.includes(s);
}

/** Figma: small certificate preview (blue / white / orange accent) */
function CertificateThumb({ coverImage }) {
  return (
    <div className="relative h-[72px] w-[56px] shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 shadow-sm">
      {coverImage ? (
        <img src={coverImage} alt="" className="h-full w-full object-cover" />
      ) : (
        <>
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, #01A0E7 0%, #ffffff 45%, #f97316 100%)",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <Award className="h-6 w-6 text-white drop-shadow-md" aria-hidden />
          </div>
        </>
      )}
    </div>
  );
}

export function RewardsPage() {
  const { myEnrollments, courses, enrollments, users, role, currentUser } = useLms();
  /** Figma: "Rewards" | "Certificate" — internal keys `rewards` | `certificate` */
  const [activeTab, setActiveTab] = useState("certificate");
  const [certSearch, setCertSearch] = useState("");
  const [rewardSearch, setRewardSearch] = useState("");

  const certificates = useMemo(() => {
    const q = certSearch;

    if (role === "student") {
      return myEnrollments
        .filter((item) => item.certificate)
        .map((item) => {
          const course = courses.find((courseItem) => courseItem.id === item.courseId);
          return {
            ...item.certificate,
            courseTitle: course?.title || "Unknown",
            courseId: item.courseId,
            coverImage: course?.coverImage,
            studentName: currentUser?.fullName,
            viewerScope: "mine",
          };
        })
        .filter((cert) => matchesSearch(cert, q));
    }

    const myCourseIds = new Set(
      courses.filter((c) => c.instructorId === currentUser?.id).map((c) => c.id),
    );

    const source =
      role === "instructor"
        ? enrollments.filter((e) => e.certificate && myCourseIds.has(e.courseId))
        : enrollments.filter((e) => e.certificate);

    return source
      .map((item) => {
        const course = courses.find((c) => c.id === item.courseId);
        const student = users.find((u) => u.id === item.userId);
        return {
          ...item.certificate,
          courseTitle: course?.title || "Unknown",
          courseId: item.courseId,
          coverImage: course?.coverImage,
          studentName: student?.fullName || "—",
          viewerScope: role === "instructor" ? "instructor" : "admin",
        };
      })
      .filter((cert) => matchesSearch(cert, q));
  }, [myEnrollments, courses, enrollments, users, role, currentUser, certSearch]);

  const filteredRewards = rewards.filter((reward) =>
    reward.title.toLowerCase().includes(rewardSearch.toLowerCase()),
  );

  const emptyCertsMessage = (() => {
    if (certSearch.trim()) return "No certificates match your search.";
    if (role === "student") {
      return (
        <>
          You don&apos;t have any certificates yet.{" "}
          <Link to="/catalog" className="font-semibold text-damiun-primary hover:underline">
            Enroll and complete a course
          </Link>{" "}
          to earn one.
        </>
      );
    }
    if (role === "instructor") {
      return "No certificates have been issued for your courses yet.";
    }
    return "No certificates in the demo data.";
  })();

  const tabClass = (isActive) =>
    `rounded-full px-6 py-2.5 text-sm font-semibold transition ${
      isActive
        ? "bg-damiun-primary text-white shadow-sm"
        : "bg-white text-gray-500 shadow-sm ring-1 ring-gray-200 hover:text-damiun-wordmark"
    }`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-damiun-wordmark">Rewards</h1>
        <p className="mt-1 text-sm text-damiun-muted">Certificates and gamified milestones (demo rewards).</p>
      </div>

      {/* Figma: Rewards (inactive) first, Certificate (active) second */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab("rewards");
            setCertSearch("");
          }}
          className={tabClass(activeTab === "rewards")}
        >
          Rewards
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("certificate");
            setRewardSearch("");
          }}
          className={tabClass(activeTab === "certificate")}
        >
          Certificate
        </button>
      </div>

      {activeTab === "certificate" ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-gray-100/80 sm:p-8">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search Certificate"
              value={certSearch}
              onChange={(e) => setCertSearch(e.target.value)}
              className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-11 pr-4 text-sm text-damiun-wordmark outline-none transition placeholder:text-gray-400 focus:border-damiun-primary focus:bg-white focus:ring-2 focus:ring-damiun-primary/20"
            />
          </div>

          <hr className="my-6 border-gray-100" />

          {certificates.length === 0 ? (
            <div className="py-12 text-center text-sm text-damiun-muted">{emptyCertsMessage}</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {certificates.map((certificate) => (
                <article
                  key={certificate.id}
                  className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
                >
                  <CertificateThumb coverImage={certificate.coverImage} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-damiun-wordmark">Certificate</p>
                    <p className="text-sm text-gray-500">Accomplished</p>
                    <p className="mt-0.5 truncate text-xs text-damiun-muted" title={certificate.courseTitle}>
                      {certificate.courseTitle}
                    </p>
                    {certificate.viewerScope !== "mine" && certificate.studentName && (
                      <p className="truncate text-xs text-damiun-muted">{certificate.studentName}</p>
                    )}
                    <p className="mt-1 font-mono text-[10px] text-gray-400">{certificate.id}</p>
                    <p className="text-[10px] text-gray-400">{formatDate(certificate.issuedAt)}</p>
                  </div>
                  <Link
                    to={`/verify/${encodeURIComponent(certificate.id)}`}
                    className="shrink-0 rounded-full bg-damiun-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-damiun-primary-hover"
                  >
                    Claim
                  </Link>
                </article>
              ))}
            </div>
          )}

          {role === "student" && certificates.length > 0 && (
            <p className="mt-6 text-center text-xs text-damiun-muted">
              <Link to="/certificates" className="font-semibold text-damiun-primary hover:underline">
                Open full certificates hub
              </Link>
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-gray-100/80 sm:p-8">
          <div className="relative mb-6 max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search rewards..."
              value={rewardSearch}
              onChange={(e) => setRewardSearch(e.target.value)}
              className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-damiun-primary focus:bg-white focus:ring-2 focus:ring-damiun-primary/20"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRewards.map((reward) => (
              <article
                key={reward.id}
                className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <reward.icon className="h-8 w-8 shrink-0 text-damiun-primary" />
                    <h3 className="text-lg font-semibold text-damiun-wordmark">{reward.title}</h3>
                  </div>
                  <span className="text-lg font-bold text-damiun-primary">{reward.points} pts</span>
                </div>
                <p className="mt-3 flex-1 text-sm text-damiun-body">{reward.description}</p>
                <button
                  type="button"
                  disabled={reward.claimed}
                  onClick={() => {
                    if (!reward.claimed) {
                      toast.info(`Reward "${reward.title}" — demo claim only.`);
                    }
                  }}
                  className={`mt-5 w-full rounded-full py-2.5 text-sm font-semibold transition ${
                    reward.claimed
                      ? "cursor-not-allowed bg-gray-100 text-damiun-muted"
                      : "bg-damiun-primary text-white shadow-sm hover:bg-damiun-primary-hover"
                  }`}
                >
                  {reward.claimed ? "Claimed" : "Claim"}
                </button>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
