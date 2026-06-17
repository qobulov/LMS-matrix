import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpCircle,
  BookOpen,
  Clock,
  TrendingUp,
  User,
} from "lucide-react";
import { adminApi } from "../../api/endpoints";
import { useLms } from "../../data/LmsContext";

const TYPE_META = {
  payment: {
    label: "Kurs to'lovi",
    icon: BookOpen,
    badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amountClass: "text-emerald-700",
    iconBg: "bg-emerald-50 text-emerald-500",
    sign: "+",
  },
  topup: {
    label: "Hisobni to'ldirish",
    icon: ArrowUpCircle,
    badgeClass: "bg-gray-100 text-gray-600 ring-gray-200",
    amountClass: "text-gray-700",
    iconBg: "bg-gray-100 text-gray-400",
    sign: "",
  },
  payout: {
    label: "Payout",
    icon: TrendingUp,
    badgeClass: "bg-red-50 text-red-600 ring-red-200",
    amountClass: "text-red-600",
    iconBg: "bg-red-50 text-red-400",
    sign: "−",
  },
};

function getTypeMeta(type) {
  return (
    TYPE_META[type] ?? {
      label: type || "Boshqa",
      icon: Clock,
      badgeClass: "bg-gray-100 text-gray-600 ring-gray-200",
      amountClass: "text-gray-700",
      iconBg: "bg-gray-100 text-gray-400",
      sign: "",
    }
  );
}

function normalizeType(raw) {
  const s = String(raw ?? "").toLowerCase().trim();
  if (s === "topup" || s === "top_up" || s === "deposit") return "topup";
  if (s === "payment" || s === "purchase") return "payment";
  if (s === "payout") return "payout";
  return s || "other";
}

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
  const type = normalizeType(t.type);
  return {
    id: String(t.id ?? ""),
    type,
    amount: Math.abs(Number(t.amount ?? 0)),
    courseTitle: t.course_title ?? null,
    userName: t.user_name ?? null,
    userEmail: t.user_email ?? null,
    createdAt: t.created_at ?? "",
  };
}

const TYPES = ["all", "payment", "topup", "payout"];

const TYPE_FILTER_LABELS = {
  all: "Barchasi",
  payment: "To'lovlar",
  topup: "To'ldirishlar",
  payout: "Payoutlar",
};

function StatCard({ label, value, color }) {
  return (
    <div className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ${color}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-damiun-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-damiun-wordmark">{value}</p>
    </div>
  );
}

export function AdminTransactionsPage() {
  const { getToken } = useLms();
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [typeFilter, setTypeFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserSearch(userSearch.trim()), 350);
    return () => clearTimeout(t);
  }, [userSearch]);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, debouncedUserSearch]);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) throw new Error("Not signed in");
    const filters = { page, page_size: pageSize };
    if (typeFilter !== "all") filters.type = typeFilter;
    if (debouncedUserSearch) filters.search = debouncedUserSearch;
    return adminApi.getTransactions(filters, { token });
  }, [getToken, page, typeFilter, debouncedUserSearch]);

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

  const revenue = useMemo(
    () => transactions.filter((t) => t.type === "payment").reduce((s, t) => s + t.amount, 0),
    [transactions],
  );
  const payouts = useMemo(
    () => transactions.filter((t) => t.type === "payout").reduce((s, t) => s + t.amount, 0),
    [transactions],
  );
  const topups = useMemo(
    () => transactions.filter((t) => t.type === "topup").reduce((s, t) => s + t.amount, 0),
    [transactions],
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-damiun-wordmark">Transactions</h1>
        <p className="mt-1 text-sm text-damiun-muted">
          Barcha foydalanuvchilar bo'yicha moliyaviy tranzaksiyalar.
        </p>
      </div>

      {!loading && transactions.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Kurs to'lovlari (daromad)" value={`+${formatMoney(revenue)}`} color="ring-emerald-100" />
          <StatCard label="Payoutlar (chiqim)" value={`−${formatMoney(payouts)}`} color="ring-red-100" />
          <StatCard label="Hisobni to'ldirishlar" value={formatMoney(topups)} color="ring-gray-200" />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                typeFilter === t
                  ? "bg-damiun-primary text-white shadow-sm"
                  : "bg-white text-damiun-muted shadow-sm ring-1 ring-gray-100 hover:text-damiun-wordmark"
              }`}
            >
              {TYPE_FILTER_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="relative flex w-full max-w-xs items-center sm:w-64">
          <User size={14} className="absolute left-3.5 text-gray-400" />
          <input
            type="search"
            placeholder="Ism yoki email bo'yicha…"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full rounded-full border border-gray-200 py-2 pl-9 pr-4 text-sm shadow-sm outline-none focus:border-damiun-primary"
          />
        </div>
      </div>

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
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.iconBg}`}
                  >
                    <Icon size={18} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                      {tx.userName && (
                        <span className="flex items-center gap-1 text-xs text-damiun-muted">
                          <User size={11} />
                          {tx.userName}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-damiun-muted">
                      {tx.courseTitle ?? tx.userEmail ?? "—"}
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
