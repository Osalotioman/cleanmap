'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { MapViewer } from '@/components/map-viewer';
import { useLocation } from '@/lib/hooks/use-location';
import { useCommunities } from '@/lib/hooks/use-communities';
import { Loader2, AlertCircle, MapPin, Layers } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Report {
  id: string;
  latitude: number;
  longitude: number;
  description?: string | null;
  status: string;
}

export default function VolunteerMapPage() {
  const router = useRouter();
  const location = useLocation();
  const { communities, loading: communitiesLoading } = useCommunities(
    location.latitude,
    location.longitude
  );

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [showCommunities, setShowCommunities] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [radiusFilter, setRadiusFilter] = useState<string>('5000');

  // Selected item
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Fetch reports
  useEffect(() => {
    async function fetchReports() {
      if (location.latitude === null || location.longitude === null) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/reports/public?lat=${location.latitude}&lon=${location.longitude}&radius=${radiusFilter}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch reports');
        }

        const data = await response.json();
        setReports(data.data.reports);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, [location.latitude, location.longitude, radiusFilter]);

  // Filter reports by status
  const filteredReports = reports.filter((report) => {
    if (statusFilter === 'all') return true;
    return report.status === statusFilter;
  });

  // Filter communities (only show member communities)
  const memberCommunities = communities.filter(c => c.isMember);
  const displayCommunities = showCommunities ? memberCommunities : [];

  if (location.loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
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
          {location.error}. Please enable location services to view the map.
        </AlertDescription>
      </Alert>
    );
  }

  const statusCounts = {
    all: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    scheduled: reports.filter(r => r.status === 'scheduled').length,
    cleaned: reports.filter(r => r.status === 'cleaned').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Map View</h1>
        <p className="text-muted-foreground mt-2">
          Visualize reports and communities in your area
        </p>
      </div>

      {/* Controls */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Status Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label>Filter by Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All ({statusCounts.all})
                  </SelectItem>
                  <SelectItem value="pending">
                    Pending ({statusCounts.pending})
                  </SelectItem>
                  <SelectItem value="scheduled">
                    Scheduled ({statusCounts.scheduled})
                  </SelectItem>
                  <SelectItem value="cleaned">
                    Cleaned ({statusCounts.cleaned})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Radius Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label>Search Radius</Label>
              <Select value={radiusFilter} onValueChange={setRadiusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1000">1 km</SelectItem>
                  <SelectItem value="2500">2.5 km</SelectItem>
                  <SelectItem value="5000">5 km</SelectItem>
                  <SelectItem value="10000">10 km</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Community Toggle */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Communities</Label>
                <p className="text-xs text-muted-foreground">
                  {memberCommunities.length} joined
                </p>
              </div>
              <Switch
                checked={showCommunities}
                onCheckedChange={setShowCommunities}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Displaying</span>
              </div>
              <p className="text-2xl font-bold">{filteredReports.length}</p>
              <p className="text-xs text-muted-foreground">reports</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      {loading || communitiesLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Loading map data...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <MapViewer
              center={[location.latitude!, location.longitude!]}
              zoom={13}
              reports={filteredReports}
              communities={displayCommunities.map(c => ({
                id: c.id,
                name: c.name,
                centerLat: c.centerLat,
                centerLon: c.centerLon,
                radius: 2000,
              }))}
              onReportClick={(reportId) => {
                const report = reports.find(r => r.id === reportId);
                if (report) {
                  setSelectedReport(report);
                }
              }}
              onCommunityClick={(communityId) => {
                router.push(`/volunteer/communities/${communityId}`);
              }}
              height="600px"
            />
          </CardContent>
        </Card>
      )}

      {/* Selected Report Details */}
      {selectedReport && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Selected Report</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedReport(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={
                selectedReport.status === 'pending' 
                  ? 'bg-yellow-100 text-yellow-800'
                  : selectedReport.status === 'scheduled'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }>
                {selectedReport.status}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {selectedReport.latitude.toFixed(4)}, {selectedReport.longitude.toFixed(4)}
              </span>
            </div>

            {selectedReport.description && (
              <div>
                <h4 className="font-medium text-sm mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedReport.description}
                </p>
              </div>
            )}

            <Button
              className="w-full"
              onClick={() => router.push(`/volunteer/reports/${selectedReport.id}`)}
            >
              View Full Details
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Your Location</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statusCounts.pending}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">My Communities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{memberCommunities.length}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}