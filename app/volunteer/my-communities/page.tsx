"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { CreateCommunityForm } from "@/components/create-community-form"

type MyGeoCommunity = {
  id: string
  name: string
  state: string
  radius: number
  isMember?: boolean
}

export default function MyCommunitiesPage() {
  const [communities, setCommunities] = useState<MyGeoCommunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    const fetchMyCommunities = async () => {
      try {
        setLoading(true)
        setError(null)

  const response = await fetch("/api/communities/list")
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch communities")
        }

        // The geo schema list endpoint already includes membership status for the current user.
        const myCommunities = (data.data.communities as MyGeoCommunity[]).filter(
          (c) => Boolean(c.isMember)
        )
        setCommunities(myCommunities)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load communities"
        setError(message)
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    fetchMyCommunities()
  }, [])

  const handleCreateSuccess = () => {
    setShowCreateDialog(false)
    toast.success("Community created successfully! Refreshing...")
    // Refresh the communities list
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Communities</h1>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/volunteer/communities">
              Join New Community
            </Link>
          </Button>

          <Button onClick={() => setShowCreateDialog(true)}>
            Create Community
          </Button>
        </div>
      </div>

      {/* Create Community Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create a New Community</DialogTitle>
            <DialogDescription>
              Start a community to coordinate cleanup efforts and engage volunteers.
            </DialogDescription>
          </DialogHeader>
          <CreateCommunityForm onSuccess={handleCreateSuccess} />
        </DialogContent>
      </Dialog>

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
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground">
            You have not joined any communities yet.
          </p>
          <Button asChild>
            <Link href="/volunteer/communities">
              Discover Communities
            </Link>
          </Button>
        </div>
      )}

      {/* Communities List */}
      {!loading && !error && communities.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {communities.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="line-clamp-2">{c.name}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {c.state} • {Math.round((c.radius ?? 0) / 1000)}km radius
                  </p>
                </div>

                <Button asChild size="sm" className="w-full">
                  <Link href={`/volunteer/my-communities/${c.id}`}>
                    Open community
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
