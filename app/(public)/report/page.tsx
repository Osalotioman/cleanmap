"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import MapPicker from "@/components/mappicker"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export default function ReportPage() {
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [coords, setCoords] = useState<[number, number] | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!images.length) return alert("Please add at least one photo.")
    if (!coords) return alert("Please select a location.")

    setSubmitting(true)

    const data = {
      title: (e.currentTarget as any).title.value,
      description: (e.currentTarget as any).description.value,
      coords,
      images,
    }

    console.log("Submitted:", data)
    setTimeout(() => {
      setSubmitting(false)
      alert("Report submitted! Thank you.")
    }, 1000)
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
          <Input name="title" placeholder="Overflowing trash, illegal dumping..." />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            name="description"
            placeholder="Optional details that may help volunteers or authorities"
            rows={4}
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
                clicking "Choose location on map" and selecting the correct spot. This
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
                  <img
                    src={src}
                    alt={`preview-${i}`}
                    className="h-24 w-24 object-cover rounded-md border"
                  />
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
