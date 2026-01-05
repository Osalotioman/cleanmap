import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar"
import { AuthProvider } from "@/lib/auth-context";
import { validateEnv } from "@/lib/env";

// Validate server-side environment variables on app startup
// This runs once on the server, not in the browser
if (typeof window === 'undefined') {
  try {
    validateEnv();
  } catch (error) {
    console.error('Server environment validation failed:', error);
    // In production, you might want to throw here to prevent app startup
    // throw error;
  }
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CleanMap - Community Waste Management",
  description: "Report, track, and monitor waste management issues in real-time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
