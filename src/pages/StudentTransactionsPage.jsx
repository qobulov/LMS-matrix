import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, BookOpen, Clock } from "lucide-react";
import { profileApi } from "../api/endpoints";
import { useLms } from "../data/LmsContext";

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

function normalizeType(raw) {
  const s = String(raw ?? "").toLowerCase().trim();
  if (s === "topup" || s === "top_up" || s === "deposit" || s === "recharge") return "topup";
  if (s === "payment" || s === "purchase" || s === "debit") return "payment";
  return s || "other";
}

function mapTx(t) {
  const type = normalizeType(t.type);
  const raw = Number(t.amount ?? 0);
  // Normalize: topup → positive, payment → negative (regardless of how backend sends it)
  const amount = type === "topup" ? Math.abs(raw) : -Math.abs(raw);
  return {
    id: String(t.id ?? ""),
    type,
    amount,
    courseTitle: t.course_title ?? null,
    createdAt: t.created_at ?? "",
  };
}

const TYPE_META = {
  topup: {
    label: "Hisobni to'ldirish",
    icon: ArrowUpCircle,
    badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amountClass: "text-emerald-700",
    iconClass: "text-emerald-500",
    sign: "+",
  },
  payment: {
    label: "Kurs to'lovi",
    icon: BookOpen,
    badgeClass: "bg-red-50 text-red-600 ring-red-200",
    amountClass: "text-red-600",
    iconClass: "text-red-400",
    sign: "−",
  },
};

function getTypeMeta(type) {
  return (
    TYPE_META[type] ?? {
      label: type,
      icon: Clock,
      badgeClass: "bg-gray-100 text-gray-600 ring-gray-200",
      amountClass: "text-gray-700",
      iconClass: "text-gray-400",
      sign: "",
    }
  );
}

function SummaryCard({ label, amount, color }) {
  return (
    <div className={`flex flex-col gap-1 rounded-2xl bg-white p-5 shadow-sm ring-1 ${color}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-damiun-muted">{label}</p>
      <p className="text-2xl font-bold text-damiun-wordmark">{formatMoney(amount)}</p>
    </div>
  );
}

export function StudentTransactionsPage() {
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

  const totalTopup = useMemo(
    () => transactions.filter((t) => t.type === "topup").reduce((s, t) => s + t.amount, 0),
    [transactions],
  );
  const totalSpent = useMemo(
    () => transactions.filter((t) => t.type === "payment").reduce((s, t) => s + Math.abs(t.amount), 0),
    [transactions],
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-damiun-wordmark">Transactions</h1>
        <p className="mt-1 text-sm text-damiun-muted">
          To'lovlar va hisobni to'ldirish tarixi.
        </p>
      </div>

      {!loading && transactions.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <SummaryCard label="Jami to'ldirilgan" amount={totalTopup} color="ring-emerald-100" />
          <SummaryCard label="Jami sarflangan" amount={totalSpent} color="ring-red-100" />
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
            {transactions.map((tx) => {
              const meta = getTypeMeta(tx.type);
              const Icon = meta.icon;
              return (
                <li key={tx.id} className="flex items-center gap-4 px-5 py-4">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-50 ${meta.iconClass}`}
                  >
                    <Icon size={20} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-damiun-muted">
                      {tx.courseTitle ?? (tx.type === "topup" ? "Balans to'ldirish" : "—")}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className={`text-base font-bold ${meta.amountClass}`}>
                      {meta.sign}{formatMoney(tx.amount)}
                    </p>
                    <p className="mt-0.5 text-xs text-damiun-muted">{formatDate(tx.createdAt)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {total > pageSize && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-damiun-muted">
          <span>
            Sahifa {page} / {totalPages} ({total} ta)
          </span>
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
