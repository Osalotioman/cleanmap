"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function CommunityIssuesPage() {
  const issues = [
    {
      id: 1,
      title: "Overflowing trash",
      status: "Unclaimed",
    },
  ]

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 space-y-6">
      <h1 className="text-2xl font-bold">Community Issues</h1>

      {issues.map((issue) => (
        <Card key={issue.id}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              {issue.title}
              <Badge>{issue.status}</Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex justify-end">
            {issue.status === "Unclaimed" && (
              <Button size="sm">Claim issue</Button>
            )}
          </CardContent>
        </Card>
      ))}
    </main>
  )
}
