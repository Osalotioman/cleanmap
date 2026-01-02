# CleanMap - Quick Start Guide

## Project Scaffolding Complete ✅

The following structure has been created:

```
waste-watch/
├── .github/
│   └── copilot-instructions.md    # AI agent instructions
├── app/
│   ├── dashboard/
│   │   └── page.tsx                # Admin/volunteer dashboard
│   ├── map/
│   │   └── page.tsx                # Public map view
│   ├── report/
│   │   └── page.tsx                # Report submission form
│   ├── globals.css
│   ├── layout.tsx                  # Root layout with Navbar
│   └── page.tsx                    # Home page
├── components/
│   ├── navbar.tsx                  # Navigation bar
│   └── status-badge.tsx            # Status indicator component
├── lib/
│   ├── supabase.ts                 # Server-side Supabase client
│   └── supabase-browser.ts         # Client-side Supabase client
├── types/
│   └── database.ts                 # TypeScript types and database schema
└── .env.local.example              # Environment variables template
```

## Next Steps

### 1. Setup Supabase
1. Create a Supabase project at https://app.supabase.com
2. Copy `.env.local.example` to `.env.local`
3. Add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### 2. Create Database Tables
Run these SQL commands in Supabase SQL Editor:

```sql
-- Enable PostGIS for location data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table (extends Supabase Auth)
CREATE TABLE users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'resident' CHECK (role IN ('resident', 'volunteer', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Waste reports table
CREATE TABLE waste_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  issue_type TEXT NOT NULL CHECK (issue_type IN ('overflowing_bin', 'illegal_dump', 'blocked_drain', 'litter', 'other')),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  photo_url TEXT,
  description TEXT,
  status TEXT DEFAULT 'reported' CHECK (status IN ('reported', 'acknowledged', 'cleaned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Report votes table (for upvoting duplicates)
CREATE TABLE report_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  report_id UUID REFERENCES waste_reports(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, report_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read all user profiles
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Anyone can view waste reports
CREATE POLICY "Anyone can view reports" ON waste_reports FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reports" ON waste_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reports" ON waste_reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Volunteers and admins can update any report" ON waste_reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('volunteer', 'admin'))
);

-- Report votes policies
CREATE POLICY "Anyone can view votes" ON report_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON report_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON report_votes FOR DELETE USING (auth.uid() = user_id);
```

### 3. Create Storage Bucket
1. Go to Supabase Storage
2. Create a new bucket named `waste-photos`
3. Make it public for read access
4. Set file size limit (e.g., 5MB)

### 4. Install Additional Dependencies
```bash
# For map functionality
pnpm add leaflet react-leaflet
pnpm add -D @types/leaflet

# For form handling (optional)
pnpm add react-hook-form zod @hookform/resolvers

# For date handling (optional)
pnpm add date-fns
```

### 5. Run Development Server
```bash
pnpm dev
```

Visit http://localhost:3000 to see the app!

## Development Workflow

### Key Routes
- `/` - Home page with overview
- `/report` - Submit waste report form
- `/map` - Interactive map of all reports
- `/dashboard` - Admin/volunteer dashboard

### Component Structure
- **Server Components** (default): Use for data fetching from Supabase
- **Client Components** (`"use client"`): Use for interactive features, maps, forms

### Status Workflow
Reports follow this status flow:
1. **Reported** (red) - New issue submitted
2. **Acknowledged** (yellow) - Volunteer/admin has seen it
3. **Cleaned** (green) - Issue resolved

## Ready to Build! 🚀

The scaffolding provides:
- ✅ Complete routing structure
- ✅ Supabase integration setup
- ✅ TypeScript types and database schema
- ✅ Reusable components (Navbar, StatusBadge)
- ✅ Mobile-first responsive design
- ✅ Dark mode support

Start implementing features in the placeholder pages!
