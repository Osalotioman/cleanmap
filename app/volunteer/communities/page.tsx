"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
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
import { Input } from "@/components/ui/input"
import { Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

type GeoCommunityListItem = {
  id: string
  name: string
  state: string
  radius: number
  // optional, may not be returned depending on endpoint
  isMember?: boolean
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<GeoCommunityListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // With the current geo-circle schema, `state` is the main filterable location field.
  const [stateFilter, setStateFilter] = useState("all")
  const [search, setSearch] = useState("")
  
  const [joinLoading, setJoinLoading] = useState<string | null>(null)

  // Fetch communities
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
  if (stateFilter && stateFilter !== "all") params.append("state", stateFilter)
        if (search) params.append("search", search)

        const response = await fetch(`/api/communities/list?${params.toString()}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch communities")
        }

        setCommunities(data.data.communities as GeoCommunityListItem[])
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load communities"
        setError(message)
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    // Debounce search
    const timer = setTimeout(() => {
      fetchCommunities()
    }, 300)

    return () => clearTimeout(timer)
  }, [stateFilter, search])

  const uniqueLocations = useMemo(
    () => Array.from(new Set(communities.map((c) => c.state))).filter(Boolean).sort(),
    [communities]
  )

  const handleJoinCommunity = async (communityId: string) => {
    try {
      setJoinLoading(communityId)

      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to join community")
        return
      }

      toast.success("Joined community")

      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId
            ? {
                ...c,
                isMember: true,
              }
            : c
        )
      )
    } catch {
      toast.error("An error occurred while joining")
    } finally {
      setJoinLoading(null)
    }
  }

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

      {/* Search */}
      <Input
        placeholder="Search communities..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {uniqueLocations.map((loc) => (
              <SelectItem key={loc} value={loc}>
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>
            <p className="font-medium text-red-900">Error loading communities</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && communities.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No communities found. Try adjusting your filters.</p>
        </div>
      )}

      {/* Communities List */}
      {!loading && !error && communities.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {communities.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span className="line-clamp-2">{c.name}</span>
                  {c.isMember && <Badge>Joined</Badge>}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {c.state} • {Math.round((c.radius ?? 0) / 1000)}km radius
                  </p>
                </div>

                {c.isMember ? (
                  <Button asChild size="sm" className="w-full">
                    <Link href={`/volunteer/my-communities/${c.id}`}>
                      Open community
                    </Link>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleJoinCommunity(c.id)}
                    disabled={joinLoading === c.id}
                  >
                    {joinLoading === c.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      "Join community"
                    )}
                  </Button>
                )}

                <Button asChild variant="ghost" size="sm" className="w-full">
                  <Link href={`/volunteer/communities/${c.id}`}>
                    View details
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
