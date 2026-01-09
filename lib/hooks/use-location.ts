"use client";

import { useState, useEffect } from "react";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationState>(() => {
    // Check geolocation support during initial state
    if (typeof window !== 'undefined' && !navigator.geolocation) {
      return {
        latitude: null,
        longitude: null,
        loading: false,
        error: "Geolocation is not supported by your browser",
      };
    }
    return {
      latitude: null,
      longitude: null,
      loading: true,
      error: null,
    };
  });

  useEffect(() => {
    // Skip if geolocation is not supported (already handled in initial state)
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          loading: false,
          error: null,
        });
      },
      (error) => {
        setLocation({
          latitude: null,
          longitude: null,
          loading: false,
          error: error.message,
        });
      }
    );
  }, []);

  return location;
}
