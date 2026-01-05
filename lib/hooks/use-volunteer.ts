"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

interface Volunteer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export function useVolunteer() {
  const { user } = useAuth();
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVolunteer() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/volunteer/profile");

        if (!response.ok) {
          throw new Error("Failed to fetch volunteer profile");
        }

        const data = await response.json();
        setVolunteer(data.data.volunteer);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchVolunteer();
  }, [user]);

  return { volunteer, loading, error };
}
