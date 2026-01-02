# CleanMap - Community Waste Management App

## Overview

**Product Name:** CleanMap
**Objective:** Enable residents and community volunteers to report, track, and monitor waste management issues in real time, improving visibility, accountability, and community engagement.  
**Hackathon Goal:** Build a functional MVP in 10 days targeting the **Best Real-World Impact** award ($500) at Alameda Hacks.  
**Target Platform:** Mobile-first web application (PWA), deployable via Vercel/Netlify.  

**Tech Stack:**
- **Frontend:** Next.js + Tailwind CSS
- **Backend / BaaS:** Supabase (Database, Auth, Storage)
- **Maps:** Leaflet.js + OpenStreetMap
- **Hosting:** Vercel
- **Optional:** Serverless functions for custom logic

## User Personas

### Resident / Citizen
- **Profile:** Lives in the community, observes waste issues, wants them resolved  
- **Goals:** Quickly report issues, see status updates, ensure action is taken  
- **Actions:** Submit waste issue, view nearby reports, track status, upvote duplicates  

### Community Volunteer / Cleanup Group
- **Profile:** Organizes cleanups, limited resources, needs hotspot data  
- **Goals:** Identify priority areas, track cleanup efforts  
- **Actions:** View hotspot map, mark cleaned issues, add notes, track impact  

### Waste Authority / Admin (Optional MVP)
- **Profile:** Local waste officer, needs structured data  
- **Goals:** Prioritize actions, track trends, respond to reports  
- **Actions:** View dashboard, update issue status, export reports  

## Features

### Must-Have (MVP)
- User authentication (email/password or social login)
- Submit a waste report:
  - Issue type (overflowing bin, illegal dump, blocked drain, etc.)
  - Location (map pin or auto-detect)
  - Optional photo upload
- Public map showing all reported issues
- Status tracking: **Reported → Acknowledged → Cleaned**
- List of reports (filter by status, type, or proximity)

### Optional / Value-Add Features
- Upvote / mark duplicate reports
- Community leaderboard or engagement points
- Weekly community cleanliness score
- Photo moderation (via serverless AI function)
- Notification on status change (push or email)
- Heatmap of urgent issues

### Backend / Custom Logic (Serverless Functions)
- Automatically mark hotspots as urgent if >3 reports in 24h
- Send notifications to volunteers or admins for urgent issues
- Weekly summary calculation for admin dashboard

## User Flow
1. Resident opens the app  
2. Submits a waste issue via form (type, location, photo)  
3. Issue is stored in Supabase DB  
4. Issue appears on public map  
5. Admin/volunteer marks as acknowledged/cleaned  
6. Status updates propagate in real-time to residents  
7. Optional analytics or weekly summary displayed on dashboard  

## MVP Scope & Timeline (10 Days)

| Day | Tasks |
|-----|-------|
| 1-2 | Setup project, Next.js + Tailwind, Supabase integration, Auth setup |
| 3   | Build waste report form, location capture, photo upload |
| 4   | Display reports on map (Leaflet.js), filter functionality |
| 5   | Status tracking system, update functionality |
| 6   | Build list view of issues, filters, sorting |
| 7   | Optional: Upvote / duplicate detection, notifications |
| 8   | Optional: Hotspot calculation, heatmap, weekly summary |
| 9   | Polish UI, responsive design, test flows, bug fixes |
| 10  | Record demo video (2–3 min), prepare Devpost submission |

## Success Metrics
- Functional MVP: report → map → status update works end-to-end  
- Ease of use: form submission <30s for residents  
- Visual clarity: map & list show issues and statuses clearly  
- Judge criteria: Real-World Impact, End-to-End Solution, Pitch & Demo readiness  

## Deliverables
- Live PWA hosted on Vercel  
- Supabase project (DB, Auth, Storage, optional Edge Functions)  
- Demo video (2–3 minutes)  
- Devpost submission:
  - Project description
  - Purpose / impact
  - How it works
  - Codebase link
- Optional: analytics dashboard / heatmap for judges  

## Constraints / Notes
- Build must be completed in 10 days  
- MVP must be functional and demonstrable  
- Optional features are not required to compete but may improve judging  
- Keep scope realistic: focus on one community or campus for data  

---
