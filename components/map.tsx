import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Map View | WasteWatch",
  description: "View all reported waste issues on the map",
};

export default function MapPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-black dark:text-zinc-50">
          Waste Issues Map
        </h1>
        
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 min-h-[600px]">
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Interactive map will be implemented here using Leaflet.js:
          </p>
          <ul className="list-disc list-inside space-y-2 text-zinc-600 dark:text-zinc-400">
            <li>Display all waste reports as map markers</li>
            <li>Color-coded by status (red=reported, yellow=acknowledged, green=cleaned)</li>
            <li>Click marker to view report details</li>
            <li>Filter by status, type, or date range</li>
            <li>Optional: Heatmap layer for hotspots</li>
          </ul>
          
          <div className="mt-6 p-4 bg-zinc-100 dark:bg-zinc-800 rounded">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              💡 Note: This component requires <code className="bg-zinc-200 dark:bg-zinc-700 px-2 py-1 rounded">&quot;use client&quot;</code> directive
              for Leaflet.js client-side rendering
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
