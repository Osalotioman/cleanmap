import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function IssuesPage() {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="font-medium">Overflowing trash bin</p>
            <p className="text-sm text-muted-foreground">
              Reported 2 days ago
            </p>
          </div>
          <Badge>In Progress</Badge>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        More issues will appear here.
      </p>
    </div>
  )
}
