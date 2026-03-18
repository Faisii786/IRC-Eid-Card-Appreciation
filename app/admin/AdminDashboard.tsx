"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type Row = {
  timestamp: string;
  name: string;
  email: string;
  arabicName: string;
  language: string;
  requestId: string;
};

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function isToday(value: string) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function exportToCsv(rows: Row[]) {
  const headers = ["Time", "Name", "Email", "Arabic Name", "Language", "Request ID"];
  const csvRows = [
    headers.join(","),
    ...rows.map((r) =>
      [r.timestamp, r.name, r.email, r.arabicName, r.language, r.requestId]
        .map((v) => `"${(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    ),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `eid-cards-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminDashboard({ rows }: { rows: Row[] }) {
  const [search, setSearch] = useState("");
  const [langFilter, setLangFilter] = useState<"all" | "ar" | "en">("all");
  const router = useRouter();

  const stats = useMemo(() => {
    const total = rows.length;
    const today = rows.filter((r) => isToday(r.timestamp)).length;
    const uniqueEmails = new Set(rows.map((r) => r.email.toLowerCase()).filter(Boolean)).size;
    const arabic = rows.filter((r) => r.language === "ar").length;
    const english = rows.filter((r) => r.language === "en").length;
    return { total, today, uniqueEmails, arabic, english };
  }, [rows]);

  const filtered = useMemo(() => {
    let result = rows;
    if (langFilter !== "all") {
      result = result.filter((r) => r.language === langFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.arabicName.includes(q)
      );
    }
    return result;
  }, [rows, search, langFilter]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-blue-100/70 text-sm">Eid card generation overview</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.refresh()}
            className="px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-colors cursor-pointer text-sm"
          >
            Refresh
          </button>
          <form action="/api/admin/logout" method="post">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white hover:bg-white/20 transition-colors cursor-pointer text-sm"
            >
              Logout
            </button>
          </form>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-white/15 bg-white/5 p-4">
          <p className="text-blue-100/60 text-xs uppercase tracking-wide mb-1">Total Cards</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/5 p-4">
          <p className="text-blue-100/60 text-xs uppercase tracking-wide mb-1">Today</p>
          <p className="text-2xl font-bold text-white">{stats.today}</p>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/5 p-4">
          <p className="text-blue-100/60 text-xs uppercase tracking-wide mb-1">Unique Emails</p>
          <p className="text-2xl font-bold text-white">{stats.uniqueEmails}</p>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/5 p-4">
          <p className="text-blue-100/60 text-xs uppercase tracking-wide mb-1">Language Split</p>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-white">{stats.arabic} <span className="text-xs font-normal text-blue-100/60">AR</span></span>
            <span className="text-blue-100/30">/</span>
            <span className="text-lg font-bold text-white">{stats.english} <span className="text-xs font-normal text-blue-100/60">EN</span></span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/50"
        />
        <select
          value={langFilter}
          onChange={(e) => setLangFilter(e.target.value as "all" | "ar" | "en")}
          className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/50 cursor-pointer"
        >
          <option value="all" className="bg-[#0a1e33]">All Languages</option>
          <option value="ar" className="bg-[#0a1e33]">Arabic</option>
          <option value="en" className="bg-[#0a1e33]">English</option>
        </select>
        <button
          onClick={() => exportToCsv(filtered)}
          className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition-colors cursor-pointer"
        >
          Export CSV
        </button>
        <span className="text-blue-100/50 text-sm">
          {filtered.length === rows.length
            ? `${rows.length} records`
            : `${filtered.length} of ${rows.length} records`}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/20 bg-white/5">
        <table className="w-full min-w-[860px] text-sm text-left text-blue-50">
          <thead className="bg-white/10 text-blue-100">
            <tr>
              <th className="px-3 py-2.5">#</th>
              <th className="px-3 py-2.5">Time</th>
              <th className="px-3 py-2.5">Name</th>
              <th className="px-3 py-2.5">Email</th>
              <th className="px-3 py-2.5">Arabic Name</th>
              <th className="px-3 py-2.5">Language</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-blue-100/60 text-center" colSpan={6}>
                  {search || langFilter !== "all"
                    ? "No matching records found."
                    : "No responses yet, or Google Sheets is not configured."}
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr
                  key={row.requestId || `${row.timestamp}-${row.email}`}
                  className="border-t border-white/10 hover:bg-white/5 transition-colors"
                >
                  <td className="px-3 py-2 text-blue-100/40 tabular-nums">{i + 1}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(row.timestamp)}</td>
                  <td className="px-3 py-2">{row.name || "-"}</td>
                  <td className="px-3 py-2">{row.email || "-"}</td>
                  <td className="px-3 py-2" dir="rtl">{row.arabicName || "-"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.language === "ar"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      }`}
                    >
                      {row.language === "ar" ? "AR" : "EN"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
