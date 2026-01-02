# AI Coding Agent Principles for CleanMap

## Project Focus
- Build a **mobile-first PWA** for community waste management.
- Prioritize **real-time reporting, tracking, and status updates** of waste issues.
- Ensure all features align with the **MVP scope** and enhance **user experience**.

---

## Coding Principles

### Component & File Patterns
- Default exports for page components (required by Next.js App Router)
- Use **TypeScript** for all `.tsx` files
- Server Components by default; `"use client"` only when client-side interactivity is needed
- Prioritize **ShadCN UI components** for UI primitives (Button, Card, Input, Select, Dialog)
- Compose ShadCN components instead of recreating existing primitives
- Export `metadata` object from page/layout files for SEO

### Styling Guidelines
- Use **Tailwind CSS v4 utility classes** inline with `className`
- Dark mode: use `dark:` prefix (e.g., `dark:bg-black`, `dark:text-zinc-50`)
- Responsive design: use breakpoint prefixes (`sm:`, `md:`, `lg:`)
- Global theme variables: `--background`, `--foreground`; use `prefers-color-scheme` for dark mode
- Fonts: Geist Sans and Geist Mono as CSS variables (`--font-geist-sans`, `--font-geist-mono`)

### Supabase & Backend Principles
- Follow **Row Level Security (RLS)** patterns for data access
- Real-time updates for waste report status on map/dashboard
- Storage bucket: `waste-photos` for user-uploaded images
- Auth: Supabase Auth patterns; integrate with Server Components where possible

### Map & Location Features
- Leaflet.js components must be client-side (`"use client"`)
- Map markers reflect **status**: red=reported, yellow=acknowledged, green=cleaned
- Map pin selection for location input in forms
- Optional: heatmap layer for urgent report visualization

### TypeScript & Project Structure
- Path alias: `@/*` maps to project root
- Strict mode enabled
- Target: ES2017
- JSX: `react-jsx` transform

### ESLint & Code Quality
- Follow modern flat ESLint config
- Use Next.js ESLint presets (`core-web-vitals` and `typescript`)
- Ignore build/output folders (`.next/`, `out/`, `build/`)

---

## Component & Page Guidelines
- Default export for all pages
- Use Next.js `Image` component for images
- Server Components preferred; `"use client"` only when hooks, event handlers, or browser APIs are required
- Compose pages and components to follow **MVP features**: report submission, public map, status tracking, list view
- Metadata must be exported for each page/layout

### Adding Pages or Components
- Create page in `app/` directory
- Add `page.tsx` with default export
- Optionally, add `layout.tsx` for route-specific layout
- Use `"use client"` directive only for client-side interactivity

---

## Feature Implementation Principles

### MVP Features
- User authentication (email/password or social login)
- Waste report submission: type, location, optional photo
- Public map displaying reports
- Status tracking workflow: Reported → Acknowledged → Cleaned
- List view with filtering by status, type, proximity

### Optional/Value-Add Features
- Upvote/duplicate detection
- Leaderboard or engagement points
- Weekly community cleanliness score
- Notifications on status change
- Heatmap for urgent areas

---

## AI Agent Guidelines
- Always follow **project coding conventions** and **MVP priorities**
- Do **not introduce external patterns** outside the tech stack
- Ensure components are **composable, maintainable, and consistent**
- Keep all features aligned with **real-time updates, responsiveness, and mobile-first design**
- Use **ShadCN UI primitives** wherever applicable
- Maintain **strict TypeScript typing** for all files
- Respect **project folder structure and Next.js App Router conventions**
