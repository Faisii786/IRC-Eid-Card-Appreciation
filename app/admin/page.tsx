import { cookies } from "next/headers";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import { readGenerationRecords } from "@/lib/googleSheets";

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
      <AdminDashboard rows={rows} />
    </main>
  );
}
