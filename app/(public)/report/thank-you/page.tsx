import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ThankYouPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Thank You 🙌</h1>
      <p className="mt-4 text-muted-foreground">
        Your report has been submitted. Volunteers and cleanup teams will review
        it shortly.
      </p>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/volunteer">Become a Volunteer</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </main>
  )
}
