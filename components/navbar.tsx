"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

type Role = "not_logged_in" | "anonymous" | "volunteer" | "organization"

const NAV_ITEMS: Record<
  Role,
  { label: string; href: string }[]
> = {
  not_logged_in: [
    { label: "Home", href: "/" },
    { label: "Report Issue", href: "/report" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Volunteer", href: "/volunteer" },
    { label: "Login", href: "/auth/login" },
  ],
  anonymous: [
    { label: "Home", href: "/" },
    { label: "Report Issue", href: "/report" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Public Map", href: "/map" },
    { label: "Volunteer", href: "/volunteers" }, // Why is there an s here? TODO: Check
    { label: "Profile", href: "/profile" },
  ],
  volunteer: [
    { label: "Reports", href: "/volunteer/reports" },
    { label: "Map", href: "/volunteer/map" },
    { label: "Community", href: "/volunteer/community" },
    { label: "Profile", href: "/profile" },
  ],
  organization: [
    { label: "Issues", href: "/org/issues" },
    { label: "Assignments", href: "/org/assignments" },
    { label: "Analytics", href: "/org/analytics" },
    { label: "Profile", href: "/profile" },
  ],
}

export function Navbar() {
  const { user, profile, loading } = useAuth()
  
  // Determine role based on auth state
  const role: Role = loading 
    ? "not_logged_in" // Show default while loading
    : !user || !profile
    ? "not_logged_in"
    : profile.role === "resident"
    ? "anonymous"
    : profile.role === "volunteer"
    ? "volunteer"
    : profile.role === "admin"
    ? "organization"
    : "anonymous" // fallback
  
  const items = NAV_ITEMS[role]

  return (
    <header className="w-full border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="text-lg font-bold">
          CleanMap
        </Link>

        {/* Desktop Nav */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="gap-2">
            {items.map((item) => (
              <NavigationMenuItem key={item.label}>
                <NavigationMenuLink asChild>
                  <Link
                    href={item.href}
                    className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Mobile Nav */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 rounded-md hover:bg-muted">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>

            <SheetContent side="right" className="w-72 pt-10">
              <nav className="flex flex-col gap-2">
                {items.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="rounded-md px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
