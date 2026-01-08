import { notFound } from "next/navigation"
import { communities } from "@/lib/mock-communities"
import { mockUser } from "@/lib/mock-user"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Props = {
  params: Promise<{ slug: string }>
}

export default async function RequestsPage({ params }: Props) {
  const { slug } = await params
  const community = communities.find((c) => c.slug === slug)

  if (!community) notFound()

  const isModerator =
    mockUser.moderatedCommunities.includes(slug)

  if (!isModerator) notFound()

  const requests = community.joinRequests ?? []

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        Join Requests
      </h2>

      {requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No pending join requests.
        </p>
      ) : (
        requests.map((req) => (
          <Card key={req.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">{req.name}</p>
                <p className="text-sm text-muted-foreground">
                  Requested {req.requestedAt}
                </p>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  Reject
                </Button>
                <Button size="sm">
                  Accept
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
