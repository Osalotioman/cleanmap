'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CompleteVolunteerProfilePage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (!loading && !user) {
      router.push('/auth/login?redirect=/volunteer/complete-profile');
    }
    // If user already has a volunteer profile, redirect to dashboard
    if (!loading && user && profile?.volunteer) {
      router.push('/volunteer');
    }
    // Pre-fill name if available from user profile
    if (profile && (profile.firstName || profile.lastName)) {
      setName(`${profile.firstName || ''} ${profile.lastName || ''}`.trim());
    }
  }, [user, profile, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/volunteer/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Volunteer profile created successfully! Redirecting...');
        await refreshProfile();
        // The page will redirect via the useEffect hook once `profile.volunteer` is updated.
        return;
      }

      // Handle specific "already exists" error
      if (response.status === 409) { // 409 Conflict
        toast.info('It looks like you already have a volunteer profile. Redirecting...');
        await refreshProfile();
        // The page will redirect via the useEffect hook.
      } else {
        // Handle other errors
        throw new Error(data.error || 'Failed to create volunteer profile.');
      }
    } catch (error) {
      console.error('Create volunteer profile error:', error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state if auth context is loading or if user already has a volunteer profile and is redirecting
  if (loading || (user && profile?.volunteer)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If user is logged in but has no volunteer profile, show the form
  if (user && !profile?.volunteer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Complete Your Volunteer Profile</CardTitle>
            <CardDescription>
              To access volunteer features, please provide a name for your volunteer profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  'Become a Volunteer'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null; // Should not reach here if logic is correct
}
