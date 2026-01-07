"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Info, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { CoveragType } from "@/types/community"

type Props = {
  onSuccess?: () => void
}

export function CreateCommunityForm({ onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    coverageType: "neighborhood" as CoveragType,
    guidelines: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCoverageTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, coverageType: value as CoveragType }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      toast.error("Community name is required")
      return
    }

    if (!formData.location.trim()) {
      toast.error("Location is required")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/community/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          location: formData.location.trim(),
          description: formData.description.trim() || undefined,
          coverageType: formData.coverageType,
          guidelines: formData.guidelines.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to create community")
        return
      }

      toast.success("Community created successfully!")
      
      // Reset form
      setFormData({
        name: "",
        location: "",
        description: "",
        coverageType: "neighborhood",
        guidelines: "",
      })

      onSuccess?.()
    } catch (error) {
      console.error("Error creating community:", error)
      toast.error("An error occurred while creating the community")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit}
    >
      {/* Community Name */}
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Community Name{" "}
          <span className="text-muted-foreground">(include location)</span>
        </label>
        <Input 
          placeholder="Luckyway Branch 1" 
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          disabled={loading}
        />
      </div>

      {/* Location / Zone */}
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <label className="text-sm font-medium">
            Community Location / Zone
          </label>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                Used only to show your community to nearby volunteers and prevent
                duplicates. Not a meeting address.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Input 
          placeholder="Luckyway, Phase 2, Ikorodu Road" 
          name="location"
          value={formData.location}
          onChange={handleInputChange}
          disabled={loading}
        />
      </div>

      {/* Coverage Type */}
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Coverage Type
        </label>
        <Select 
          value={formData.coverageType}
          onValueChange={handleCoverageTypeChange}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select coverage area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="neighborhood">Neighborhood</SelectItem>
            <SelectItem value="district">District</SelectItem>
            <SelectItem value="city">City-wide</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          placeholder="What is this community about?"
          rows={3}
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          disabled={loading}
        />
      </div>

      {/* Guidelines */}
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Guidelines{" "}
          <span className="text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          placeholder="Basic rules and expectations for members"
          rows={3}
          name="guidelines"
          value={formData.guidelines}
          onChange={handleInputChange}
          disabled={loading}
        />
      </div>

      <Button 
        className="w-full" 
        disabled={loading}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? "Creating..." : "Create Community"}
      </Button>
    </form>
  )
}
