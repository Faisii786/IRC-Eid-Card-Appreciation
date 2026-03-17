import { cookies } from "next/headers";
import AdminLogin from "./AdminLogin";
import { readGenerationRecords } from "@/lib/googleSheets";

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default async function AdminPage() {
  const adminPassword = process.env.ADMIN_PANEL_PASSWORD;
  if (!adminPassword) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg rounded-xl border border-amber-300/40 bg-amber-50 text-amber-900 p-5">
          Set <code>ADMIN_PANEL_PASSWORD</code> in your environment to enable admin access.
        </div>
      </main>
    );
  }

  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("admin_auth")?.value === adminPassword;

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <AdminLogin />
      </main>
    );
  }

  const rows = await readGenerationRecords(1000);

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Responses</h1>
            <p className="text-blue-100/90 text-sm">Recent users who generated an Eid card</p>
          </div>
          <form action="/api/admin/logout" method="post">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/30 text-white hover:bg-white/20"
            >
              Logout
            </button>
          </form>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/20 bg-white/5">
          <table className="w-full min-w-[860px] text-sm text-left text-blue-50">
            <thead className="bg-white/10 text-blue-100">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Arabic Name</th>
                <th className="px-3 py-2">Language</th>
                <th className="px-3 py-2">Request ID</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-blue-100/80" colSpan={6}>
                    No responses yet, or Google Sheets is not configured.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.requestId || `${row.timestamp}-${row.email}`} className="border-t border-white/10">
                    <td className="px-3 py-2">{formatDate(row.timestamp)}</td>
                    <td className="px-3 py-2">{row.name || "-"}</td>
                    <td className="px-3 py-2">{row.email || "-"}</td>
                    <td className="px-3 py-2" dir="rtl">
                      {row.arabicName || "-"}
                    </td>
                    <td className="px-3 py-2">{row.language || "-"}</td>
                    <td className="px-3 py-2 font-mono text-xs">{row.requestId || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
