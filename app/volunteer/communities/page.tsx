"use client"

import { useMemo, useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type StatusFilter = "all" | "active" | "inactive"

export default function CommunitiesPage() {
  const [location, setLocation] = useState("all")
  const [status, setStatus] = useState<StatusFilter>("active")

  const locations = useMemo(
    () => Array.from(new Set(communities.map((c) => c.location))),
    []
  )

  const filtered = communities.filter((c) => {
    const locationMatch = location === "all" || c.location === location
    const statusMatch =
      status === "all" ||
      (status === "active" && c.active) ||
      (status === "inactive" && !c.active)

    return locationMatch && statusMatch
  })

  return (
    <main className="mx-auto max-w-5xl px-4 py-16 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Discover Communities</h1>

        <Button asChild variant="outline">
          <Link href="/volunteer/my-communities">
            My Communities
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc} value={loc}>
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={(v) => setStatus(v as StatusFilter)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((c) => {
          const joined = mockUser.joinedCommunities.includes(c.slug)

          return (
            <Card key={c.slug}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {c.name}
                  {joined && <Badge>Joined</Badge>}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {c.location} • {c.coverage}
                </p>

                <p className="text-sm">
                  {c.members} members • {c.issuesHandled} issues handled
                </p>

                <Button asChild size="sm">
                  <Link
                    href={
                      joined
                        ? `/volunteer/my-communities/${c.slug}`
                        : `/volunteer/communities/${c.slug}`
                    }
                  >
                    {joined ? "Open community" : "View community"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </main>
  )
}
