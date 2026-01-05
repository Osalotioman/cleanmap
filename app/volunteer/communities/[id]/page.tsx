'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ReportCard } from '@/components/report-card';
import { EventCard } from '@/components/event-card';
import { MapViewer } from '@/components/map-viewer';
import { useAuth } from '@/lib/auth-context';
import { 
  Loader2, 
  AlertCircle, 
  MapPin, 
  Users, 
  Calendar,
  ArrowLeft,
  UserPlus,
  Crown
} from 'lucide-react';

interface Community {
  id: string;
  name: string;
  state: string;
  centerLat: number;
  centerLon: number;
  creator: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface Report {
  id: string;
  latitude: number;
  longitude: number;
  description?: string | null;
  imageUrl?: string | null;
  status: string;
  createdAt: string;
  distance: number;
}

interface Member {
  volunteer: {
    id: string;
    name: string;
    email: string;
  };
  joinedAt: string;
}

export default function CommunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: communityId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [community, setCommunity] = useState<Community | null>(null);
  const [coreReports, setCoreReports] = useState<Report[]>([]);
  const [bufferReports, setBufferReports] = useState<Report[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    async function fetchCommunityData() {
      try {
        // Fetch community details
        const communityRes = await fetch(`/api/communities/${communityId}`);
        if (!communityRes.ok) throw new Error('Failed to fetch community');
        const communityData = await communityRes.json();
        setCommunity(communityData.data.community);
        setIsMember(communityData.data.isMember);

        // If member, fetch reports
        if (communityData.data.isMember) {
          const reportsRes = await fetch(`/api/communities/${communityId}/reports`);
          if (reportsRes.ok) {
            const reportsData = await reportsRes.json();
            setCoreReports(reportsData.data.coreReports || []);
            setBufferReports(reportsData.data.bufferReports || []);
          }
        }

        // Fetch members
        const membersRes = await fetch(`/api/communities/${communityId}/members`);
        if (membersRes.ok) {
          const membersData = await membersRes.json();
          setMembers(membersData.data.members || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchCommunityData();
  }, [communityId]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join community');
      }

      setIsMember(true);
      
      // Refetch data
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to join community');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !community) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error || 'Community not found'}</AlertDescription>
      </Alert>
    );
  }

  const isCreator = user?.id === community.creator.id;
  const pendingReports = coreReports.filter(r => r.status === 'pending');
  const scheduledReports = coreReports.filter(r => r.status === 'scheduled');

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Communities
      </Button>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-2xl">{community.name}</CardTitle>
                {isMember && <Badge variant="secondary">Member</Badge>}
                {isCreator && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Crown className="h-3 w-3 mr-1" />
                    Creator
                  </Badge>
                )}
              </div>
              <CardDescription>{community.state}</CardDescription>
            </div>
            {!isMember && (
              <Button onClick={handleJoin} disabled={joining}>
                <UserPlus className="h-4 w-4 mr-2" />
                {joining ? 'Joining...' : 'Join Community'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{members.length}</p>
                <p className="text-xs text-muted-foreground">Members</p>
              </div>
            </div>
            {isMember && (
              <>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{coreReports.length}</p>
                    <p className="text-xs text-muted-foreground">Reports</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{scheduledReports.length}</p>
                    <p className="text-xs text-muted-foreground">Scheduled</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{pendingReports.length}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Creator Info */}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Created by <span className="font-medium">{community.creator.name}</span> on{' '}
              {new Date(community.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle>Community Area</CardTitle>
          <CardDescription>
            2km radius around the community center
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MapViewer
            center={[community.centerLat, community.centerLon]}
            zoom={14}
            reports={isMember ? [...coreReports, ...bufferReports] : []}
            communities={[
              {
                id: community.id,
                name: community.name,
                centerLat: community.centerLat,
                centerLon: community.centerLon,
                radius: 2000,
              },
            ]}
            onReportClick={(reportId) => router.push(`/volunteer/reports/${reportId}`)}
            height="500px"
          />
        </CardContent>
      </Card>

      {isMember ? (
        <Tabs defaultValue="reports" className="space-y-4">
          <TabsList>
            <TabsTrigger value="reports">
              Reports ({coreReports.length})
            </TabsTrigger>
            <TabsTrigger value="buffer">
              Nearby ({bufferReports.length})
            </TabsTrigger>
            <TabsTrigger value="members">
              Members ({members.length})
            </TabsTrigger>
          </TabsList>

          {/* Core Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            {coreReports.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground text-center">
                    No reports in this community yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {coreReports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onClick={() => router.push(`/volunteer/reports/${report.id}`)}
                    showActions={report.status === 'pending'}
                    onSchedule={() => router.push(`/volunteer/reports/${report.id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Buffer Reports Tab */}
          <TabsContent value="buffer" className="space-y-4">
            <Alert>
              <AlertDescription>
                These reports are 2-2.5km from the community center. Consider extending your cleanup efforts here!
              </AlertDescription>
            </Alert>
            {bufferReports.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground text-center">
                    No nearby reports found.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bufferReports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onClick={() => router.push(`/volunteer/reports/${report.id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {members.map((member) => (
                <Card key={member.volunteer.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {member.volunteer.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{member.volunteer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(member.joinedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      {member.volunteer.id === community.creator.id && (
                        <Crown className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Join to See Community Content</p>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Join this community to view reports, schedule cleanups, and connect with other volunteers.
            </p>
            <Button onClick={handleJoin} disabled={joining}>
              <UserPlus className="h-4 w-4 mr-2" />
              {joining ? 'Joining...' : 'Join Community'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}