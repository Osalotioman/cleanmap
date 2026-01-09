'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { 
  Loader2, 
  AlertCircle,
} from 'lucide-react';

interface Community {
  id: string;
  name: string;
  state: string;
  centerLat: number;
  centerLon: number;
  radius: number;
  creator: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface Member {
  volunteer: {
    id: string;
    name: string;
    email: string;
  };
  joinedAt: string;
}

export default function CommunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: communityId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [issuesHandled, setIssuesHandled] = useState(0);
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

        // Fetch members
        const membersRes = await fetch(`/api/communities/${communityId}/members`);
        if (membersRes.ok) {
          const membersData = await membersRes.json();
          setMembers(membersData.data.members || []);
        }

        // Fetch completed events count for "Issues handled"
        if (communityData.data.isMember) {
          const eventsRes = await fetch(`/api/communities/${communityId}/events?status=completed`);
          if (eventsRes.ok) {
            const eventsData = await eventsRes.json();
            setIssuesHandled(eventsData.data?.events?.length || 0);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchCommunityData();
  }, [communityId]);

  const handleJoinRequest = async () => {
    if (!user) {
      router.push('/auth/login?redirect=/volunteer/communities/' + communityId);
      return;
    }

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

  const isActive = members.length > 0;

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">{community.name}</h1>

        <div className="flex flex-wrap gap-2">
          <Badge>{community.state}</Badge>
          <Badge variant="outline">{(community.radius / 1000).toFixed(1)}km coverage</Badge>
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        {isMember ? (
          <Button asChild>
            <a href={`/volunteer/my-communities/${communityId}`}>
              Open community
            </a>
          </Button>
        ) : (
          <Button onClick={handleJoinRequest} disabled={joining}>
            {joining ? 'Sending request...' : 'Request to join'}
          </Button>
        )}
      </div>

      {/* Overview */}
      <Card>
        <CardContent className="space-y-3 py-4">
          <p className="text-muted-foreground">
            A volunteer community focused on keeping {community.state} clean and organized. 
            Join us to help tackle waste management issues in your area.
          </p>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>👥 Members: {members.length}</p>
            {isMember && <p>🧹 Issues handled: {issuesHandled}</p>}
            <p>📍 Coverage: {(community.radius / 1000).toFixed(1)}km radius</p>
            <p className="text-xs pt-2">
              Created by {community.creator.name} on{' '}
              {new Date(community.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}