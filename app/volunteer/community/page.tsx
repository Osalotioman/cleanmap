"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

const communities = [
  {
    name: "Luckyway Branch 1",
    slug: "luckyway-branch-1",
    location: "Luckyway",
    members: 12,
    active: true,
  },
]

export default function CommunitiesPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Communities Near You</h1>
        <Button asChild>
          <Link href="/communities/create">Create Community</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nearby">Nearby</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Sort by activity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Most active</SelectItem>
            <SelectItem value="new">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Community list */}
      <div className="grid gap-4 sm:grid-cols-2">
        {communities.map((c) => (
          <Card key={c.slug}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {c.name}
                {c.active && <Badge>Active</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{c.location}</p>
              <p className="text-sm">{c.members} members</p>
              <Button asChild size="sm">
                <Link href={`/communities/${c.slug}`}>View community</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
