"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function ThankYouContent() {
  const searchParams = useSearchParams()
  const reportId = searchParams.get("id")

  return (
    <>
      {reportId && (
        <Card className="mt-8 text-left">
          <CardHeader>
            <CardTitle>Track Your Report</CardTitle>
            <CardDescription>
              You can check the status of your submission any time using the link below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-muted px-4 py-2 text-sm">
              <Link
                href={`/issue/${reportId}`}
                className="font-mono break-all text-blue-600 hover:underline"
              >
                {`/issue/${reportId}`}
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

export default function ThankYouPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Thank You 🙌</h1>
      <p className="mt-4 text-muted-foreground">
        Your report has been submitted. Volunteers and cleanup teams will review it shortly.
      </p>

      <Suspense fallback={null}>
        <ThankYouContent />
      </Suspense>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/volunteers">Become a Volunteer</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </main>
  )
}
