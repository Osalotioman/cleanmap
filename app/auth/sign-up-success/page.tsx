import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Check Your Email!</CardTitle>
              <CardDescription>Confirmation email sent</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Thank you for signing up! We&apos;ve sent a confirmation link to your email address.
                </p>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 space-y-2">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Next steps:
                  </p>
                  <ol className="text-sm text-blue-800 dark:text-blue-200 list-decimal list-inside space-y-1">
                    <li>Check your email inbox</li>
                    <li>Look for an email from CleanMap</li>
                    <li>Click the confirmation link</li>
                    <li>Return to login</li>
                  </ol>
                </div>
                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-3">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    <strong>Can&apos;t find the email?</strong> Check your spam or junk folder. 
                    The email should arrive within a few minutes.
                  </p>
                </div>
              </div>
              <Link href="/auth/login" className="w-full">
                <Button className="w-full">Go to Login</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
