import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
      <section className="flex flex-col items-center justify-center gap-6 px-6 py-24 text-center">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Welcome to CleanMap
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Report waste issues in your community — fast, free, and without creating an account.
        </p>

        <div className="flex gap-4">
          <Link href="/report">
            <Button size="lg">Report an Issue</Button>
          </Link>

          <Link href="/volunteers">
            <Button size="lg" variant="outline">
              Become a Volunteer
            </Button>
          </Link>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="bg-muted/50 py-20 px-6">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Report Easily</CardTitle>
              <CardDescription>
                Submit waste issues anonymously with location and photos.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              No login required. Reports are instantly added to the system.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Community Driven</CardTitle>
              <CardDescription>
                Volunteers help clean up and track progress.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Join local volunteer groups and make a visible impact.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Real Impact</CardTitle>
              <CardDescription>
                Data helps organizations prioritize cleanup.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Waste authorities can monitor issues and respond efficiently.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t px-6 py-8 text-center text-sm text-muted-foreground">
        <p>
          CleanMap · Built for community-driven waste management
        </p>
      </footer>
    </div>
  )
}
