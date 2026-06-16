import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Award, Gift, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { profileApi } from "../api/endpoints";
import { useLms } from "../data/LmsContext";
import { formatDate, formatPrice } from "../utils/format";

function matchesSearch(cert, q) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const hay = [cert.courseTitle, cert.studentName, cert.id].filter(Boolean).join(" ").toLowerCase();
  return hay.includes(s);
}

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
  const { getToken, role, currentUser } = useLms();
  const [activeTab, setActiveTab] = useState("certificate");
  const [certSearch, setCertSearch] = useState("");
  const [rewardSearch, setRewardSearch] = useState("");
  const [apiCerts, setApiCerts] = useState([]);
  const [apiRewards, setApiRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const token = getToken();
    if (!token) {
      setApiCerts([]);
      setApiRewards([]);
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        const data = await profileApi.getMyRewards({ token });
        if (cancelled) return;
        const certs = (data.certificates ?? []).map((c) => ({
          id: c.certificate_uid ?? c.id,
          issuedAt: c.issued_at,
          courseTitle: c.course?.title ?? "—",
          coverImage: c.course?.cover_image,
          studentName: c.student_name ?? currentUser?.fullName,
        }));
        setApiCerts(certs);
        setApiRewards(data.rewards ?? []);
      } catch {
        if (!cancelled) {
          setApiCerts([]);
          setApiRewards([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken, currentUser?.fullName]);

  const certificates = useMemo(() => {
    return apiCerts.filter((cert) => matchesSearch(cert, certSearch));
  }, [apiCerts, certSearch]);

  const filteredRewards = useMemo(() => {
    const q = rewardSearch.toLowerCase();
    return apiRewards.filter((r) => (r.title ?? "").toLowerCase().includes(q));
  }, [apiRewards, rewardSearch]);

  const emptyCertsMessage = (() => {
    if (certSearch.trim()) return "No certificates match your search.";
    return (
      <>
        You don&apos;t have any certificates yet.{" "}
        <Link to="/catalog" className="font-semibold text-damiun-primary hover:underline">
          Enroll and complete a course
        </Link>{" "}
        to earn one.
      </>
    );
  })();

  const tabClass = (isActive) =>
    `rounded-full px-6 py-2.5 text-sm font-semibold transition ${
      isActive
        ? "bg-damiun-primary text-white shadow-sm"
        : "bg-white text-gray-500 shadow-sm ring-1 ring-gray-200 hover:text-damiun-wordmark"
    }`;

  if (loading) {
    return <div className="py-12 text-center text-sm text-gray-500">Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-damiun-wordmark">Rewards</h1>
        <p className="mt-1 text-sm text-damiun-muted">Certificates and milestones from the platform.</p>
      </div>

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
            {filteredRewards.length === 0 ? (
              <p className="text-sm text-damiun-muted">No rewards data.</p>
            ) : (
              filteredRewards.map((reward) => {
                const Icon = reward.unlocked ? Star : Gift;
                return (
                  <article
                    key={reward.id}
                    className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Icon className="h-8 w-8 shrink-0 text-damiun-primary" />
                        <h3 className="text-lg font-semibold text-damiun-wordmark">{reward.title}</h3>
                      </div>
                      <span className="text-lg font-bold text-damiun-primary">{formatPrice(reward.points ?? reward.amount ?? 0)}</span>
                    </div>
                    <p className="mt-3 flex-1 text-sm text-damiun-body">{reward.description}</p>
                    <button
                      type="button"
                      disabled={!reward.unlocked || reward.claimed}
                      onClick={async () => {
                        const token = getToken();
                        if (!token) return;
                        try {
                          await profileApi.topUpBalance({ amount: reward.points ?? reward.amount ?? 0, reward_id: reward.id }, { token });
                          toast.success(`${formatPrice(reward.points ?? reward.amount ?? 0)} balansga qo'shildi!`);
                          setApiRewards((prev) => prev.map((r) => r.id === reward.id ? { ...r, claimed: true } : r));
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Xatolik");
                        }
                      }}
                      className={`mt-5 w-full rounded-full py-2.5 text-sm font-semibold transition ${
                        reward.unlocked && !reward.claimed
                          ? "bg-damiun-primary text-white shadow-sm hover:bg-damiun-primary-hover"
                          : "cursor-not-allowed bg-gray-100 text-damiun-muted"
                      }`}
                    >
                      {reward.claimed ? "Claimed" : reward.unlocked ? "Claim" : "Locked"}
                    </button>
                  </article>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
