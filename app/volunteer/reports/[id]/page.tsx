'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MapViewer } from '@/components/map-viewer';
import { EventCard } from '@/components/event-card';
import { useAuth } from '@/lib/auth-context';
import { useLocation } from '@/lib/hooks/use-location';
import { useCommunities } from '@/lib/hooks/use-communities';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Loader2, 
  AlertCircle, 
  MapPin, 
  Calendar, 
  MessageSquare,
  Send,
  ArrowLeft
} from 'lucide-react';
import Image from 'next/image';

interface Report {
  id: string;
  latitude: number;
  longitude: number;
  description?: string | null;
  imageUrl?: string | null;
  status: string;
  createdAt: string;
}

interface Event {
  id: string;
  scheduledAt: string;
  status: string;
  markedCleanedAt?: string | null;
  leader: {
    id: string;
    name: string;
  };
  attendees: Array<{
    volunteer: {
      id: string;
      name: string;
    };
    rsvpStatus: string;
  }>;
}

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  volunteer: {
    id:string;
    name: string;
  };
}

export default function ReportDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id: reportId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const location = useLocation();
  const { communities } = useCommunities(location.latitude, location.longitude);
  const myCommunities = communities.filter(c => c.isMember);
  
  const [report, setReport] = useState<Report | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Comment form
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  
  // Schedule form
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [scheduling, setScheduling] = useState(false);

  // Action states
  const [rsvping, setRsvping] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [disputing, setDisputing] = useState(false);

  // Fetch report data
  useEffect(() => {
    async function fetchReport() {
      try {
        // Fetch report
        const reportRes = await fetch(`/api/reports/${reportId}`);
        if (!reportRes.ok) throw new Error('Failed to fetch report');
        const reportData = await reportRes.json();
        setReport(reportData.data.report);

        // Fetch event if exists
        if (reportData.data.report.status === 'scheduled' || reportData.data.report.status === 'completed') {
          const eventRes = await fetch(`/api/reports/${reportId}/event`);
          if (eventRes.ok) {
            const eventData = await eventRes.json();
            setEvent(eventData.data.event);
          }
        }

        // Fetch comments
        const commentsRes = await fetch(`/api/reports/${reportId}/comments`);
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          setComments(commentsData.data.comments);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [reportId]);

  // Submit comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/reports/${reportId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText }),
      });

      if (!response.ok) throw new Error('Failed to post comment');

      const data = await response.json();
      setComments([data.data.comment, ...comments]);
      setCommentText('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Schedule cleanup
  const handleScheduleCleanup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDate || !scheduledTime || !communityId) return;

    setScheduling(true);
    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      
      const response = await fetch('/api/events/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          communityId,
          scheduledAt,
        }),
      });

      if (!response.ok) throw new Error('Failed to schedule cleanup');

      const data = await response.json();
      setEvent(data.data.event);
      setShowScheduleForm(false);
      setReport(prev => prev ? { ...prev, status: 'scheduled' } : null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to schedule cleanup');
    } finally {
      setScheduling(false);
    }
  };

  // RSVP to event
  const handleRSVP = async () => {
    if (!event) return;

    setRsvping(true);
    try {
      const response = await fetch(`/api/events/${event.id}/rsvp`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to RSVP');

      // Refresh event data
      const eventRes = await fetch(`/api/reports/${reportId}/event`);
      if (eventRes.ok) {
        const eventData = await eventRes.json();
        setEvent(eventData.data.event);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to RSVP');
    } finally {
      setRsvping(false);
    }
  };

  // Complete event
  const handleComplete = async () => {
    if (!event) return;

    setCompleting(true);
    try {
      const response = await fetch(`/api/events/${event.id}/complete`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to mark as complete');

      const data = await response.json();
      setEvent(prev => prev ? { ...prev, status: 'completed' } : null);
      
      if (data.data.reportCleaned) {
        setReport(prev => prev ? { ...prev, status: 'cleaned' } : null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to mark as complete');
    } finally {
      setCompleting(false);
    }
  };

  // Dispute event
  const handleDispute = async () => {
    if (!event) return;

    setDisputing(true);
    try {
      const response = await fetch(`/api/events/${event.id}/dispute`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to dispute');

      const data = await response.json();
      
      // Refresh event data
      const eventRes = await fetch(`/api/reports/${reportId}/event`);
      if (eventRes.ok) {
        const eventData = await eventRes.json();
        setEvent(eventData.data.event);
      }

      if (data.data.reportReverted) {
        setReport(prev => prev ? { ...prev, status: 'pending' } : null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to dispute');
    } finally {
      setDisputing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error || 'Report not found'}</AlertDescription>
      </Alert>
    );
  }

  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
    cleaned: { label: 'Cleaned', color: 'bg-green-100 text-green-800' },
  };
  const statusInfo = statusConfig[report.status as keyof typeof statusConfig];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Reports
      </Button>

      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
              <CardTitle className="text-2xl mt-2">Waste Report</CardTitle>
              <CardDescription>
                Reported on {new Date(report.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}</span>
          </div>

          {/* Description */}
          {report.description && (
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{report.description}</p>
            </div>
          )}

          {/* Image */}
          {report.imageUrl && (
            <div className="relative w-full h-64 rounded-md overflow-hidden border">
              <Image
                src={report.imageUrl}
                alt="Report image"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent>
          <MapViewer
            center={[report.latitude, report.longitude]}
            zoom={15}
            reports={[report]}
            height="400px"
          />
        </CardContent>
      </Card>

      {/* Event Card (if scheduled) */}
      {event && (
        <EventCard
          event={{ ...event, report }}
          currentUserId={user?.id}
          onRSVP={handleRSVP}
          onComplete={handleComplete}
          onDispute={handleDispute}
          isLoading={rsvping || completing || disputing}
        />
      )}

      {/* Schedule Form */}
      {report.status === 'pending' && !showScheduleForm && (
        <Card>
          <CardContent className="pt-6">
            <Button className="w-full" onClick={() => setShowScheduleForm(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Cleanup Event
            </Button>
          </CardContent>
        </Card>
      )}

      {showScheduleForm && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule Cleanup</CardTitle>
            <CardDescription>Set a date and time for this cleanup</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleScheduleCleanup} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time</label>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Community</label>
                <Select onValueChange={setCommunityId} value={communityId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a community..." />
                  </SelectTrigger>
                  <SelectContent>
                    {myCommunities.length > 0 ? (
                      myCommunities.map(community => (
                        <SelectItem key={community.id} value={community.id}>
                          {community.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-sm text-muted-foreground">
                        You must join a community first.
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  You can only schedule cleanups for communities you are a member of.
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={scheduling}>
                  {scheduling ? 'Scheduling...' : 'Schedule'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowScheduleForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <CardTitle>Discussion</CardTitle>
          </div>
          <CardDescription>
            Coordinate with other volunteers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} className="space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
            />
            <Button type="submit" disabled={submittingComment || !commentText.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {submittingComment ? 'Posting...' : 'Post Comment'}
            </Button>
          </form>

          {/* Comments List */}
          <div className="space-y-4 pt-4 border-t">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {comment.volunteer.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{comment.volunteer.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{comment.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}