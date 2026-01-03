export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">How CleanMap Works</h1>

      <ol className="mt-8 space-y-6">
        <li>
          <h3 className="font-semibold">1. Report an Issue</h3>
          <p className="text-muted-foreground">
            Anyone can report waste problems without creating an account.
          </p>
        </li>

        <li>
          <h3 className="font-semibold">2. Volunteers Review</h3>
          <p className="text-muted-foreground">
            Local volunteers verify reports and organize cleanup efforts.
          </p>
        </li>

        <li>
          <h3 className="font-semibold">3. Organizations Act</h3>
          <p className="text-muted-foreground">
            Waste management teams respond, clean up, and close the issue.
          </p>
        </li>
      </ol>
    </main>
  )
}
