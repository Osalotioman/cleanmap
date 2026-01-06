import { notFound } from "next/navigation"
import { communities } from "@/lib/mock-communities"
import { mockUser } from "@/lib/mock-user"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function CommunityPage({ params }: PageProps) {
  const { slug } = await params

  const community = communities.find((c) => c.slug === slug)
  if (!community) notFound()

  const isMember = mockUser.joinedCommunities.includes(slug)

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">{community.name}</h1>

        <div className="flex flex-wrap gap-2">
          <Badge>{community.location}</Badge>
          <Badge variant="outline">{community.coverage}</Badge>
          <Badge variant={community.active ? "default" : "secondary"}>
            {community.active ? "Active" : "Inactive"}
          </Badge>
        </div>

        {isMember ? (
          <Button asChild>
            <a href={`/volunteer/my-communities/${slug}`}>
              Open community
            </a>
          </Button>
        ) : (
          <Button>Request to join</Button>
        )}
      </div>

      {/* Overview */}
      <Card>
        <CardContent className="space-y-3 py-4">
          <p>{community.description}</p>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>👥 Members: {community.members}</p>
            <p>🧹 Issues handled: {community.issuesHandled}</p>
            <p>📍 Coverage: {community.coverage}</p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
