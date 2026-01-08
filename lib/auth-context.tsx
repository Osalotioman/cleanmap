/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application.
 * Uses Supabase for session management and custom JWT tokens.
 * 
 * @module lib/auth-context
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from './supabase/client';
import type { User } from '@supabase/supabase-js';

/**
 * User profile data from Prisma
 */
interface UserProfile {
  id: string;
  email: string;
  role: string;
  status: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Authentication context value
 */
interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Authentication Provider Component
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Validate only client-side (NEXT_PUBLIC_*) environment variables
    if (typeof window !== 'undefined') {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error(
          'Missing required environment variables:\n',
          '- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗',
          '\n- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓' : '✗'
        );
      }
    }

    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        
        // Get stored token
        const storedToken = localStorage.getItem('auth_token');
        const storedProfile = localStorage.getItem('user_profile');
        
        if (storedToken) setToken(storedToken);
        if (storedProfile) setProfile(JSON.parse(storedProfile));
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      
      if (!session) {
        // Clear stored data on logout
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_profile');
        setToken(null);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const data = await response.json();
          errorMessage = data.error || data.message || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Invalid response from server');
      }

      // Store token and profile
      localStorage.setItem('auth_token', data.data.token);
      localStorage.setItem('user_profile', JSON.stringify(data.data.user));
      
      setToken(data.data.token);
      setProfile(data.data.user);
      setUser(data.data.user);
    } catch (error) {
      console.error('Sign in error:', error);
      // Provide user-friendly error messages
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign up with email and password
   */
  const signUp = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => {
    setLoading(true);
    try {
      // Basic client-side validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      if (!response.ok) {
        let errorMessage = 'Signup failed';
        try {
          const data = await response.json();
          errorMessage = data.error || data.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Invalid response from server');
      }

      return data;
    } catch (error) {
      console.error('Sign up error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      
      // Clear local storage even if Supabase signout fails
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_profile');
      setToken(null);
      setProfile(null);
      setUser(null);

      if (error) {
        console.error('Supabase sign out error:', error);
        // Don't throw error - user is logged out locally
      }
    } catch (error) {
      console.error('Sign out error:', error);
      // Clear state anyway
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_profile');
      setToken(null);
      setProfile(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh user profile data
   */
  const refreshProfile = async () => {
    if (!user) return;

    try {
      // Re-fetch profile using the stored token
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        // You can add a profile endpoint later
        // For now, we'll just keep the cached profile
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const value: AuthContextValue = {
    user,
    profile,
    token,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use authentication context
 * 
 * @example
 * const { user, signIn, signOut } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
