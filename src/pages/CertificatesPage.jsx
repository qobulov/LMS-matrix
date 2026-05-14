import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { certificateApi } from "../api/endpoints";
import { QRCode } from "../components/ui/qr-code";
import { useLms } from "../data/LmsContext";
import { formatDate } from "../utils/format";

export function CertificatesPage() {
  const { currentUser, getToken } = useLms();
  const [verifyId, setVerifyId] = useState("");
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const token = getToken();
    if (!token) {
      setCertificates([]);
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        const data = await certificateApi.getMine({ token });
        const list = (data.certificates ?? []).map((c) => ({
          id: c.certificate_uid ?? c.id,
          issuedAt: c.issued_at,
          courseTitle: c.course?.title ?? "—",
          instructorName: c.instructor?.full_name ?? "—",
          studentName: c.student_name,
        }));
        if (!cancelled) setCertificates(list);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
          setCertificates([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  const verifyResult = useMemo(() => {
    if (!verifyId.trim()) return null;
    const found = certificates.find(
      (c) => String(c.id).toLowerCase() === verifyId.trim().toLowerCase(),
    );
    if (!found) return { ok: false };
    return {
      ok: true,
      owner: found.studentName,
      course: found.courseTitle,
      instructor: found.instructorName,
      issuedAt: found.issuedAt,
    };
  }, [verifyId, certificates]);

  if (loading) {
    return <div className="py-16 text-center text-sm text-gray-500">Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-damiun-wordmark">Certificates</h1>
        <p className="mt-1 text-sm text-damiun-muted">Your issued certificates and public ID verification.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50/80 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {certificates.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
          <p className="text-damiun-body">Certificate hali yo&apos;q. Course va quizni to&apos;liq tugating.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {certificates.map((certificate) => (
            <article
              key={certificate.id}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-50 sm:p-8"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-damiun-primary">
                Certificate of completion
              </p>
              <h2 className="mt-2 text-xl font-bold text-damiun-wordmark">{certificate.courseTitle}</h2>
              <p className="mt-1 text-sm text-damiun-muted">
                Instructor: <span className="font-medium text-damiun-body">{certificate.instructorName}</span>
              </p>
              <p className="mt-2 text-sm text-damiun-body">{currentUser?.fullName}</p>
              <p className="mt-1 text-sm text-damiun-muted">Issued: {formatDate(certificate.issuedAt)}</p>
              <p className="mt-1 font-mono text-sm text-damiun-wordmark">ID: {certificate.id}</p>
              <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start">
                <QRCode
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/verify/${encodeURIComponent(certificate.id)}`}
                  size={124}
                  className="rounded-xl border border-gray-200"
                />
                <div className="space-y-2 text-sm text-damiun-muted">
                  <p>Scan or share the public verify link (no login required).</p>
                  <Link
                    to={`/verify/${encodeURIComponent(certificate.id)}`}
                    className="inline-flex items-center gap-1 font-semibold text-damiun-primary hover:underline"
                  >
                    Open verify page <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-50 sm:p-8">
        <h2 className="text-lg font-bold text-damiun-wordmark">Public verification</h2>
        <p className="mt-1 text-sm text-damiun-muted">Enter a certificate ID to validate against platform records.</p>
        <label className="mt-4 block text-sm font-medium text-damiun-wordmark">
          Certificate ID
          <input
            value={verifyId}
            onChange={(event) => setVerifyId(event.target.value)}
            className="mt-2 w-full max-w-md rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-damiun-primary focus:bg-white focus:ring-2 focus:ring-damiun-primary/20"
            placeholder="e.g. CERT-..."
          />
        </label>

        {verifyResult ? (
          verifyResult.ok ? (
            <div className="mt-4 max-w-lg rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900">
              <p className="font-bold">Valid certificate</p>
              <p className="mt-2">Student: {verifyResult.owner}</p>
              <p>Course: {verifyResult.course}</p>
              <p>Instructor: {verifyResult.instructor}</p>
              <p>Issued: {formatDate(verifyResult.issuedAt)}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm font-medium text-red-600">Certificate topilmadi.</p>
          )
        ) : null}
      </section>
    </div>
  );
}
