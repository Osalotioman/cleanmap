"use client";

import { useState, useEffect } from "react";

interface Community {
  id: string;
  name: string;
  state: string;
  centerLat: number;
  centerLon: number;
  distance: number;
  isMember: boolean;
  memberCount: number;
  creator: {
    id: string;
    name: string;
  };
}

export function useCommunities(
  latitude: number | null,
  longitude: number | null
) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCommunities() {
      if (latitude === null || longitude === null) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/communities/list?lat=${latitude}&lon=${longitude}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch communities");
        }

        const data = await response.json();
        setCommunities(data.data.communities);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchCommunities();
  }, [latitude, longitude]);

  const refetch = async () => {
    if (latitude === null || longitude === null) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/communities/list?lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      setCommunities(data.data.communities);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return { communities, loading, error, refetch };
}
