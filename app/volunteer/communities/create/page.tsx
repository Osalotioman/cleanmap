'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapViewer } from '@/components/map-viewer';
import { useLocation } from '@/lib/hooks/use-location';
import { Loader2, AlertCircle, MapPin, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

interface ConflictCommunity {
  id: string;
  name: string;
  distance: number;
}

export default function CreateCommunityPage() {
  const router = useRouter();
  const location = useLocation();

  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [communityName, setCommunityName] = useState('');
  const [suggestedName, setSuggestedName] = useState('');
  const [locationName, setLocationName] = useState('');
  
  const [checking, setChecking] = useState(false);
  const [creating, setCreating] = useState(false);
  const [conflictCheck, setConflictCheck] = useState<{
    hasConflict: boolean;
    conflict?: ConflictCommunity;
  } | null>(null);

  // Use current location as default
  useEffect(() => {
    if (location.latitude && location.longitude) {
      setSelectedLocation([location.latitude, location.longitude]);
    }
  }, [location.latitude, location.longitude]);

  // Check for conflicts and get suggested name when location is selected
  useEffect(() => {
    if (!selectedLocation) return;

    async function checkAndSuggest() {
      setChecking(true);
      try {
        const [lat, lon] = selectedLocation!;
        // Get suggested name from Nominatim
        const nominatimRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
          {
            headers: {
              'User-Agent': 'CleanMap/1.0',
            },
          }
        );

        if (nominatimRes.ok) {
          const data = await nominatimRes.json();
          const suburb = data.address?.suburb || data.address?.town || data.address?.city || 'Unknown';
          const state = data.address?.state || '';
          
          setSuggestedName(`${suburb} Community`);
          setLocationName(`${suburb}, ${state}`);
          
          if (!communityName) {
            setCommunityName(`${suburb} Community`);
          }
        }

        // Check for conflicts
        const response = await fetch('/api/communities/check-conflict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: selectedLocation![0],
            longitude: selectedLocation![1],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setConflictCheck(data.data);
        }
      } catch (err) {
        console.error('Check error:', err);
      } finally {
        setChecking(false);
      }
    }

    checkAndSuggest();
  }, [selectedLocation]);

  const handleMapClick = (lat: number, lon: number) => {
    setSelectedLocation([lat, lon]);
    setConflictCheck(null);
  };

  const handleUseCurrentLocation = () => {
    if (location.latitude && location.longitude) {
      setSelectedLocation([location.latitude, location.longitude]);
      setConflictCheck(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation || !communityName.trim() || conflictCheck?.hasConflict) return;

    setCreating(true);
    try {
      const response = await fetch('/api/communities/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: selectedLocation[0],
          longitude: selectedLocation[1],
          name: communityName.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create community');
      }

      const data = await response.json();
      router.push(`/volunteer/communities/${data.data.community.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create community');
    } finally {
      setCreating(false);
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
          {location.error}. Please enable location services to create a community.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Communities
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Create a Community</h1>
        <p className="text-muted-foreground mt-2">
          Start a new cleanup community in your area
        </p>
      </div>

      {/* Location Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Location</CardTitle>
          <CardDescription>
            Choose the center point for your community (2km radius)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleUseCurrentLocation}
              disabled={!location.latitude || !location.longitude}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Use Current Location
            </Button>
            {selectedLocation && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {selectedLocation[0].toFixed(6)}, {selectedLocation[1].toFixed(6)}
                </span>
                {locationName && <span>· {locationName}</span>}
              </div>
            )}
          </div>

          <MapViewer
            center={selectedLocation || [location.latitude!, location.longitude!]}
            zoom={13}
            onMapClick={handleMapClick}
            enableClickToSelect
            height="400px"
          />

          <p className="text-xs text-muted-foreground">
            Click on the map to select a different location, or use your current location
          </p>
        </CardContent>
      </Card>

      {/* Conflict Check Result */}
      {checking && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking for existing communities...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {conflictCheck && (
        <Card className={conflictCheck.hasConflict ? 'border-destructive' : 'border-green-500'}>
          <CardContent className="pt-6">
            {conflictCheck.hasConflict && conflictCheck.conflict ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-destructive">
                      Community Already Exists
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      A community already exists within 2km of this location:
                    </p>
                    <div className="mt-2 p-3 border rounded-md">
                      <p className="font-medium">{conflictCheck.conflict.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {Math.round(conflictCheck.conflict.distance)}m away
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/volunteer/communities/${conflictCheck.conflict!.id}`)}
                >
                  View Existing Community
                </Button>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-700 dark:text-green-400">
                    Location Available
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    No existing communities within 2km. You can create a new community here!
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Community Details Form */}
      {conflictCheck && !conflictCheck.hasConflict && (
        <Card>
          <CardHeader>
            <CardTitle>Community Details</CardTitle>
            <CardDescription>
              Give your community a name
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Community Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Downtown Community"
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  required
                />
                {suggestedName && communityName !== suggestedName && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCommunityName(suggestedName)}
                    className="text-xs"
                  >
                    Use suggested: {suggestedName}
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  This name will be visible to all volunteers in your area
                </p>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Community Rules:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>Communities have a 2km radius</li>
                    <li>You'll automatically become a member and creator</li>
                    <li>You can invite other volunteers to join</li>
                    <li>You can organize cleanups within your community area</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button type="submit" disabled={creating || !communityName.trim()}>
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Community'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}