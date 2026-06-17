import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, TrendingUp } from "lucide-react";
import { profileApi } from "../../api/endpoints";
import { useLms } from "../../data/LmsContext";

function formatMoney(amount) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("uz-UZ").format(Math.abs(amount)) + " so'm";
}

function formatDate(str) {
  if (!str) return "—";
  return new Intl.DateTimeFormat("uz-UZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(str));
}

function mapTx(t) {
  return {
    id: String(t.id ?? ""),
    amount: Math.abs(Number(t.amount ?? 0)),
    courseTitle: t.course_title ?? null,
    createdAt: t.created_at ?? "",
  };
}

export function InstructorTransactionsPage() {
  const { getToken } = useLms();
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) throw new Error("Not signed in");
    return profileApi.getTransactions({ page, page_size: pageSize }, { token });
  }, [getToken, page]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await load();
        if (cancelled) return;
        setTransactions((data.transactions ?? []).map(mapTx));
        setTotal(Number(data.total ?? 0));
      } catch (e) {
        if (!cancelled) {
          setTransactions([]);
          setTotal(0);
          setError(e instanceof Error ? e.message : "Yuklab bo'lmadi");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [load]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);
  const totalEarned = useMemo(() => transactions.reduce((s, t) => s + t.amount, 0), [transactions]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-damiun-wordmark">Transactions</h1>
        <p className="mt-1 text-sm text-damiun-muted">Kurslaringizdan tushgan to'lovlar tarixi.</p>
      </div>

      {!loading && transactions.length > 0 && (
        <div className="flex items-center gap-3 self-start rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-emerald-100">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <TrendingUp size={18} />
          </span>
          <div>
            <p className="text-xs text-damiun-muted">Jami daromad</p>
            <p className="text-lg font-bold text-emerald-700">+{formatMoney(totalEarned)}</p>
          </div>
        </div>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm ring-1 ring-gray-50">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-damiun-muted">
            Yuklanmoqda…
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Clock className="h-10 w-10 text-gray-200" />
            <p className="text-sm font-medium text-damiun-muted">Tranzaksiyalar mavjud emas</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex items-center gap-4 px-5 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <TrendingUp size={16} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-damiun-wordmark">
                    {tx.courseTitle ?? "Payout"}
                  </p>
                  <p className="mt-0.5 text-xs text-damiun-muted">{formatDate(tx.createdAt)}</p>
                </div>

                <p className="text-base font-bold text-emerald-700">
                  +{formatMoney(tx.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {total > pageSize && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-damiun-muted">
          <span>Sahifa {page} / {totalPages} ({total} ta)</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 font-semibold text-damiun-wordmark shadow-sm disabled:opacity-50"
            >
              Oldingi
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 font-semibold text-damiun-wordmark shadow-sm disabled:opacity-50"
            >
              Keyingi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
