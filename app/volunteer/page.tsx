'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLocation } from '@/lib/hooks/use-location';
import { useCommunities } from '@/lib/hooks/use-communities';
import { useVolunteerStats } from '@/lib/hooks/use-volunteer-stats';
import { MapPin, Users, FileText, Plus, Loader2, AlertCircle } from 'lucide-react';

type DashboardCommunity = {
  id: string;
  name: string;
  state: string;
  radius: number;
  memberCount: number;
  isMember: boolean;
  distance?: number;
};

export default function VolunteerDashboard() {
  const router = useRouter();
  const location = useLocation();
  const { communities, loading: communitiesLoading } = useCommunities(
    location.latitude,
    location.longitude
  );
  const { stats, loading: statsLoading } = useVolunteerStats(
    location.latitude,
    location.longitude
  );

  const myCommunities = (communities as unknown as DashboardCommunity[]).filter(c => c.isMember);
  const availableCommunities = (communities as unknown as DashboardCommunity[])
    .filter(c => !c.isMember)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">Volunteer Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here&apos;s what&apos;s happening in your communities.
        </p>
      </div>

      {/* Location Status */}
      {location.loading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Detecting your location...
          </AlertDescription>
        </Alert>
      )}

      {location.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {location.error}. Please enable location services to use CleanMap.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              My Communities
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.myCommunities}
            </div>
            <p className="text-xs text-muted-foreground">
              Active memberships
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Nearby Reports
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.nearbyReports}
            </div>
            <p className="text-xs text-muted-foreground">
              Within 5km
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Scheduled Events
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.scheduledEvents}
            </div>
            <p className="text-xs text-muted-foreground">
              Upcoming cleanups
            </p>
          </CardContent>
        </Card>
      </div>

      {/* My Communities */}
      {myCommunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Communities</CardTitle>
            <CardDescription>
              Communities you&apos;re an active member of
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {myCommunities.map(community => (
              <div
                key={community.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                onClick={() => router.push(`/volunteer/my-communities/${community.id}/overview`)}
              >
                <div className="flex-1">
                  <h3 className="font-medium">{community.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {community.memberCount} members · {community.state} · {Math.round(community.radius / 1000)}km radius
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  View →
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/volunteer/communities')}
            >
              View All Communities
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Join a Community */}
      {myCommunities.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Join a community to start organizing cleanups
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {communitiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : availableCommunities.length > 0 ? (
              <>
                {availableCommunities.map(community => (
                  <div
                    key={community.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{community.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {community.memberCount} members · {community.state} · {Math.round(community.radius / 1000)}km radius
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/volunteer/communities`)}
                    >
                      View
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/volunteer/communities')}
                >
                  View All Communities
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No communities found in your area
                </p>
                <Button onClick={() => router.push('/volunteer/communities/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create a Community
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>View Reports</CardTitle>
            <CardDescription>
              See waste reports near you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => router.push('/volunteer/reports')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Browse Reports
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create Community</CardTitle>
            <CardDescription>
              Start a new cleanup community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => router.push('/volunteer/communities/create')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Community
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}