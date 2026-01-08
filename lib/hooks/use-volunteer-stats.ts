"use client";

import { useState, useEffect } from "react";

export interface VolunteerStats {
  myCommunities: number;
  nearbyReports: number;
  scheduledEvents: number;
}

export function useVolunteerStats(
  latitude: number | null,
  longitude: number | null
) {
  const [stats, setStats] = useState<VolunteerStats>({
    myCommunities: 0,
    nearbyReports: 0,
    scheduledEvents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (latitude === null || longitude === null) {
      setLoading(false);
      return;
    }

    async function fetchStats() {
      try {
        const response = await fetch(
          `/api/volunteer/stats?lat=${latitude}&lon=${longitude}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch volunteer stats");
        }

        const data = await response.json();
        setStats(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [latitude, longitude]);

  return { stats, loading, error };
}
