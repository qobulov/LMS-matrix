import { useMemo, useState } from "react";
import { QRCode } from "../components/ui/qr-code";
import { useLms } from "../data/LmsContext";
import { formatDate } from "../utils/format";

export function CertificatesPage() {
  const { myEnrollments, courses, currentUser, enrollments, users } = useLms();
  const [verifyId, setVerifyId] = useState("");

  const certificates = myEnrollments
    .filter((item) => item.certificate)
    .map((item) => {
      const course = courses.find((courseItem) => courseItem.id === item.courseId);
      return {
        ...item.certificate,
        courseTitle: course?.title || "Unknown",
      };
    });

  const verifyResult = useMemo(() => {
    if (!verifyId.trim()) return null;

    const found = enrollments.find(
      (item) => item.certificate?.id.toLowerCase() === verifyId.trim().toLowerCase(),
    );

    if (!found) return { ok: false };

    const owner = users.find((user) => user.id === found.userId);
    const course = courses.find((item) => item.id === found.courseId);

    return {
      ok: true,
      owner: owner?.fullName,
      course: course?.title,
      issuedAt: found.certificate?.issuedAt,
    };
  }, [verifyId, enrollments, users, courses]);

  return (
    <section className="stack">
      <h2>Certificates</h2>

      {certificates.length === 0 ? (
        <p>Certificate hali yo'q. Course va quizni to'liq tugating.</p>
      ) : (
        <div className="stack">
          {certificates.map((certificate) => (
            <article key={certificate.id} className="certificate-card">
              <p className="eyebrow">Certificate of Completion</p>
              <h3>{certificate.courseTitle}</h3>
              <p>{currentUser.fullName}</p>
              <p>Issued: {formatDate(certificate.issuedAt)}</p>
              <p>Verification ID: {certificate.id}</p>
              <div className="row-gap" style={{ marginTop: "0.8rem", alignItems: "flex-start" }}>
                <QRCode
                  value={`lms-matrix://verify?certificate_id=${encodeURIComponent(certificate.id)}`}
                  size={124}
                  className="rounded-xl border"
                />
                <p className="small-text">
                  QR ni scan qilib verification ID ni oling va Public Verification maydonida
                  tekshiring.
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      <article className="panel stack">
        <h3>Public Verification</h3>
        <label>
          Certificate ID
          <input value={verifyId} onChange={(event) => setVerifyId(event.target.value)} />
        </label>

        {verifyResult ? (
          verifyResult.ok ? (
            <div className="panel">
              <p>Status: Valid</p>
              <p>Student: {verifyResult.owner}</p>
              <p>Course: {verifyResult.course}</p>
              <p>Issued: {formatDate(verifyResult.issuedAt)}</p>
            </div>
          ) : (
            <p className="error-text">Certificate topilmadi.</p>
          )
        ) : null}
      </article>
    </section>
  );
}
