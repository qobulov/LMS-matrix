import { useState } from "react";
import { Gift, Award, Star } from "lucide-react";
import { useLms } from "../data/LmsContext";

export function RewardsPage() {
  const { myEnrollments, courses } = useLms();
  const [activeTab, setActiveTab] = useState("certificates");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock rewards data
  const rewards = [
    {
      id: "reward-1",
      title: "Perfect Score",
      description: "Score 100% on any quiz",
      icon: Star,
      claimed: false,
      points: 50
    },
    {
      id: "reward-2", 
      title: "Fast Learner",
      description: "Complete a course in under 2 weeks",
      icon: Award,
      claimed: true,
      points: 100
    },
    {
      id: "reward-3",
      title: "Course Master",
      description: "Complete 5 courses",
      icon: Gift,
      claimed: false,
      points: 200
    }
  ];

  // Filter certificates based on search
  const certificates = myEnrollments
    .filter((item) => item.certificate)
    .map((item) => {
      const course = courses.find((courseItem) => courseItem.id === item.courseId);
      return {
        ...item.certificate,
        courseTitle: course?.title || "Unknown",
        courseId: item.courseId,
        claimed: false
      };
    })
    .filter(cert => 
      cert.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const filteredRewards = rewards.filter(reward =>
    reward.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="stack">
      <h2>Rewards</h2>
      
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("certificates")}
          className={`pb-3 px-4 font-medium transition ${
            activeTab === "certificates"
              ? "text-[#149ad9] border-b-2 border-[#149ad9]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Certificate
        </button>
        <button
          onClick={() => setActiveTab("rewards")}
          className={`pb-3 px-4 font-medium transition ${
            activeTab === "rewards"
              ? "text-[#149ad9] border-b-2 border-[#149ad9]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Rewards
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder={`Search ${activeTab === "certificates" ? "Certificate" : "Rewards"}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#149ad9] focus:border-transparent"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === "certificates" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((certificate) => (
            <div key={certificate.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{certificate.courseTitle}</h3>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Available
                </span>
              </div>
              <p className="text-gray-600 mb-4">Certificate of Completion</p>
              <div className="text-sm text-gray-500 mb-4">
                ID: {certificate.id}
              </div>
              <button
                onClick={() => alert(`Claiming certificate: ${certificate.id}`)}
                className="w-full bg-[#149ad9] text-white py-2 px-4 rounded-md hover:bg-[#0f89c2] transition font-medium"
              >
                {certificate.claimed ? "View Certificate" : "Claim"}
              </button>
            </div>
          ))}
          {certificates.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No certificates found</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRewards.map((reward) => (
            <div key={reward.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <reward.icon className="w-8 h-8 text-[#149ad9]" />
                  <h3 className="text-lg font-semibold text-gray-900">{reward.title}</h3>
                </div>
                <span className="text-2xl font-bold text-[#149ad9]">{reward.points}</span>
              </div>
              <p className="text-gray-600 mb-4">{reward.description}</p>
              <button
                onClick={() => alert(`Claiming reward: ${reward.title}`)}
                disabled={reward.claimed}
                className={`w-full py-2 px-4 rounded-md transition font-medium ${
                  reward.claimed
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-[#149ad9] text-white hover:bg-[#0f89c2]"
                }`}
              >
                {reward.claimed ? "Claimed" : "Claim"}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
