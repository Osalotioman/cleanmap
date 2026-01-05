# Product Requirements Document (PRD)

# CleanMap - Community Waste Management Platform

---

## 1. Executive Summary

### Product Name

**CleanMap**

### Objective

A decentralized, location-based platform enabling anonymous citizens to report waste issues while empowering local volunteers to form communities, coordinate cleanups, and verify completion through collective action.

### Core Philosophy

**"Anonymity for Safety, Community for Action, Local Verification"**

Users must be physically present in a region to create or impact communities, ensuring authentic local engagement.

### Hackathon Goal

Build a functional MVP in **9 days** targeting the **Best Real-World Impact Award ($500)** at Alameda Hacks.

---

## 2. Technical Architecture

### Tech Stack (Free Tier Optimized)

**Frontend**

- Next.js (App Router) with TypeScript
- Tailwind CSS for styling
- PWA capabilities for mobile-first experience

**Backend/Database**

- Supabase (PostgreSQL with PostGIS extension)
- Supabase Auth (email/password authentication)
- Supabase Storage (image uploads)

**Geospatial Engine**

- PostGIS: Efficient spatial queries (nearest neighbor, radius calculations)
- Nominatim API (OpenStreetMap): Reverse geocoding (coordinates → state/town names)
- No API key required for OpenStreetMap

**Maps & Visualization**

- Leaflet.js (via react-leaflet): Map rendering
- OpenStreetMap Tiles: Free base map provider

**Hosting**

- Vercel (Frontend + Serverless Functions)

---

## 3. User Personas & Roles

### 3.1 Anonymous Reporter (No Login)

**Profile**: Any citizen concerned about waste in their area

**Goals**

- Report waste issues quickly and safely
- Maintain privacy and anonymity
- See that action is being taken

**Key Actions**

- Submit waste reports with optional photos
- View public map of reported issues
- Optionally convert to volunteer

**Technical Constraints**

- Max 5 reports per 24 hours (tracked via browser LocalStorage Device ID)
- No personal data collected

---

### 3.2 Volunteer (Login Required)

**Profile**: Community-minded individuals willing to organize cleanups

**Goals**

- Create or join local cleanup communities
- Coordinate with other volunteers
- Track cleanup impact in their area

**Key Actions**

- Create new communities (if none exist nearby)
- Join existing communities
- View reports within community boundaries
- Schedule cleanup events
- RSVP to cleanup events
- Mark reports as cleaned
- Dispute false cleanup claims

**Technical Constraints**

- Location must be actively detected (not saved permanently)
- Can only interact with communities in their current state

---

### 3.3 Government/Company (Future Roadmap)

**Profile**: Waste management authorities or private cleanup companies

**Status**: Not included in MVP - moved to post-hackathon roadmap

---

## 4. Core Features & User Flows

### 4.1 Anonymous Reporting Flow

#### Landing Experience

1. User arrives at homepage
2. App requests location permission
3. Big CTA: **"Report Waste Now"**

#### Report Submission

**Form Fields:**

- **Photo**: Optional (uploaded to Supabase Storage)
- **Location**:
  - Auto-detected via GPS (primary method)
  - Manual adjustment via draggable map pin (fallback)
- **Description**: Optional text field

**Validation:**

- Device ID check: Has this device reported 5+ times in last 24h?
  - If YES: Block with message "Daily limit reached. Try again tomorrow."
  - If NO: Allow submission

**Post-Submission:**

- Thank you message
- CTA: "Want to help clean up? Become a volunteer!"
- Link to volunteer signup page

---

### 4.2 Volunteer Community System

#### Core Concept: Location-Locked Communities

A **Community** is defined as:

- A geographic circle with a **center point** (latitude/longitude)
- A **2km radius** defining strict membership boundary
- A **2.5km visibility buffer** for "nearby opportunities"
- Tagged with a **State** (for filtering)

#### Community Discovery

**Dashboard Structure:**
Two main tabs:

1. **Reports Tab**: Shows nearby anonymous reports (within 5km)
2. **Communities Tab**: Shows joinable communities

**Location Detection:**

- App checks current GPS location each session
- Reverse geocodes to determine current **State**
- Location is **NOT saved permanently** (privacy-first)

**Filtering Logic:**

- **Hard Filter**: Only show communities where `community.state == user_current_state`
- **Soft Sort**: Display 3 nearest communities first (by distance)
- **Search Option**: Override and search all communities within current state

**Actions Available:**

- View community details
- Join community
- Create new community (if eligible)

---

### 4.3 Creating a Community

#### Trigger

Volunteer clicks **"Create Community"** button

#### Step 1: Conflict Check (2km Radius Rule)

**Query Logic:**

```sql
SELECT * FROM communities
WHERE ST_DWithin(
  center_location::geography,
  ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography,
  2000 -- 2km in meters
);
```

**Decision:**

- **If existing community found within 2km:**

  - Block creation
  - Show: _"A community already exists here: [Name] (1.2km away). Join them instead!"_
  - Display "Join" button

- **If no conflicts:**

  - Proceed to Step 2

#### Step 2: Auto-Naming via Nominatim API

**API Call:**

```
GET https://nominatim.openstreetmap.org/reverse?
  lat={user_lat}&lon={user_lon}&format=json
```

**Response Processing:**

- Extract `suburb`, `town`, or `neighbourhood` field
- Extract `state` field
- Pre-fill community name: "{Location} Community" (e.g., "Ugbowo Community")
- User can edit name before final submission

#### Step 3: Creation

- Store community in database
- User becomes **Community Creator** (has admin privileges)
- Automatically joins the community

---

### 4.4 Report Association & Buffer Zone

#### Membership Rules

**Strict Boundary (2km)**

- Reports within 2km of community center are **core members**
- Displayed in main "Community Reports" list

**Buffer Zone (2km - 2.5km)**

- Reports in this range shown as **"Nearby Opportunities"**
- Volunteers can choose to extend cleanup efforts here
- Prevents communities from missing edge cases

#### SQL Query Example

```sql
-- Core Reports
SELECT * FROM reports
WHERE ST_DWithin(
  location::geography,
  community.center_location::geography,
  2000
) AND status != 'cleaned';

-- Buffer Reports
SELECT * FROM reports
WHERE ST_DWithin(
  location::geography,
  community.center_location::geography,
  2500
) AND NOT ST_DWithin(
  location::geography,
  community.center_location::geography,
  2000
) AND status != 'cleaned';
```

---

### 4.5 Cleanup Coordination: The Event System

#### Philosophy

Instead of complex chat systems, use a **structured event model** with RSVP and comments.

---

#### Lifecycle of a Cleanup

**Stage 1: Discussion**

- Volunteers view a **Pending Report**
- Simple **Comments Section** attached to report
- Volunteers discuss: "I'm free Saturday", "I can bring bags"

**Stage 2: Scheduling**

- Any volunteer clicks **"Schedule Cleanup"**
- Selects **Date & Time**
- Becomes **Event Leader**
- Report status changes: `pending` → `scheduled`

**Stage 3: RSVP**

- Other volunteers see the scheduled event
- Click **"Join Cleanup"** (RSVP)
- Creates list of confirmed attendees

**Stage 4: Cancellation (Optional)**

- If no one joins OR plans change
- Event Leader can click **"Cancel Event"**
- Report status reverts: `scheduled` → `pending`
- Report becomes available for others to schedule

**Stage 5: Completion**

- After scheduled time passes
- Event Leader clicks **"Mark as Cleaned"**
- Triggers **Dispute Phase**

---

#### Verification: The 80% Consensus Rule

**Dispute Window:**

- Duration: **24 hours** after marking cleaned
- Notification sent to all RSVP'd volunteers
- Volunteers can click **"Dispute"** if area wasn't actually cleaned

**Voting Logic:**

**Scenario A: Single Volunteer**

- If only 1 person scheduled cleanup (no other RSVPs)
- Their vote counts as 100%
- Report immediately marked `cleaned`

**Scenario B: Multiple Volunteers**

- Calculate dispute percentage: `(disputes / total_attendees) * 100`
- **If dispute % < 20%**: Report remains `cleaned`
- **If dispute % ≥ 20%**: Report reverts to `pending`

**Example:**

- 5 people RSVP'd
- 1 person disputes (20%)
- Status: Report reverts to `pending`

---

## 5. Database Schema

### Enable Spatial Extension

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Tables

#### reports

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location GEOGRAPHY(Point, 4326) NOT NULL,
  description TEXT,
  image_url TEXT,
  device_id TEXT NOT NULL, -- For rate limiting
  status TEXT DEFAULT 'pending', -- pending | scheduled | cleaned
  created_at TIMESTAMP DEFAULT NOW()
);

-- Spatial index for performance
CREATE INDEX idx_reports_location ON reports USING GIST(location);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_device_id ON reports(device_id, created_at);
```

#### communities

```sql
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  state TEXT NOT NULL, -- From Nominatim API
  center_location GEOGRAPHY(Point, 4326) NOT NULL,
  radius INTEGER DEFAULT 2000, -- meters
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_communities_location ON communities USING GIST(center_location);
CREATE INDEX idx_communities_state ON communities(state);
```

#### volunteers (extends Supabase auth.users)

```sql
CREATE TABLE volunteers (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### community_members

```sql
CREATE TABLE community_members (
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (community_id, volunteer_id)
);
```

#### cleanup_events

```sql
CREATE TABLE cleanup_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id),
  report_id UUID REFERENCES reports(id),
  leader_id UUID REFERENCES volunteers(id),
  scheduled_at TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'scheduled', -- scheduled | completed | cancelled | disputed
  marked_cleaned_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### event_attendees (RSVP tracking)

```sql
CREATE TABLE event_attendees (
  event_id UUID REFERENCES cleanup_events(id) ON DELETE CASCADE,
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
  rsvp_status TEXT DEFAULT 'attending', -- attending | disputed
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (event_id, volunteer_id)
);
```

#### comments

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  volunteer_id UUID REFERENCES volunteers(id),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 6. API Integrations

### Nominatim Reverse Geocoding

**Purpose**: Convert GPS coordinates to human-readable location names

**Endpoint**:

```
GET https://nominatim.openstreetmap.org/reverse
```

**Parameters**:

- `lat`: Latitude
- `lon`: Longitude
- `format=json`

**Response Example**:

```json
{
  "address": {
    "suburb": "Ugbowo",
    "city": "Benin City",
    "state": "Edo State",
    "country": "Nigeria"
  }
}
```

**Usage in App**:

- Auto-naming communities
- Extracting state for filtering
- Display-friendly location labels

**Rate Limits**: 1 request per second (sufficient for MVP)

---

## 8. Key User Flows (Detailed)

### Flow A: Anonymous User Reports Waste

1. User lands on homepage
2. Browser requests location permission
3. User clicks "Report Waste Now"
4. Form auto-fills current location
5. User optionally:
   - Uploads photo
   - Adjusts pin on map
   - Adds description
6. User submits
7. System checks device ID rate limit
8. Report saved to database
9. Thank you screen appears with volunteer signup link

---

### Flow B: Volunteer Creates Community

1. Volunteer logs in
2. Navigates to "Communities" tab
3. Clicks "Create Community"
4. System checks current GPS location
5. System queries for existing communities within 2km
6. If conflict found: Show error and "Join" button
7. If no conflict:
   - Call Nominatim API with coordinates
   - Extract location name and state
   - Pre-fill form with "{Location} Community"
8. Volunteer confirms/edits name
9. Community created, volunteer auto-joined

---

### Flow C: Volunteers Coordinate Cleanup

1. Volunteer joins a community
2. Views list of pending reports
3. Clicks on a specific report
4. Reads details and location
5. Leaves comment: "I'm free this Saturday"
6. Another volunteer responds: "Me too, I have bags"
7. First volunteer clicks "Schedule Cleanup"
8. Selects Saturday 9:00 AM
9. Second volunteer clicks "Join Cleanup" (RSVP)
10. Saturday arrives, they clean the area
11. First volunteer (leader) clicks "Mark as Cleaned"
12. Second volunteer gets notification
13. They don't dispute (it was actually cleaned)
14. After 24 hours, report permanently marked cleaned

---

## 10. Security & Privacy Considerations

### Rate Limiting

- 5 reports per device per 24 hours prevents spam
- Device ID stored in LocalStorage (client-side only)

### Data Validation

- All coordinates validated before saving
- Image uploads restricted to 5MB, JPEG/PNG only

---

---

## 14. Appendix: Useful SQL Queries

### Find communities near user

```sql
SELECT
  id,
  name,
  ST_Distance(center_location::geography, ST_MakePoint($user_lon, $user_lat)::geography) as distance
FROM communities
WHERE state = $user_state
ORDER BY distance
LIMIT 3;
```

### Check for community conflicts

```sql
SELECT EXISTS(
  SELECT 1 FROM communities
  WHERE ST_DWithin(
    center_location::geography,
    ST_MakePoint($lon, $lat)::geography,
    2000
  )
);
```

### Get reports for community (with buffer)

```sql
-- Core reports
SELECT * FROM reports
WHERE status != 'cleaned'
AND ST_DWithin(
  location::geography,
  (SELECT center_location FROM communities WHERE id = $community_id),
  2000
);

-- Buffer reports
SELECT * FROM reports
WHERE status != 'cleaned'
AND ST_DWithin(
  location::geography,
  (SELECT center_location FROM communities WHERE id = $community_id),
  2500
)
AND NOT ST_DWithin(
  location::geography,
  (SELECT center_location FROM communities WHERE id = $community_id),
  2000
);
```

### Calculate dispute percentage

```sql
SELECT
  event_id,
  COUNT(*) as total_attendees,
  SUM(CASE WHEN rsvp_status = 'disputed' THEN 1 ELSE 0 END) as disputes,
  (SUM(CASE WHEN rsvp_status = 'disputed' THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 as dispute_percentage
FROM event_attendees
WHERE event_id = $event_id
GROUP BY event_id;
```

---

**Tech Documentation**:

- [Supabase Docs](https://supabase.com/docs)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Leaflet.js](https://leafletjs.com/)
- [Nominatim API](https://nominatim.org/release-docs/latest/api/Overview/)
