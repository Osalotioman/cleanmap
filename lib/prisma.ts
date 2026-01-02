/**
 * Prisma Client Singleton
 * 
 * This module ensures only one Prisma Client instance is created throughout
 * the application lifecycle, preventing connection exhaustion in serverless
 * environments.
 * 
 * @module lib/prisma
 */

import { PrismaClient } from '@prisma/client';

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Prisma Client configuration with logging
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: isDevelopment ? ['query', 'error', 'warn'] : ['error'],
  });
};

/**
 * Type for the Prisma Client singleton
 */
type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

/**
 * Global variable to store the Prisma Client instance in development
 * This prevents multiple instances during hot reloading
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

/**
 * Prisma Client instance
 * 
 * In development: Uses a global variable to persist across hot reloads
 * In production: Creates a new instance for each deployment
 * 
 * @example
 * import { prisma } from '@/lib/prisma';
 * 
 * const user = await prisma.user.findUnique({
 *   where: { email: 'user@example.com' }
 * });
 */
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (isDevelopment) {
  globalForPrisma.prisma = prisma;
}

/**
 * Gracefully disconnect Prisma Client on process termination
 */
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}
