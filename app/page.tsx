import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-4xl flex-col items-center gap-12 py-16 px-8 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-black dark:text-zinc-50">
            CleanMap
          </h1>
          <p className="max-w-2xl text-xl leading-8 text-zinc-600 dark:text-zinc-400">
            Report, track, and monitor waste management issues in your community in real-time.
            Together, we can make our neighborhoods cleaner.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <Link 
            href="/report"
            className="flex flex-col items-center gap-4 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
          >
            <div className="text-4xl">📝</div>
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50">Report Issue</h3>
            <p className="text-sm text-center text-zinc-600 dark:text-zinc-400">
              Submit a waste management issue in your area
            </p>
          </Link>

          <Link 
            href="/map"
            className="flex flex-col items-center gap-4 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
          >
            <div className="text-4xl">🗺️</div>
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50">View Map</h3>
            <p className="text-sm text-center text-zinc-600 dark:text-zinc-400">
              See all reported issues on an interactive map
            </p>
          </Link>

          <Link 
            href="/dashboard"
            className="flex flex-col items-center gap-4 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
          >
            <div className="text-4xl">📊</div>
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50">Dashboard</h3>
            <p className="text-sm text-center text-zinc-600 dark:text-zinc-400">
              Track community impact and manage reports
            </p>
          </Link>
        </div>

        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <Link
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-foreground px-8 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            href="/report"
          >
            Get Started
          </Link>
          <Link
            className="flex h-12 items-center justify-center rounded-full border border-solid border-black/[.08] px-8 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
            href="/map"
          >
            View Map
          </Link>
        </div>
      </main>
    </div>
  );
}
