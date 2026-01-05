"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function CommunityMembersPage() {
  const members = [
    { name: "You", role: "Moderator" },
    { name: "Jane", role: "Member" },
  ]

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 space-y-6">
      <h1 className="text-2xl font-bold">Members</h1>

      {members.map((m, i) => (
        <Card key={i}>
          <CardContent className="flex justify-between items-center py-4">
            <div>
              <p className="font-medium">{m.name}</p>
              <Badge variant="secondary">{m.role}</Badge>
            </div>

            {m.role === "Member" && (
              <Button size="sm" variant="destructive">
                Remove
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </main>
  )
}
