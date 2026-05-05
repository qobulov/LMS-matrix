export function StatCard({ label, value, helper }) {
  return (
    <article className="stat-card">
      <p className="stat-label">{label}</p>
      <h3 className="stat-value">{value}</h3>
      {helper ? <p className="stat-helper">{helper}</p> : null}
    </article>
  );
}
