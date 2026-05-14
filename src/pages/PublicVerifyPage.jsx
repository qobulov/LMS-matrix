import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { certificateApi } from "../api/endpoints";
import { formatDate } from "../utils/format";

export function PublicVerifyPage() {
  const { certificateId } = useParams();
  const decodedId = certificateId ? decodeURIComponent(certificateId) : "";

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState({ ok: false, reason: "missing" });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!decodedId.trim()) {
        setResult({ ok: false, reason: "missing" });
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await certificateApi.verifyById(decodedId.trim(), {});
        if (cancelled) return;
        if (data?.valid) {
          setResult({
            ok: true,
            studentName: data.student_name,
            courseTitle: data.course_title,
            instructorName: data.instructor_name,
            issuedAt: data.issued_at,
            id: decodedId.trim(),
          });
        } else {
          setResult({ ok: false, reason: "notfound" });
        }
      } catch {
        if (!cancelled) setResult({ ok: false, reason: "notfound" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [decodedId]);

  return (
    <div className="min-h-screen bg-damiun-surface-app px-4 py-12">
      <div className="mx-auto max-w-lg">
        <Link to="/catalog" className="text-sm font-semibold text-damiun-primary hover:underline">
          Back to catalog
        </Link>

        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm ring-1 ring-gray-50">
          {loading ? (
            <p className="text-sm text-damiun-muted">Checking certificate…</p>
          ) : (
            <>
              <div className="flex items-center gap-3">
                {result.ok ? (
                  <CheckCircle2 className="h-10 w-10 shrink-0 text-emerald-500" aria-hidden />
                ) : (
                  <XCircle className="h-10 w-10 shrink-0 text-red-500" aria-hidden />
                )}
                <div>
                  <h1 className="text-xl font-bold text-damiun-wordmark">
                    {result.ok ? "Valid certificate" : "Certificate not found"}
                  </h1>
                  <p className="mt-1 font-mono text-xs text-damiun-muted">{decodedId || "—"}</p>
                </div>
              </div>

              {result.ok ? (
                <dl className="mt-6 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-bold uppercase text-damiun-muted">Student</dt>
                    <dd className="font-medium text-damiun-wordmark">{result.studentName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase text-damiun-muted">Course</dt>
                    <dd className="font-medium text-damiun-wordmark">{result.courseTitle}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase text-damiun-muted">Instructor</dt>
                    <dd className="font-medium text-damiun-wordmark">{result.instructorName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase text-damiun-muted">Issued</dt>
                    <dd className="text-damiun-body">{formatDate(result.issuedAt)}</dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-6 text-sm text-damiun-body">
                  {result.reason === "missing"
                    ? "No certificate id in the URL."
                    : "This ID does not match any issued certificate."}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
