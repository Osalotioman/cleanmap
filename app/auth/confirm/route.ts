import { createClient } from '@/lib/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const _next = searchParams.get('next')

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error) {
      // Handle different verification types
      if (type === 'email') {
        // Email confirmation - redirect to login with success message
        redirect('/auth/login?confirmed=true')
      } else if (type === 'recovery') {
        // Password reset - redirect to update password page
        redirect('/auth/update-password')
      } else if (_next && _next.startsWith('/')) {
        // Custom redirect if provided
        redirect(_next)
      } else {
        // Default to profile/dashboard
        redirect('/profile')
      }
    } else {
      // redirect the user to an error page with error message
      const errorMessage = encodeURIComponent(error?.message || 'Verification failed')
      redirect(`/auth/error?error=${errorMessage}`)
    }
  }

  // redirect the user to an error page with instructions
  redirect(`/auth/error?error=Invalid verification link. Please request a new one.`)
}
