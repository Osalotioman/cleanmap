"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CommunityGuidelinesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Community Guidelines</CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
          <p>• Be respectful</p>
          <p>• Participate in cleanups and discussions</p>
          <p>• No spam or false reports</p>
        </CardContent>
      </Card>
    </main>
  )
}
