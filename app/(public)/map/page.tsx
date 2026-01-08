"use client"

import { useState, useEffect } from "react"
import { MapViewer } from "@/components/map-viewer"
import { useLocation } from "@/lib/hooks/use-location"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface PublicReport {
  id: string
  latitude: number
  longitude: number
  description?: string | null
  status: string
}

export default function PublicMapPage() {
  const location = useLocation()
  const [reports, setReports] = useState<PublicReport[]>([])
  const [loadingReports, setLoadingReports] = useState(true)

  useEffect(() => {
    if (location.latitude && location.longitude) {
      async function fetchPublicReports() {
        try {
          const res = await fetch(
            `/api/reports/public?lat=${location.latitude}&lon=${location.longitude}&radius=10000` // 10km radius
          )
          if (!res.ok) {
            throw new Error("Failed to fetch reports.")
          }
          const data = await res.json()
          setReports(data.data.reports)
        } catch (error) {
          console.error(error)
        } finally {
          setLoadingReports(false)
        }
      }
      fetchPublicReports()
    }
  }, [location.latitude, location.longitude])

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold">Public Reports Map</h1>
        <p className="text-muted-foreground">
          Showing pending and scheduled cleanups in your area.
        </p>
      </div>

      {location.loading && (
        <Card className="flex h-96 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Detecting your location to show nearby reports...</p>
          </div>
        </Card>
      )}

      {location.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {location.error}. Please enable location services to view the map.
          </AlertDescription>
        </Alert>
      )}

      {!location.loading && location.latitude && location.longitude && (
        <Card>
          <CardContent className="pt-6">
            {loadingReports ? (
              <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="h-[600px] w-full rounded-md border">
                <MapViewer
                  center={[location.latitude, location.longitude]}
                  reports={reports}
                  zoom={13}
                  height="100%"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  )
}
