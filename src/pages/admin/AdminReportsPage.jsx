import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "../../api/endpoints";
import { useLms } from "../../data/LmsContext";
import { formatDate } from "../../utils/format";

const TABS = [
  { id: "enrollments", label: "Enrollments" },
  { id: "revenue", label: "Revenue" },
  { id: "students", label: "Students" },
  { id: "progress", label: "Progress" },
  { id: "quiz", label: "Quiz" },
  { id: "certificates", label: "Certificates" },
  { id: "instructors", label: "Instructors" },
  { id: "reviews", label: "Reviews" },
];

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 90);
  return {
    period_start: start.toISOString().slice(0, 10),
    period_end: end.toISOString().slice(0, 10),
  };
}

function humanizeKey(key) {
  return String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function escapeCsvCell(value) {
  const s = value == null ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(rows) {
  if (!rows?.length) return "";
  const keys = Object.keys(rows[0]);
  const header = keys.map(escapeCsvCell).join(",");
  const lines = rows.map((row) => keys.map((k) => escapeCsvCell(row[k])).join(","));
  return `${header}\n${lines.join("\n")}`;
}

function downloadCsv(filename, csvText) {
  if (!csvText) return;
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatCell(key, value) {
  if (value == null || value === "") return "—";
  const k = key.toLowerCase();
  if (
    /(issued_at|submitted_at|date)$/.test(k) ||
    k === "issued_at" ||
    k === "submitted_at" ||
    k === "date"
  ) {
    if (typeof value === "string") {
      try {
        return formatDate(value);
      } catch {
        return value;
      }
    }
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function AdminReportsPage() {
  const { getToken } = useLms();
  const [tab, setTab] = useState("enrollments");
  const [range, setRange] = useState(() => defaultRange());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) throw new Error("Not signed in");
    return adminApi.getReports(
      {
        report_type: tab,
        period_start: range.period_start,
        period_end: range.period_end,
      },
      { token },
    );
  }, [getToken, tab, range.period_start, range.period_end]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await load();
        if (!cancelled) setRows(Array.isArray(data?.rows) ? data.rows : []);
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setError(e instanceof Error ? e.message : "Failed to load report");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const columns = useMemo(() => {
    if (!rows.length) return [];
    return Object.keys(rows[0]);
  }, [rows]);

  const revenueTotals = useMemo(() => {
    if (tab !== "revenue" || !rows.length) return null;
    let total = 0;
    let netSum = 0;
    for (const r of rows) {
      total += Number(r.amount ?? 0) || 0;
      netSum += Number(r.net ?? 0) || 0;
    }
    return { total, netSum };
  }, [tab, rows]);

  const quizOverview = useMemo(() => {
    if (tab !== "quiz" || !rows.length) return null;
    let sum = 0;
    for (const r of rows) sum += Number(r.score ?? 0) || 0;
    return { attempts: rows.length, averageScore: Math.round(sum / rows.length) };
  }, [tab, rows]);

  const exportCurrent = () => {
    const csv = rowsToCsv(rows);
    downloadCsv(`report-${tab}.csv`, csv);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-damiun-wordmark">Reports</h1>
          <p className="mt-1 text-sm text-damiun-muted">
            Data from <code className="text-xs">get_reports</code>. Adjust the date range and tab to
            refresh.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-damiun-wordmark shadow-sm transition hover:border-damiun-primary/40 hover:bg-damiun-nav-tint"
            onClick={exportCurrent}
            disabled={!rows.length}
          >
            Export current CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-gray-50">
        <label className="text-sm font-semibold text-damiun-wordmark">
          From
          <input
            type="date"
            value={range.period_start}
            onChange={(e) => setRange((r) => ({ ...r, period_start: e.target.value }))}
            className="mt-1 block rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm font-semibold text-damiun-wordmark">
          To
          <input
            type="date"
            value={range.period_end}
            onChange={(e) => setRange((r) => ({ ...r, period_end: e.target.value }))}
            className="mt-1 block rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </label>
        {loading ? <span className="pb-2 text-xs text-damiun-muted">Loading…</span> : null}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === t.id
                ? "bg-damiun-primary text-white shadow-sm"
                : "bg-white text-damiun-muted shadow-sm ring-1 ring-gray-100 hover:text-damiun-wordmark"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "revenue" && revenueTotals && (
        <div className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
            <p className="text-xs font-bold uppercase text-damiun-muted">Total revenue</p>
            <p className="mt-2 text-2xl font-bold text-damiun-wordmark">
              {new Intl.NumberFormat("uz-UZ").format(revenueTotals.total)} so&apos;m
            </p>
          </article>
          <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
            <p className="text-xs font-bold uppercase text-damiun-muted">Rows</p>
            <p className="mt-2 text-2xl font-bold text-damiun-wordmark">{rows.length}</p>
          </article>
          <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
            <p className="text-xs font-bold uppercase text-damiun-muted">Net (sum)</p>
            <p className="mt-2 text-2xl font-bold text-damiun-wordmark">
              {new Intl.NumberFormat("uz-UZ").format(revenueTotals.netSum)} so&apos;m
            </p>
          </article>
        </div>
      )}

      {tab === "quiz" && quizOverview && (
        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
          <h3 className="text-lg font-semibold text-damiun-wordmark">Quiz overview</h3>
          <p className="mt-2 text-sm text-damiun-muted">Total attempts: {quizOverview.attempts}</p>
          <p className="mt-1 text-sm text-damiun-muted">Average score: {quizOverview.averageScore}%</p>
        </article>
      )}

      <article className="overflow-x-auto rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ring-1 ring-gray-50">
        <h3 className="text-lg font-semibold text-damiun-wordmark capitalize">{tab.replace(/-/g, " ")}</h3>
        {!columns.length ? (
          <p className="mt-4 text-sm text-damiun-muted">{loading ? "Loading…" : "No rows in range."}</p>
        ) : (
          <table className="data-table mt-3">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col}>{humanizeKey(col)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col}>{formatCell(col, row[col])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>
    </div>
  );
}
