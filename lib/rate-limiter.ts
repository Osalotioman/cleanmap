/**
 * Rate limiting utility for anonymous report submissions
 * Tracks submissions by device ID stored in localStorage
 */

import { prisma } from "./prisma";

const RATE_LIMIT = 5; // Max reports per 24 hours
const TIME_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Check if a device has exceeded the rate limit
 * @param deviceId Unique device identifier
 * @returns Object with canSubmit flag and remaining count
 */
export async function checkRateLimit(deviceId: string): Promise<{
  canSubmit: boolean;
  remaining: number;
  resetAt: Date;
}> {
  const windowStart = new Date(Date.now() - TIME_WINDOW);

  const recentReports = await prisma.report.count({
    where: {
      deviceId,
      createdAt: {
        gte: windowStart,
      },
    },
  });

  const remaining = Math.max(0, RATE_LIMIT - recentReports);
  const canSubmit = remaining > 0;

  // Calculate when the limit resets (24 hours from oldest report in window)
  const oldestReport = await prisma.report.findFirst({
    where: {
      deviceId,
      createdAt: {
        gte: windowStart,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      createdAt: true,
    },
  });

  const resetAt = oldestReport
    ? new Date(oldestReport.createdAt.getTime() + TIME_WINDOW)
    : new Date(Date.now() + TIME_WINDOW);

  return {
    canSubmit,
    remaining,
    resetAt,
  };
}

/**
 * Generate a device ID for client-side storage
 * @returns Unique device identifier
 */
export function generateDeviceId(): string {
  return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Client-side function to get or create device ID
 * Should be called from the browser only
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") {
    throw new Error("getDeviceId can only be called on the client side");
  }

  let deviceId = localStorage.getItem("cleanmap_device_id");

  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem("cleanmap_device_id", deviceId);
  }

  return deviceId;
}
