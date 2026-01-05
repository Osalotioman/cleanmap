"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CommunityDiscussionsPage() {
  const discussions = []

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Discussions</h1>
        <Button asChild>
          <Link href="discussions/new">Start discussion</Link>
        </Button>
      </div>

      {discussions.length === 0 ? (
        <p className="text-muted-foreground">
          No discussions yet. Start the conversation.
        </p>
      ) : (
        discussions.map((d) => (
          <Card key={d.id}>
            <CardHeader>
              <CardTitle>{d.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Started by {d.author}
              </p>
            </CardContent>
          </Card>
        ))
      )}
    </main>
  )
}
