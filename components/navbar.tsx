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

const NAV_ITEMS: Record<Role, { label: string; href?: string }[]> = {
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
    { label: "Volunteer", href: "/volunteer" },
    { label: "Profile", href: "/profile" },
  ],
  volunteer: [
    { label: "Home", href: "/" },
    { label: "Reports", href: "/volunteer/reports" },
    { label: "Map", href: "/volunteer/map" },
    { label: "Communities", href: "/volunteer/my-communities" },
    { label: "Profile", href: "/profile" },
  ],
  organization: [
    { label: "Home", href: "/" },
    { label: "Issues", href: "/org/issues" },
    { label: "Assignments", href: "/org/assignments" },
    { label: "Analytics", href: "/org/analytics" },
    { label: "Profile", href: "/profile" },
  ],
}

export function Navbar() {
  const { user, profile, loading, signOut } = useAuth()

  const role: Role = loading
    ? "not_logged_in"
    : !user || !profile
    ? "not_logged_in"
    : profile.role === "resident"
    ? "anonymous"
    : profile.role === "volunteer"
    ? "volunteer"
    : profile.role === "admin"
    ? "organization"
    : "anonymous"

  const items = [...NAV_ITEMS[role]]

  // Add Sign Out link if logged in
  if (user && profile) {
    items.push({
      label: "Sign Out",
      href: "#signout",
    })
  }

  const handleClick = (href?: string) => {
    if (href === "#signout") signOut()
  }

  const renderLink = (item: { label: string; href?: string }) => (
    <NavigationMenuItem key={item.label}>
      <NavigationMenuLink asChild>
        <a
          href={item.href || "#"}
          onClick={() => handleClick(item.href)}
          className="px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {item.label}
        </a>
      </NavigationMenuLink>
    </NavigationMenuItem>
  )

  return (
    <header className="w-full border-b bg-background">
      <div className="flex h-16 items-center justify-between px-2 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="text-lg font-bold">
          CleanMap
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              {items.map(renderLink)}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

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
                  <a
                    key={item.label}
                    href={item.href || "#"}
                    onClick={() => handleClick(item.href)}
                    className="rounded-md px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
