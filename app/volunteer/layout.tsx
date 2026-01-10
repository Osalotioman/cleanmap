'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Users, 
  FileText, 
  Home,
  LogOut
} from 'lucide-react';

export default function VolunteerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/volunteer');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      {/* <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              {/* <Link href="/" className="text-xl font-bold">
                CleanMap
              </Link>
              <nav className="hidden md:flex items-center gap-4">
                <Link href="/volunteer">
                  <Button variant="ghost" size="sm">
                    <Home className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/volunteer/reports">
                  <Button variant="ghost" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Reports
                  </Button>
                </Link>
                <Link href="/volunteer/communities">
                  <Button variant="ghost" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Communities
                  </Button>
                </Link>
                <Link href="/volunteer/map">
                  <Button variant="ghost" size="sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    Map
                  </Button>
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  Profile
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header> */}

      {/* Mobile Navigation */}
      {/* <div className="md:hidden border-b bg-background">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-around py-2">
            <Link href="/volunteer">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/volunteer/reports">
              <Button variant="ghost" size="sm">
                <FileText className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/volunteer/communities">
              <Button variant="ghost" size="sm">
                <Users className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/volunteer/map">
              <Button variant="ghost" size="sm">
                <MapPin className="h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      </div> */}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}