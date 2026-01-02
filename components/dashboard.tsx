import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | WasteWatch",
  description: "Manage waste reports and track community impact",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-black dark:text-zinc-50">
          Volunteer/Admin Dashboard
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Stats Cards */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Reports</h3>
            <p className="text-3xl font-bold mt-2 text-black dark:text-zinc-50">--</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Pending</h3>
            <p className="text-3xl font-bold mt-2 text-red-600">--</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Cleaned</h3>
            <p className="text-3xl font-bold mt-2 text-green-600">--</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">
            Recent Reports
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Dashboard features to implement:
          </p>
          <ul className="list-disc list-inside space-y-2 text-zinc-600 dark:text-zinc-400">
            <li>List of all reports with filters (status, type, date)</li>
            <li>Update report status (Reported → Acknowledged → Cleaned)</li>
            <li>View report details and location</li>
            <li>Community leaderboard (optional)</li>
            <li>Weekly cleanliness score (optional)</li>
            <li>Export reports for authorities</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
