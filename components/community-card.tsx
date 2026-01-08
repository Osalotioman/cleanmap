'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, MapPin, Calendar } from 'lucide-react';

interface CommunityCardProps {
  community: {
    id: string;
    name: string;
    state: string;
    centerLat: number;
    centerLon: number;
    distance: number;
    memberCount: number;
    isMember?: boolean;
    creator: {
      id: string;
      name: string;
    };
    createdAt?: string;
  };
  onClick?: () => void;
  onJoin?: () => void;
  showActions?: boolean;
  isLoading?: boolean;
}

export function CommunityCard({
  community,
  onClick,
  onJoin,
  showActions = true,
  isLoading = false,
}: CommunityCardProps) {
  const distanceInKm = (community.distance / 1000).toFixed(1);

  return (
    <Card 
      className={`hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{community.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {community.state}
            </p>
          </div>
          {community.isMember && (
            <Badge variant="secondary">Member</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{community.memberCount} member{community.memberCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{distanceInKm}km away</span>
          </div>
        </div>

        {/* Creator Info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Created by {community.creator.name}</span>
          {community.createdAt && (
            <>
              <span>·</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {new Date(community.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 pt-2 border-t">
            {community.isMember ? (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
              >
                View Community
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick?.();
                  }}
                >
                  View Details
                </Button>
                {onJoin && (
                  <Button 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onJoin();
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Joining...' : 'Join'}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}