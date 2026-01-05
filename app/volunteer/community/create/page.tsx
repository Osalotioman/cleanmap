"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CreateCommunityPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Create a Community</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              Community Name <span className="text-muted-foreground">(include location)</span>
            </label>
            <Input placeholder="Luckyway Branch 1" />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea placeholder="What is this community about?" />
          </div>

          <div>
            <label className="text-sm font-medium">Guidelines</label>
            <Textarea placeholder="Basic rules and expectations (optional)" />
          </div>

          <Button className="w-full">Create Community</Button>
        </CardContent>
      </Card>
    </main>
  )
}
