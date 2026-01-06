import Link from "next/link"
import { communities } from "@/lib/mock-communities"
import { mockUser } from "@/lib/mock-user"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function MyCommunitiesPage() {
  const joined = communities.filter((c) =>
    mockUser.joinedCommunities.includes(c.slug)
  )

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Communities</h1>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/volunteer/communities">
              Join New Community
            </Link>
          </Button>

          <Button asChild>
            <Link href="/volunteer/communities/create">
              Create Community
            </Link>
          </Button>
        </div>
      </div>

      {joined.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You have not joined any communities yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {joined.map((c) => (
            <Card key={c.slug}>
              <CardHeader>
                <CardTitle>{c.name}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {c.location}
                </p>

                <Button asChild size="sm">
                  <Link href={`/volunteer/my-communities/${c.slug}`}>
                    Open community
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
