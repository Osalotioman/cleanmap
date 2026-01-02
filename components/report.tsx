import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report Waste Issue | WasteWatch",
  description: "Report a waste management issue in your community",
};

export default function ReportPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-black dark:text-zinc-50">
          Report Waste Issue
        </h1>
        
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6">
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Report form will be implemented here with:
          </p>
          <ul className="list-disc list-inside space-y-2 text-zinc-600 dark:text-zinc-400">
            <li>Issue type selector (overflowing bin, illegal dump, etc.)</li>
            <li>Location picker (map or auto-detect)</li>
            <li>Photo upload</li>
            <li>Optional description</li>
            <li>Submit button</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
