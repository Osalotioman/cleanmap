import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function ReportPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-bold">Report a Waste Issue</h1>
      <p className="mt-2 text-muted-foreground">
        No account required. Just tell us what you see.
      </p>

      <form className="mt-8 space-y-6">
        <div>
          <label className="text-sm font-medium">Issue Title</label>
          <Input placeholder="Overflowing trash, illegal dumping..." />
        </div>

        <div>
          <label className="text-sm font-medium">Description</label>
          <Textarea
            placeholder="Describe the issue and why it needs attention"
            rows={4}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Location</label>
          <Input placeholder="Street name or landmark" />
        </div>

        <Button type="submit" className="w-full">
          Submit Report
        </Button>
      </form>
    </main>
  )
}
