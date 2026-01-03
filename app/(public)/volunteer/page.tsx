import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function VolunteerPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">Become a Volunteer</h1>
      <p className="mt-4 text-muted-foreground">
        Help keep your community clean by reviewing reports and organizing
        cleanups.
      </p>

      <ul className="mt-6 list-disc pl-6 text-muted-foreground">
        <li>Verify reported issues</li>
        <li>Coordinate cleanup activities</li>
        <li>Track environmental impact</li>
      </ul>

      <Button asChild className="mt-8">
        <Link href="/login">Sign Up / Sign In</Link>
      </Button>
    </main>
  )
}
