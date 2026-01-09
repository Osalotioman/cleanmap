'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Clock, Users, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

interface EventCardProps {
  event: {
    id: string;
    scheduledAt: string;
    status: string;
    markedCleanedAt?: string | null;
    leader: {
      id: string;
      name: string;
    };
    report?: {
      id: string;
      latitude: number;
      longitude: number;
      description?: string | null;
    };
    attendees?: Array<{
      volunteer: {
        id: string;
        name: string;
      };
      rsvpStatus: string;
    }>;
  };
  currentUserId?: string;
  onRSVP?: () => void;
  onComplete?: () => void;
  onDispute?: () => void;
  onClick?: () => void;
  isLoading?: boolean;
}

const statusConfig = {
  scheduled: {
    label: 'Scheduled',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: Calendar,
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    icon: AlertCircle,
  },
  disputed: {
    label: 'Disputed',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    icon: AlertCircle,
  },
};

export function EventCard({
  event,
  currentUserId,
  onRSVP,
  onComplete,
  onDispute,
  onClick,
  isLoading = false,
}: EventCardProps) {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Update current time periodically for dispute window calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const statusInfo = statusConfig[event.status as keyof typeof statusConfig] || statusConfig.scheduled;
  const StatusIcon = statusInfo.icon;
  const isLeader = currentUserId === event.leader.id;
  const hasRSVPd = event.attendees?.some(a => a.volunteer.id === currentUserId);
  const attendeeCount = event.attendees?.length || 0;
  const disputeCount = event.attendees?.filter(a => a.rsvpStatus === 'disputed').length || 0;

  const scheduledDate = new Date(event.scheduledAt);
  const isPast = scheduledDate < new Date();
  const isToday = scheduledDate.toDateString() === new Date().toDateString();

  // Calculate dispute window using state-tracked current time to avoid impure function call
  let disputeWindowRemaining = null;
  if (event.status === 'completed' && event.markedCleanedAt) {
    const markedDate = new Date(event.markedCleanedAt);
    const hoursPassed = (currentTime - markedDate.getTime()) / (1000 * 60 * 60);
    const hoursRemaining = Math.max(0, 24 - hoursPassed);
    disputeWindowRemaining = hoursRemaining;
  }

  return (
    <Card 
      className={`hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge className={statusInfo.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusInfo.label}
              </Badge>
              {isToday && event.status === 'scheduled' && (
                <Badge variant="secondary">Today</Badge>
              )}
            </div>
            <CardTitle className="text-lg mt-2">
              Cleanup Event
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Schedule Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {scheduledDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {scheduledDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Location */}
        {event.report && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {event.report.latitude.toFixed(4)}, {event.report.longitude.toFixed(4)}
            </span>
          </div>
        )}

        {/* Leader & Attendees */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {event.leader.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {event.leader.name}
                {isLeader && <span className="text-muted-foreground ml-1">(You)</span>}
              </p>
              <p className="text-xs text-muted-foreground">Event Leader</p>
            </div>
          </div>

          {attendeeCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {attendeeCount} volunteer{attendeeCount !== 1 ? 's' : ''} attending
              </span>
              {disputeCount > 0 && (
                <span className="text-red-500">
                  · {disputeCount} dispute{disputeCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Dispute Window */}
        {disputeWindowRemaining !== null && disputeWindowRemaining > 0 && (
          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md text-xs text-yellow-800 dark:text-yellow-200">
            Dispute window: {Math.round(disputeWindowRemaining)} hours remaining
          </div>
        )}

        {/* Report Description */}
        {event.report?.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 pt-2 border-t">
            {event.report.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          {event.status === 'scheduled' && !hasRSVPd && onRSVP && !isLeader && (
            <Button 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onRSVP();
              }}
              disabled={isLoading}
            >
              RSVP
            </Button>
          )}

          {event.status === 'scheduled' && isLeader && isPast && onComplete && (
            <Button 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              disabled={isLoading}
            >
              Mark as Complete
            </Button>
          )}

          {event.status === 'completed' && 
           hasRSVPd && 
           !isLeader && 
           disputeWindowRemaining !== null && 
           disputeWindowRemaining > 0 && 
           onDispute && (
            <Button 
              variant="destructive"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onDispute();
              }}
              disabled={isLoading}
            >
              Dispute Completion
            </Button>
          )}

          {hasRSVPd && event.status === 'scheduled' && (
            <Badge variant="secondary" className="flex-1 justify-center">
              You&apos;re attending
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}