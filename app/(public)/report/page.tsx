"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// Dynamically import MapPicker to avoid SSR issues with Leaflet
const MapPicker = dynamic(() => import("@/components/mappicker"), {
  ssr: false,
  loading: () => <div className="h-96 bg-muted animate-pulse rounded-md" />,
})

// Generate or retrieve device ID for rate limiting
function getDeviceId(): string {
  const key = 'cleanmap_device_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    localStorage.setItem(key, id)
  }
  return id
}

export default function ReportPage() {
  const router = useRouter()
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [coords, setCoords] = useState<[number, number] | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  // --- Image previews ---
  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file))
    setPreviews(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [images])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    setImages(Array.from(e.target.files))
  }

  const removeImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)
  }

  // --- Get GPS location on page load ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          setCoords([latitude, longitude])
        },
        (err) => console.warn("Geolocation denied:", err)
      )
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!images.length) return alert("Please add at least one photo.")
    if (!coords) return alert("Please select a location.")

    setSubmitting(true)

    try {
      let imageUrl: string | null = null

      // 1. Upload image if one exists
      if (images.length > 0) {
        const image = images[0]
        const formData = new FormData()
        formData.append("file", image)

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadRes.ok) {
          throw new Error("Failed to upload image.")
        }
        const uploadData = await uploadRes.json()
        imageUrl = uploadData.data.url
      }

      // 2. Get Device ID
      const deviceId = getDeviceId()

      // 3. Submit report
      const reportData = {
        latitude: coords[0],
        longitude: coords[1],
        description: `${title}${description ? ` - ${description}` : ''}`, // Combine title and description
        imageUrl,
        deviceId,
      }

      const reportRes = await fetch("/api/reports/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      })

      if (!reportRes.ok) {
        const errorData = await reportRes.json()
        throw new Error(errorData.error || "Failed to submit report.")
      }

      const newReport = await reportRes.json()
      const reportId = newReport.data.report.id

      // 4. Redirect to thank you page
      router.push(`/report/thank-you?id=${reportId}`)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred."
      alert(`Error: ${errorMessage}`)
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-bold">Report a Waste Issue</h1>
      <p className="mt-2 text-muted-foreground">
        No account required. Take a photo and submit the issue.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Title */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Issue Title</label>
          <Input
            name="title"
            placeholder="Overflowing trash, illegal dumping..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            name="description"
            placeholder="Optional details that may help volunteers or authorities"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Location</label>

          {/* Tooltip explaining location feature */}
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-xs text-muted-foreground underline cursor-help">
                How location works
              </p>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p>
                Your location is detected automatically via GPS. You can override it by
                clicking &quot;Choose location on map&quot; and selecting the correct spot. This
                ensures your report is accurate even if you moved after taking the photo.
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Show detected GPS coords */}
          <p className="text-xs text-muted-foreground mt-1">
            {coords
              ? `Detected location: ${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`
              : "No location detected"}
          </p>

          {/* Button to manually choose location */}
          <Button type="button" onClick={() => setShowMap(!showMap)}>
            {showMap ? "Hide Map" : "Choose location on map"}
          </Button>

          {/* Map component */}
          {showMap && <MapPicker location={coords} setLocation={setCoords} />}
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Photos <span className="text-muted-foreground">(required)</span>
          </label>
          <Input
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handleImageChange}
          />

          {/* Preview Grid */}
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {previews.map((src, i) => (
                <div key={i} className="relative">
                  <div className="relative h-24 w-24 overflow-hidden rounded-md border">
                    <Image
                      src={src}
                      alt={`preview-${i}`}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 rounded-full bg-black/70 text-white text-xs w-5 h-5 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Report"}
        </Button>
      </form>
    </main>
  )
}