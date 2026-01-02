'use client';

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const { user, profile, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link 
            href="/" 
            className="text-xl font-bold text-black dark:text-zinc-50"
          >
            CleanMap
          </Link>
          
          <div className="flex items-center gap-6">
            <Link 
              href="/map" 
              className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50 transition-colors"
            >
              Map
            </Link>
            <Link 
              href="/report" 
              className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50 transition-colors"
            >
              Report
            </Link>
            <Link 
              href="/dashboard" 
              className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50 transition-colors"
            >
              Dashboard
            </Link>
            
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/profile"
                      className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50 transition-colors"
                    >
                      {profile?.firstName || profile?.email || 'Profile'}
                    </Link>
                    <Button
                      onClick={handleSignOut}
                      variant="outline"
                      size="sm"
                    >
                      Sign out
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link href="/login">
                      <Button variant="ghost" size="sm">
                        Sign in
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button size="sm">
                        Sign up
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
