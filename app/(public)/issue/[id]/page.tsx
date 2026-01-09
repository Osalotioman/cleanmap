"use client"

import MapPicker from "@/components/mappicker"

interface IssueProps {
  params: { id: string }
}

export default function IssueDetails({ params }: IssueProps) {
  const issueId = params.id;
  
  // Dummy issue data
  const issue = {
    id: issueId,
    title: "Overflowing trash",
    description: "Garbage bin full on 5th Avenue",
    coords: [51.505, -0.09] as [number, number],
    status: "Pending",
    images: [
      "/example1.jpg",
      "/example2.jpg",
    ],
  }

  const statusColors: Record<string, string> = {
    Pending: "text-yellow-600",
    "In Progress": "text-blue-600",
    Resolved: "text-green-600",
    Rejected: "text-red-600",
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 space-y-6">
      <h1 className="text-2xl font-bold">{issue.title}</h1>
      <p>{issue.description}</p>
      <p>
        Status:{" "}
        <span className={`font-medium ${statusColors[issue.status] || "text-muted-foreground"}`}>
          {issue.status}
        </span>
      </p>

      {/* Map */}
      <div className="mt-4 h-64 rounded-md overflow-hidden border">
        <MapPicker location={issue.coords} setLocation={() => {}} readOnly />
      </div>

      {/* Photos */}
      {issue.images?.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {issue.images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`issue-photo-${i}`}
              className="h-24 w-24 object-cover rounded-md border"
            />
          ))}
        </div>
      )}
    </main>
  )
}
