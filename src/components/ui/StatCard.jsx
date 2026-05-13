export function StatCard({ label, value, helper }) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-gray-50">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <h3 className="mt-1 text-2xl font-bold tracking-tight text-damiun-wordmark">{value}</h3>
      {helper ? <p className="mt-1 text-xs font-medium text-damiun-muted">{helper}</p> : null}
    </article>
  );
}
