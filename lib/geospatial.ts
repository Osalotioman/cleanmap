/**
 * Geospatial utility functions for location-based queries
 * Uses Haversine formula for distance calculations
 */

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Fetch location details from coordinates using Nominatim
 * @param lat Latitude
 * @param lon Longitude
 * @returns Location data including state and locality
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<{
  suburb?: string;
  town?: string;
  city?: string;
  state?: string;
  country?: string;
}> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "CleanMap/1.0",
    },
  });

  if (!response.ok) {
    throw new Error("Geocoding failed");
  }

  const data = await response.json();
  return data.address || {};
}

/**
 * Generate a community name from coordinates
 * @param lat Latitude
 * @param lon Longitude
 * @returns Suggested community name
 */
export async function generateCommunityName(
  lat: number,
  lon: number
): Promise<{ name: string; state: string }> {
  const location = await reverseGeocode(lat, lon);

  const locality =
    location.suburb || location.town || location.city || "Unknown";
  const state = location.state || "Unknown State";

  return {
    name: `${locality} Community`,
    state,
  };
}

/**
 * Check if a point is within a radius of another point
 * @param centerLat Center point latitude
 * @param centerLon Center point longitude
 * @param pointLat Test point latitude
 * @param pointLon Test point longitude
 * @param radiusMeters Radius in meters
 * @returns True if point is within radius
 */
export function isWithinRadius(
  centerLat: number,
  centerLon: number,
  pointLat: number,
  pointLon: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(centerLat, centerLon, pointLat, pointLon);
  return distance <= radiusMeters;
}

/**
 * Find all items within a radius of a point
 * @param items Array of items with lat/lon properties
 * @param centerLat Center point latitude
 * @param centerLon Center point longitude
 * @param radiusMeters Radius in meters
 * @returns Filtered items within radius with distances
 */
export function filterByRadius<
  T extends { latitude: number; longitude: number },
>(
  items: T[],
  centerLat: number,
  centerLon: number,
  radiusMeters: number
): Array<T & { distance: number }> {
  return items
    .map((item) => ({
      ...item,
      distance: calculateDistance(
        centerLat,
        centerLon,
        item.latitude,
        item.longitude
      ),
    }))
    .filter((item) => item.distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Validate latitude and longitude values
 * @param lat Latitude
 * @param lon Longitude
 * @returns True if valid coordinates
 */
export function isValidCoordinates(lat: number, lon: number): boolean {
  return (
    typeof lat === "number" &&
    typeof lon === "number" &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180 &&
    !isNaN(lat) &&
    !isNaN(lon)
  );
}
