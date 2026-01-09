'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, MessageSquare, Users } from 'lucide-react';
import Image from 'next/image';

interface ReportCardProps {
  report: {
    id: string;
    latitude: number;
    longitude: number;
    description?: string | null;
    imageUrl?: string | null;
    status: string;
    createdAt: string;
    distance?: number;
    events?: Array<{
      id: string;
      scheduledAt: string;
      leader: {
        id: string;
        name: string;
      };
      _count: {
        attendees: number;
      };
    }>;
    comments?: Array<{
      id: string;
    }>;
  };
  onClick?: () => void;
  showActions?: boolean;
  onSchedule?: () => void;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  scheduled: {
    label: 'Scheduled',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  cleaned: {
    label: 'Cleaned',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
};

export function ReportCard({ 
  report, 
  onClick, 
  showActions = false,
  onSchedule 
}: ReportCardProps) {
  const statusInfo = statusConfig[report.status as keyof typeof statusConfig] || statusConfig.pending;
  const currentEvent = report.events?.[0];

  return (
    <Card 
      className={`hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Badge className={statusInfo.color}>
              {statusInfo.label}
            </Badge>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>
                {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
              </span>
              {report.distance !== undefined && (
                <span>· {Math.round(report.distance)}m away</span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Image */}
        {report.imageUrl && (
          <div className="relative w-full h-48 rounded-md overflow-hidden bg-muted">
            <Image
              src={report.imageUrl}
              alt="Report image"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}

        {/* Description */}
        {report.description && (
          <p className="text-sm text-foreground line-clamp-2">
            {report.description}
          </p>
        )}

        {/* Event Info (if scheduled) */}
        {currentEvent && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium">
                {new Date(currentEvent.scheduledAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                Led by {currentEvent.leader.name}
              </p>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              <span className="text-xs">{currentEvent._count.attendees}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              {new Date(report.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
            {report.comments && report.comments.length > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{report.comments.length}</span>
              </div>
            )}
          </div>

          {showActions && report.status === 'pending' && onSchedule && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onSchedule();
              }}
            >
              Schedule Cleanup
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}