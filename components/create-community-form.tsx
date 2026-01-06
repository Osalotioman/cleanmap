"use client"

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
import { Info } from "lucide-react"

type Props = {
  onSuccess?: () => void
}

export function CreateCommunityForm({ onSuccess }: Props) {
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        // TODO: backend call
        onSuccess?.()
      }}
    >
      {/* Community Name */}
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Community Name{" "}
          <span className="text-muted-foreground">(include location)</span>
        </label>
        <Input placeholder="Luckyway Branch 1" />
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

        <Input placeholder="Luckyway, Phase 2, Ikorodu Road" />
      </div>

      {/* Coverage Type */}
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Coverage Type
        </label>
        <Select>
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
        />
      </div>

      <Button className="w-full">
        Create Community
      </Button>
    </form>
  )
}
