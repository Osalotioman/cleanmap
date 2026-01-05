"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function CommunityPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Luckyway Branch 1</h1>
        <div className="flex gap-2">
          <Badge>Luckyway</Badge>
          <Badge variant="secondary">Active</Badge>
        </div>
        <Button>Join community</Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="space-y-2 py-4">
              <p>
                Community focused on keeping Luckyway clean and reporting waste issues.
              </p>
              <p className="text-sm text-muted-foreground">
                Online discussions once a week
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discussions">
          <p className="text-sm text-muted-foreground">
            No discussions yet. Be the first to start one.
          </p>
        </TabsContent>

        <TabsContent value="issues">
          <p className="text-sm text-muted-foreground">
            No issues claimed by this community yet.
          </p>
        </TabsContent>

        <TabsContent value="members">
          <p className="text-sm text-muted-foreground">
            1 moderator • 3 members
          </p>
        </TabsContent>
      </Tabs>
    </main>
  )
}
