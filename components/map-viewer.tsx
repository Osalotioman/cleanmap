'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2, MapPin } from 'lucide-react';

interface MapViewerProps {
  center?: [number, number]; // [lat, lon]
  zoom?: number;
  reports?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    status: string;
    description?: string | null;
  }>;
  communities?: Array<{
    id: string;
    name: string;
    centerLat: number;
    centerLon: number;
    radius: number;
  }>;
  onReportClick?: (reportId: string) => void;
  onCommunityClick?: (communityId: string) => void;
  onMapClick?: (lat: number, lon: number) => void;
  height?: string;
  enableClickToSelect?: boolean;
}

export function MapViewer({
  center = [6.3350, 5.6037], // Default to Benin City, Nigeria
  zoom = 13,
  reports = [],
  communities = [],
  onReportClick,
  onCommunityClick,
  onMapClick,
  height = '500px',
  enableClickToSelect = false,
}: MapViewerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [map, setMap] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [leaflet, setLeaflet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);

  // Dynamically import Leaflet (client-side only)
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        const L = await import('leaflet');
        // @ts-expect-error - CSS import needed for Leaflet styles
        await import('leaflet/dist/leaflet.css');
        
        // Fix default marker icons
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        setLeaflet(L);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load Leaflet:', error);
        setLoading(false);
      }
    };

    loadLeaflet();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leaflet || !mapRef.current || map) return;

    const newMap = leaflet.map(mapRef.current).setView(center, zoom);

    leaflet
      .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      })
      .addTo(newMap);

    // Add click handler
    if (enableClickToSelect || onMapClick) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newMap.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        setSelectedLocation([lat, lng]);
        onMapClick?.(lat, lng);
      });
    }

    setMap(newMap);

    return () => {
      newMap.remove();
    };
  }, [leaflet, center, zoom, enableClickToSelect, onMapClick, map]);

  // Update markers when reports change
  useEffect(() => {
    if (!map || !leaflet || !reports) return;

    // Clear existing markers (except selected location)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.eachLayer((layer: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (layer instanceof leaflet.Marker && layer !== (map as any).selectedMarker) {
        map.removeLayer(layer);
      }
    });

    // Add report markers
    reports.forEach((report) => {
      const color = 
        report.status === 'pending' ? 'red' : 
        report.status === 'scheduled' ? 'blue' : 
        'green';

      const icon = leaflet.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${color};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
            </svg>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = leaflet
        .marker([report.latitude, report.longitude], { icon })
        .addTo(map);

      if (report.description) {
        marker.bindPopup(`
          <div style="max-width: 200px;">
            <strong>Report</strong><br/>
            <span style="font-size: 12px; color: #666;">
              ${report.description}
            </span>
          </div>
        `);
      }

      if (onReportClick) {
        marker.on('click', () => onReportClick(report.id));
      }
    });
  }, [map, leaflet, reports, onReportClick]);

  // Update community circles
  useEffect(() => {
    if (!map || !leaflet || !communities) return;

    // Clear existing circles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.eachLayer((layer: any) => {
      if (layer instanceof leaflet.Circle) {
        map.removeLayer(layer);
      }
    });

    // Add community circles
    communities.forEach((community) => {
      const circle = leaflet
        .circle([community.centerLat, community.centerLon], {
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          radius: community.radius,
        })
        .addTo(map);

      circle.bindPopup(`
        <div style="max-width: 200px;">
          <strong>${community.name}</strong><br/>
          <span style="font-size: 12px; color: #666;">
            Radius: ${(community.radius / 1000).toFixed(1)}km
          </span>
        </div>
      `);

      if (onCommunityClick) {
        circle.on('click', () => onCommunityClick(community.id));
      }
    });
  }, [map, leaflet, communities, onCommunityClick]);

  // Update selected location marker
  useEffect(() => {
    if (!map || !leaflet || !selectedLocation) return;

    // Remove previous selected marker
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((map as any).selectedMarker) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.removeLayer((map as any).selectedMarker);
    }

    // Add new selected marker
    const marker = leaflet
      .marker(selectedLocation, {
        icon: leaflet.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background-color: #ef4444;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              border: 4px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              </svg>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
      })
      .addTo(map);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (map as any).selectedMarker = marker;
    map.setView(selectedLocation, map.getZoom());
  }, [map, leaflet, selectedLocation]);

  if (loading) {
    return (
      <Card className="flex items-center justify-center" style={{ height }}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading map...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative">
      <div ref={mapRef} style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border" />
      
      {enableClickToSelect && selectedLocation && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-red-500" />
            <span className="font-medium">
              Selected: {selectedLocation[0].toFixed(4)}, {selectedLocation[1].toFixed(4)}
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      <Card className="absolute top-4 right-4 p-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur">
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
            <span>Cleaned</span>
          </div>
          {communities.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <div className="w-3 h-3 rounded-full bg-blue-500 opacity-30 border border-blue-500" />
              <span>Community</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}