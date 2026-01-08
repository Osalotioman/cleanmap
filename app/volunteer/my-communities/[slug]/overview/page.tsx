import { communities } from "@/lib/mock-communities"
import { mockUser } from "@/lib/mock-user"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Props = {
  params: Promise<{ slug: string }>
}

export default async function OverviewPage({ params }: Props) {
  const { slug } = await params
  const community = communities.find((c) => c.slug === slug)

  if (!community) notFound()

  return (
    <div className="space-y-6">
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

      {/* Danger zone */}
      <div className="border-t pt-6">
        <Button variant="destructive">
          Leave community
        </Button>
      </div>
    </div>
  )
}
