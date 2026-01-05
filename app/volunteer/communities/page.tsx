'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommunityCard } from '@/components/community-card';
import { useLocation } from '@/lib/hooks/use-location';
import { useCommunities } from '@/lib/hooks/use-communities';
import { Loader2, AlertCircle, Plus, Search } from 'lucide-react';

export default function CommunitiesListPage() {
  const router = useRouter();
  const location = useLocation();
  const { communities, loading, error, refetch } = useCommunities(
    location.latitude,
    location.longitude
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // Filter communities
  const myCommunities = communities.filter(c => c.isMember);
  const availableCommunities = communities.filter(c => !c.isMember);

  // Apply search filter
  const filteredMyCommunities = myCommunities.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredAvailableCommunities = availableCommunities.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoinCommunity = async (communityId: string) => {
    setJoiningId(communityId);
    try {
      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join community');
      }

      // Refetch communities to update membership status
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to join community');
    } finally {
      setJoiningId(null);
    }
  };

  if (location.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Detecting your location...</p>
        </div>
      </div>
    );
  }

  if (location.error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {location.error}. Please enable location services to view communities.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Communities</h1>
          <p className="text-muted-foreground mt-2">
            Join or create communities to organize cleanups
          </p>
        </div>
        <Button onClick={() => router.push('/volunteer/communities/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Community
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Communities</CardDescription>
            <CardTitle className="text-2xl">{communities.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>My Communities</CardDescription>
            <CardTitle className="text-2xl">{myCommunities.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available to Join</CardDescription>
            <CardTitle className="text-2xl">{availableCommunities.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Communities Tabs */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <Tabs defaultValue="my-communities" className="space-y-4">
          <TabsList>
            <TabsTrigger value="my-communities">
              My Communities ({filteredMyCommunities.length})
            </TabsTrigger>
            <TabsTrigger value="available">
              Available ({filteredAvailableCommunities.length})
            </TabsTrigger>
          </TabsList>

          {/* My Communities Tab */}
          <TabsContent value="my-communities" className="space-y-4">
            {filteredMyCommunities.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground text-center mb-4">
                    {searchQuery
                      ? 'No communities match your search.'
                      : "You haven't joined any communities yet."}
                  </p>
                  {!searchQuery && (
                    <div className="flex gap-2">
                      <Button onClick={() => router.push('/volunteer/communities/create')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Community
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const tabTrigger = document.querySelector('[value="available"]') as HTMLElement;
                          tabTrigger?.click();
                        }}
                      >
                        Browse Available
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredMyCommunities.map((community) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    onClick={() => router.push(`/volunteer/communities/${community.id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Available Communities Tab */}
          <TabsContent value="available" className="space-y-4">
            {filteredAvailableCommunities.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground text-center mb-4">
                    {searchQuery
                      ? 'No communities match your search.'
                      : 'No communities available in your area.'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => router.push('/volunteer/communities/create')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create the First Community
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredAvailableCommunities.map((community) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    onClick={() => router.push(`/volunteer/communities/${community.id}`)}
                    onJoin={() => handleJoinCommunity(community.id)}
                    isLoading={joiningId === community.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Info Card */}
      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle className="text-lg">How Communities Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Communities have a 2km radius around their center point</p>
          <p>• You can only join communities in your current state</p>
          <p>• Create a new community if none exist within 2km of your location</p>
          <p>• Join communities to see reports and organize cleanups in that area</p>
        </CardContent>
      </Card>
    </div>
  );
}