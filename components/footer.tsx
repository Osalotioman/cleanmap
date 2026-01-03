
export function Footer() {
  return (
    <footer className="border-t border-border bg-background px-6 py-8 text-center text-sm text-muted-foreground">
      <div className="mx-auto max-w-5xl space-y-4">
        <p>
          CleanMap · Built for community-driven waste management
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-xs">
          <a href="/about" className="hover:text-foreground transition-colors">
            About
          </a>
          <a href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </a>
          <a href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </a>
          <a href="/contact" className="hover:text-foreground transition-colors">
            Contact
          </a>
        </div>
        <p className="text-xs">
          © {new Date().getFullYear()} CleanMap. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default footer