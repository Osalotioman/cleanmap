import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"

type Props = {
  params: Promise<{ slug: string }>
}

type Member = {
  volunteerId: string
  joinedAt: string | Date
  volunteer: {
    id: string
    name: string
    email: string
  }
}

export default async function RequestsPage({ params }: Props) {
  const { slug } = await params

  // In Option A (instant join), there are no join requests.
  // We reuse this route as a "Members" view.
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/communities/${slug}/members`,
    { cache: "no-store" }
  )

  if (!res.ok) notFound()

  const data = (await res.json()) as { data?: { members?: Member[] } }
  const members = data.data?.members ?? []

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Members</h2>

      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">No members found.</p>
      ) : (
        members.map((m) => (
          <Card key={m.volunteerId}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">{m.volunteer.name}</p>
                <p className="text-sm text-muted-foreground">{m.volunteer.email}</p>
              </div>

              <p className="text-xs text-muted-foreground">
                Joined {new Date(m.joinedAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
