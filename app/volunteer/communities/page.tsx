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
import { CommunityWithStatus } from "@/types/community"

type StatusFilter = "all" | "active" | "inactive"
type CoverageFilter = "all" | "neighborhood" | "district" | "city"

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<CommunityWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [location, setLocation] = useState("")
  const [coverage, setCoverage] = useState<CoverageFilter>("all")
  const [search, setSearch] = useState("")
  
  const [joinRequestLoading, setJoinRequestLoading] = useState<string | null>(null)

  // Fetch communities
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        if (location) params.append("location", location)
        if (coverage !== "all") params.append("coverageType", coverage)
        if (search) params.append("search", search)

        const response = await fetch(`/api/community/list?${params.toString()}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch communities")
        }

        setCommunities(data.data.communities)
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
  }, [location, coverage, search])

  const uniqueLocations = useMemo(
    () => Array.from(new Set(communities.map((c) => c.location))).sort(),
    [communities]
  )

  const handleJoinRequest = async (communityId: string) => {
    try {
      setJoinRequestLoading(communityId)

      const response = await fetch("/api/community/join-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ communityId }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to send join request")
        return
      }

      toast.success("Join request sent! Awaiting response from moderators.")

      // Update community status in list
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId
            ? {
                ...c,
                hasJoinRequest: true,
                joinRequestStatus: "pending",
                userJoinRequest: data.data.joinRequest,
              }
            : c
        )
      )
    } catch (err) {
      toast.error("An error occurred while sending join request")
    } finally {
      setJoinRequestLoading(null)
    }
  }

  const handleCancelRequest = async (requestId: string, communityId: string) => {
    try {
      setJoinRequestLoading(communityId)

      const response = await fetch(`/api/community/join-request/${requestId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to cancel join request")
        return
      }

      toast.success("Join request cancelled")

      // Update community status in list
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId
            ? {
                ...c,
                hasJoinRequest: false,
                joinRequestStatus: null,
                userJoinRequest: null,
              }
            : c
        )
      )
    } catch (err) {
      toast.error("An error occurred while cancelling join request")
    } finally {
      setJoinRequestLoading(null)
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
        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All locations</SelectItem>
            {uniqueLocations.map((loc) => (
              <SelectItem key={loc} value={loc}>
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={coverage}
          onValueChange={(v) => setCoverage(v as CoverageFilter)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Coverage type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All coverage types</SelectItem>
            <SelectItem value="neighborhood">Neighborhood</SelectItem>
            <SelectItem value="district">District</SelectItem>
            <SelectItem value="city">City-wide</SelectItem>
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
                  {c.hasJoinRequest && <Badge variant="secondary">Pending</Badge>}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {c.location} • {c.coverageType}
                  </p>
                  {c.description && (
                    <p className="text-sm line-clamp-2">{c.description}</p>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">
                  {c.memberCount} member{c.memberCount !== 1 ? "s" : ""}
                </p>

                {c.isMember ? (
                  <Button asChild size="sm" className="w-full">
                    <Link href={`/volunteer/my-communities/${c.id}`}>
                      Open community
                    </Link>
                  </Button>
                ) : c.hasJoinRequest ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleCancelRequest(c.userJoinRequest!.id, c.id)}
                    disabled={joinRequestLoading === c.id}
                  >
                    {joinRequestLoading === c.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      "Cancel request"
                    )}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleJoinRequest(c.id)}
                    disabled={joinRequestLoading === c.id}
                  >
                    {joinRequestLoading === c.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send join request"
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
