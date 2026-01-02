'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Your Profile</CardTitle>
            <CardDescription>
              Manage your CleanMap account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Name
                </label>
                <p className="text-lg mt-1">
                  {profile.firstName || profile.lastName
                    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
                    : 'Not provided'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Email
                </label>
                <p className="text-lg mt-1">{profile.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Role
                </label>
                <p className="text-lg mt-1 capitalize">{profile.role}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Account Status
                </label>
                <p className="text-lg mt-1 capitalize">{profile.status}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Member Since
                </label>
                <p className="text-lg mt-1">
                  {new Date(profile.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {user.email_confirmed_at ? (
              <Alert>
                <AlertDescription>
                  ✓ Your email is verified
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertDescription>
                  Please verify your email address. Check your inbox for a verification link.
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button
                variant="destructive"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
