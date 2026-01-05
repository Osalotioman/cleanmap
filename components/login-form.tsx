'use client'

import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false)
  const [isResendingVerification, setIsResendingVerification] = useState(false)
  const { signIn, loading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for success messages from URL parameters
  useEffect(() => {
    if (searchParams.get('confirmed') === 'true') {
      setSuccessMessage('Email confirmed successfully! You can now log in.')
    } else if (searchParams.get('password_updated') === 'true') {
      setSuccessMessage('Password updated successfully! You can now log in with your new password.')
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setNeedsEmailVerification(false)

    // Trim and validate inputs
    const trimmedEmail = email.trim()

    if (!trimmedEmail || !password) {
      setError('Email and password are required')
      setIsLoading(false)
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address')
      setIsLoading(false)
      return
    }

    try {
      await signIn(trimmedEmail, password)
      const redirectUrl = searchParams.get('redirect')
      router.push(redirectUrl || '/volunteer')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setError(errorMessage)
      
      // Check if error indicates email verification needed
      if (errorMessage.toLowerCase().includes('verify your email') || 
          errorMessage.toLowerCase().includes('email not confirmed')) {
        setNeedsEmailVerification(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setIsResendingVerification(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage('Verification email sent! Please check your inbox and spam folder.')
        setNeedsEmailVerification(false)
        setError(null)
      } else {
        setError(data.error || 'Failed to resend verification email')
      }
    } catch (err) {
      setError('Failed to resend verification email. Please try again.')
    } finally {
      setIsResendingVerification(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              {successMessage && (
                <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                  {successMessage}
                </div>
              )}
              {error && (
                <div className="space-y-2">
                  <p className="text-sm text-red-500">{error}</p>
                  {needsEmailVerification && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResendVerification}
                      disabled={isResendingVerification}
                      className="w-full"
                    >
                      {isResendingVerification ? 'Sending...' : 'Resend Verification Email'}
                    </Button>
                  )}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading || loading}>
                {isLoading || loading ? 'Logging in...' : 'Login'}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/auth/sign-up" className="underline underline-offset-4">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
