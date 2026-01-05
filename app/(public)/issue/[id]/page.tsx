"use client"

import { useState, useEffect, use } from "react"
import { MapViewer } from "@/components/map-viewer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, MapPin } from "lucide-react"
import Image from "next/image"

interface Report {
  id: string
  latitude: number
  longitude: number
  description?: string | null
  imageUrl?: string | null
  status: string
  createdAt: string
}

interface IssueProps {
  params: Promise<{ id: string }>
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-800" },
  cleaned: { label: "Cleaned", color: "bg-green-100 text-green-800" },
  disputed: { label: "Disputed", color: "bg-red-100 text-red-800" },
}

export default function IssueDetailsPage({ params }: IssueProps) {
  const { id } = use(params)
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    async function fetchReport() {
      try {
        const res = await fetch(`/api/reports/public/${id}`)
        if (!res.ok) {
          throw new Error("Report not found.")
        }
        const data = await res.json()
        setReport(data.data.report)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An error occurred.")
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Report not found."}</AlertDescription>
        </Alert>
      </main>
    )
  }

  const statusInfo =
    statusConfig[report.status] || statusConfig.pending

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 space-y-6">
      <Card>
        <CardHeader>
          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
          <CardTitle className="mt-2">Waste Report Status</CardTitle>
          <p className="text-sm text-muted-foreground">
            Reported on{" "}
            {new Date(report.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.description && (
            <p className="text-muted-foreground">{report.description}</p>
          )}

          {report.imageUrl && (
            <div className="relative h-64 w-full overflow-hidden rounded-md border">
              <Image
                src={report.imageUrl}
                alt="Report image"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 overflow-hidden rounded-md border">
            <MapViewer
              center={[report.latitude, report.longitude]}
              reports={[report]}
              zoom={15}
              height="100%"
            />
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
