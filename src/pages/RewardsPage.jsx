import { useState } from "react";
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

export function RewardsPage() {
  const { myEnrollments, courses } = useLms();
  const [activeTab, setActiveTab] = useState("certificates");
  const [searchQuery, setSearchQuery] = useState("");

  const certificates = myEnrollments
    .filter((item) => item.certificate)
    .map((item) => {
      const course = courses.find((courseItem) => courseItem.id === item.courseId);
      return {
        ...item.certificate,
        courseTitle: course?.title || "Unknown",
        courseId: item.courseId,
      };
    })
    .filter((cert) => cert.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredRewards = rewards.filter((reward) =>
    reward.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-damiun-wordmark">Rewards</h1>
        <p className="mt-1 text-sm text-damiun-muted">Certificates and gamified milestones (demo rewards).</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("certificates")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
            activeTab === "certificates"
              ? "bg-damiun-primary text-white shadow-sm"
              : "bg-white text-damiun-muted shadow-sm ring-1 ring-gray-100 hover:text-damiun-wordmark"
          }`}
        >
          Certificates
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("rewards")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
            activeTab === "rewards"
              ? "bg-damiun-primary text-white shadow-sm"
              : "bg-white text-damiun-muted shadow-sm ring-1 ring-gray-100 hover:text-damiun-wordmark"
          }`}
        >
          Rewards
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-damiun-muted" />
        <input
          type="search"
          placeholder={activeTab === "certificates" ? "Search certificates..." : "Search rewards..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none ring-damiun-primary/25 transition focus:border-damiun-primary focus:ring-2"
        />
      </div>

      {activeTab === "certificates" ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((certificate) => (
            <article
              key={certificate.id}
              className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-50"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold text-damiun-wordmark">{certificate.courseTitle}</h3>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase text-emerald-800 ring-1 ring-emerald-100">
                  Issued
                </span>
              </div>
              <p className="mt-2 text-sm text-damiun-muted">Certificate of completion</p>
              <p className="mt-3 font-mono text-xs text-damiun-body">ID: {certificate.id}</p>
              <p className="mt-1 text-xs text-damiun-muted">{formatDate(certificate.issuedAt)}</p>
              <div className="mt-5 flex flex-col gap-2">
                <Link
                  to={`/verify/${encodeURIComponent(certificate.id)}`}
                  className="inline-flex justify-center rounded-full bg-damiun-primary py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-damiun-primary-hover"
                >
                  Verify publicly
                </Link>
                <Link
                  to="/certificates"
                  className="text-center text-sm font-semibold text-damiun-primary hover:underline"
                >
                  Open certificates hub
                </Link>
              </div>
            </article>
          ))}
          {certificates.length === 0 && (
            <div className="col-span-full rounded-2xl bg-white py-16 text-center text-damiun-muted shadow-sm ring-1 ring-gray-100">
              No certificates match your search.
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredRewards.map((reward) => (
            <article
              key={reward.id}
              className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <reward.icon className="h-8 w-8 shrink-0 text-damiun-primary" />
                  <h3 className="text-lg font-semibold text-damiun-wordmark">{reward.title}</h3>
                </div>
                <span className="text-xl font-bold text-damiun-primary">{reward.points} pts</span>
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
                {reward.claimed ? "Claimed" : "Claim (demo)"}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
