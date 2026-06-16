import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { profileApi } from "../api/endpoints";
import { useLms } from "../data/LmsContext";
import { formatPrice } from "../utils/format";

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

export function TopUpPage() {
  const { getToken } = useLms();
  const [balance, setBalance] = useState(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    profileApi.getBalance({ token }).then((data) => {
      setBalance(Number(data.balance ?? 0));
    }).catch(() => {});
  }, [getToken]);

  const handleTopUp = async (e) => {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value < 1000) {
      toast.error("Minimal summa 1,000 so'm");
      return;
    }
    const token = getToken();
    if (!token) return;
    setSubmitting(true);
    try {
      const data = await profileApi.topUpBalance({ amount: value }, { token });
      setBalance(Number(data.balance ?? balance + value));
      setAmount("");
      toast.success("Balans muvaffaqiyatli to'ldirildi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-damiun-wordmark">Balansni to'ldirish</h1>
        <p className="mt-1 text-sm text-damiun-muted">Hisobingizga pul qo'shing va kurslarni xarid qiling.</p>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-50">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-damiun-nav-tint">
          <Wallet className="h-6 w-6 text-damiun-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Joriy balans</p>
          <p className="text-2xl font-bold text-damiun-wordmark">
            {balance !== null ? formatPrice(balance) : "—"}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleTopUp}
        className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-gray-50"
      >
        <p className="text-sm font-semibold text-damiun-wordmark">Summa kiriting</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setAmount(String(q))}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                Number(amount) === q
                  ? "border-damiun-primary bg-damiun-nav-tint text-damiun-primary"
                  : "border-gray-200 bg-white text-damiun-muted hover:border-damiun-primary/40"
              }`}
            >
              {formatPrice(q)}
            </button>
          ))}
        </div>

        <input
          type="number"
          min="1000"
          step="1000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Boshqa summa..."
          className="mt-4 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-damiun-primary"
        />

        <button
          type="submit"
          disabled={submitting || !amount}
          className="mt-4 w-full rounded-full bg-damiun-primary py-3 text-sm font-semibold text-white shadow-sm hover:bg-damiun-primary-hover disabled:opacity-60"
        >
          {submitting ? "To'ldirilmoqda…" : "Balansni to'ldirish"}
        </button>
      </form>
    </div>
  );
}
