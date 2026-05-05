import { Play } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLms } from "../data/LmsContext";

/* ── Donut chart ─────────────────────────────────────── */
const RINGS = [
  { r: 84, sw: 12, color: "#22c55e", label: "UI/UX Design", pct: 78 },
  { r: 63, sw: 12, color: "#a855f7", label: "HTML",         pct: 62 },
  { r: 42, sw: 12, color: "#f97316", label: "Javascript",   pct: 48 },
  { r: 21, sw: 12, color: "#3b82f6", label: "React",        pct: 32 },
];

function DonutRings() {
  const cx = 100, cy = 100;
  return (
    <svg viewBox="0 0 200 200" className="h-56 w-56 flex-shrink-0">
      {RINGS.map(({ r, sw, color, pct }) => {
        const circ = 2 * Math.PI * r;
        const filled = (pct / 100) * circ;
        return (
          <g key={r}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f0f0" strokeWidth={sw} />
            <circle
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={color}
              strokeWidth={sw}
              strokeDasharray={`${filled} ${circ - filled}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          </g>
        );
      })}
    </svg>
  );
}

/* ── Feature cards (right column) ───────────────────── */
function DarkCard({ image, title, sub }) {
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <img src={image} alt={title} className="absolute inset-0 h-full w-full object-cover brightness-50" />
      <div className="relative z-10 flex h-full flex-col justify-end p-3">
        <p className="text-sm font-bold leading-tight text-white">{title}</p>
        <p className="mt-0.5 text-xs text-white/70">{sub}</p>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────── */
export function HomePage() {
  const { featuredCourses } = useLms();
  const [tab, setTab] = useState("progress");

  const heroImg   = featuredCourses[0]?.coverImage;
  const communityImg = featuredCourses[1]?.coverImage;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Hero banner ── */}
      <div className="flex h-[280px] gap-3 overflow-hidden rounded-2xl">

        {/* Col 1 — text (blue gradient, ~31%) */}
        <div
          className="relative flex w-[31%] flex-shrink-0 flex-col justify-center overflow-hidden p-8"
          style={{ background: "linear-gradient(135deg,#22cde8 0%,#149ad9 50%,#0a3c8c 100%)" }}
        >
          {/* arc decorations */}
          {[320, 220, 120].map((s) => (
            <div
              key={s}
              className="pointer-events-none absolute rounded-full border border-white/20"
              style={{ width: s, height: s, right: -s / 2.5, top: "50%", transform: "translateY(-50%)" }}
            />
          ))}
          <div className="relative z-10">
            <h1 className="text-2xl font-bold leading-snug text-white xl:text-3xl">
              All-in-One Career Toolkit
            </h1>
            <p className="mt-3 text-xs leading-relaxed text-white/80">
              One platform with everything you need: courses, mentoring, and job matching.
            </p>
            <Link
              to="/catalog"
              className="mt-5 inline-block rounded-full bg-white px-5 py-2 text-xs font-bold text-[#149ad9] shadow transition hover:shadow-md"
            >
              Start Learning Now!
            </Link>
          </div>
        </div>

        {/* Col 2 — Mentoring card (~38%) */}
        <div className="relative w-[38%] flex-shrink-0 overflow-hidden rounded-2xl">
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=700&h=560&fit=crop&auto=format"
            alt="Mentoring"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
              <Play size={18} className="ml-0.5 text-[#149ad9]" fill="#149ad9" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-base font-bold text-white">Mentoring 1 on 1</p>
            <p className="text-xs text-white/70">With Expert Mentor</p>
          </div>
        </div>

        {/* Col 3 — Flexible (top) + Connect | Integrations (bottom) (~31%) */}
        <div className="flex flex-1 flex-col gap-3">

          {/* Flexible */}
          <div className="flex flex-[45] flex-col justify-between overflow-hidden rounded-2xl bg-[#1c2434] p-4">
            <div>
              <p className="text-sm font-bold text-white">Flexible</p>
              <p className="mt-1 text-[11px] text-white/55">No fixed time, just your pace</p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <div className="h-2 w-2 rounded-full bg-[#149ad9]" />
              <img
                src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=40&h=40&fit=crop&auto=format"
                alt=""
                className="h-8 w-8 rounded-full object-cover ring-2 ring-white/20"
              />
            </div>
          </div>

          {/* Connect + Integrations */}
          <div className="flex flex-[55] gap-3">

            <div className="relative flex-1 overflow-hidden rounded-2xl">
              <img
                src={communityImg || "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop&auto=format"}
                alt="Connect"
                className="absolute inset-0 h-full w-full object-cover brightness-50"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-sm font-bold text-white">Connect</p>
                <p className="text-[11px] text-white/65">With Community</p>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between overflow-hidden rounded-2xl bg-white p-3">
              <div className="flex flex-wrap gap-1.5">
                {[
                  "https://www.vectorlogo.zone/logos/figma/figma-icon.svg",
                  "https://www.vectorlogo.zone/logos/dropbox/dropbox-icon.svg",
                  "https://www.vectorlogo.zone/logos/google_drive/google_drive-icon.svg",
                ].map((src, i) => (
                  <div key={i} className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 p-1">
                    <img src={src} alt="" className="h-full w-full object-contain" />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">Integrations</p>
                <p className="text-[10px] text-gray-400">Connect with your favourite</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-3">
        {[["progress", "Learning Progress"], ["courses", "All Course"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              tab === key
                ? "bg-[#149ad9] text-white shadow-sm"
                : "bg-white text-gray-500 shadow-sm hover:text-gray-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {tab === "progress" ? (
        <div className="max-w-lg rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="mb-8 text-xl font-bold text-gray-900">Learning Progress</h2>
          <div className="flex items-center gap-10">
            <DonutRings />
            <ul className="flex flex-col gap-4">
              {RINGS.map(({ color, label, pct }) => (
                <li key={label} className="flex items-center gap-3">
                  <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ background: color }} />
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className="ml-auto pl-4 text-xs font-semibold text-gray-400">{pct}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featuredCourses.map((course) => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={course.coverImage}
                  alt={course.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <p className="line-clamp-2 text-sm font-bold leading-snug text-gray-900">{course.title}</p>
                <p className="mt-1 text-xs text-gray-400">{course.durationHours}h total</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
