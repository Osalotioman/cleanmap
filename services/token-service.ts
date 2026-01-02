/**
 * JWT Token Service
 * 
 * Handles generation and verification of application-level JWT tokens.
 * These tokens are separate from Supabase session tokens and provide
 * app-specific authentication.
 * 
 * @module services/token-service
 */

import jwt from 'jsonwebtoken';
import { env } from '../lib/env';

/**
 * JWT Token Payload structure
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Decoded token with standard JWT claims
 */
export interface DecodedToken extends TokenPayload {
  iat: number; // Issued at
  exp: number; // Expiration time
}

/**
 * Token generation options
 */
interface TokenOptions {
  expiresIn?: string; // e.g., '7d', '1h', '30m'
}

/**
 * Generates a JWT token for a user
 * 
 * @param payload - User information to encode in the token
 * @param options - Token generation options (expiration, etc.)
 * @returns Signed JWT token string
 * 
 * @example
 * const token = generateToken({
 *   userId: user.id,
 *   email: user.email,
 *   role: user.role,
 * });
 */
export function generateToken(
  payload: TokenPayload,
  options: TokenOptions = {}
): string {
  const expiresIn = options.expiresIn || '7d';

  return jwt.sign(payload, env.APP_JWT_SECRET, {
    expiresIn: expiresIn as `${number}${'d' | 'h' | 'm' | 's' | 'ms'}`,
    issuer: 'cleanmap-api',
    audience: 'cleanmap-app',
  });
}

/**
 * Verifies and decodes a JWT token
 * 
 * @param token - JWT token string to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 * 
 * @example
 * try {
 *   const decoded = verifyToken(token);
 *   console.log('User ID:', decoded.userId);
 * } catch (error) {
 *   console.error('Invalid token:', error.message);
 * }
 */
export function verifyToken(token: string): DecodedToken {
  try {
    const decoded = jwt.verify(token, env.APP_JWT_SECRET, {
      issuer: 'cleanmap-api',
      audience: 'cleanmap-app',
    }) as DecodedToken;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Decodes a token without verifying its signature
 * 
 * ⚠️ WARNING: This does NOT verify the token's authenticity.
 * Only use for debugging or inspection purposes.
 * 
 * @param token - JWT token string to decode
 * @returns Decoded token payload or null if invalid
 * 
 * @example
 * const payload = decodeTokenUnsafe(token);
 * console.log('Token expires at:', new Date(payload.exp * 1000));
 */
export function decodeTokenUnsafe(token: string): DecodedToken | null {
  try {
    return jwt.decode(token) as DecodedToken;
  } catch {
    return null;
  }
}

/**
 * Checks if a token is expired without verifying signature
 * 
 * @param token - JWT token string to check
 * @returns True if token is expired, false otherwise
 * 
 * @example
 * if (isTokenExpired(token)) {
 *   console.log('Token needs refresh');
 * }
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeTokenUnsafe(token);
  if (!decoded || !decoded.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
}

/**
 * Refreshes a token by generating a new one with the same payload
 * 
 * @param token - Existing token to refresh
 * @returns New token with extended expiration
 * @throws Error if token is invalid
 * 
 * @example
 * try {
 *   const newToken = refreshToken(oldToken);
 *   // Send newToken to client
 * } catch (error) {
 *   // Token invalid, require re-authentication
 * }
 */
export function refreshToken(token: string): string {
  const decoded = verifyToken(token);

  // Create new token with same payload but fresh expiration
  return generateToken({
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
  });
}
