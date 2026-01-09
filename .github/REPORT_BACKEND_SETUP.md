# Report Backend Setup Guide

## Overview

The report submission backend is **already implemented** and consists of two API endpoints that work together to handle anonymous waste report submissions with rate limiting and image uploads.

## Architecture

```
Frontend (report page)
    ↓
    ├─→ POST /api/upload (if image exists)
    │       ↓
    │   Upload to Supabase Storage
    │       ↓
    │   Return public URL
    │
    └─→ POST /api/reports/submit
            ↓
        Check rate limit (5 reports/24hrs per device)
            ↓
        Save to database
            ↓
        Return report ID
            ↓
        Redirect to /report/thank-you?id=xxx
```

## API Endpoints

### 1. `/api/upload` - Image Upload

**File:** `app/api/upload/route.ts`

**Purpose:** Uploads images to Supabase Storage bucket

**Request:**
```typescript
POST /api/upload
Content-Type: multipart/form-data

FormData {
  file: File (image)
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "fileName": "1234567890_abc123.jpg",
    "url": "https://xxx.supabase.co/storage/v1/object/public/report-images/1234567890_abc123.jpg",
    "size": 245678,
    "type": "image/jpeg"
  },
  "message": "Image uploaded successfully"
}
```

**Validations:**
- ✅ File size: Max 5MB
- ✅ File types: JPEG, JPG, PNG, WebP
- ✅ Generates unique filename with timestamp

**Supabase Storage Configuration Required:**
1. Create a public bucket named `report-images` in Supabase
2. Set policies to allow public reads and authenticated writes
3. Optional: Set up automatic image optimization

### 2. `/api/reports/submit` - Report Submission

**File:** `app/api/reports/submit/route.ts`

**Purpose:** Creates a new waste report with rate limiting

**Request:**
```typescript
POST /api/reports/submit
Content-Type: application/json

{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "description": "Overflowing trash bin at Main St",
  "imageUrl": "https://...",  // Optional, from /api/upload
  "deviceId": "device_1234567890_abc123"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "data": {
    "report": {
      "id": "uuid-string",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "description": "Overflowing trash bin at Main St",
      "imageUrl": "https://...",
      "deviceId": "device_xxx",
      "status": "pending",
      "createdAt": "2024-01-05T12:00:00Z"
    },
    "rateLimitRemaining": 4
  },
  "message": "Report submitted successfully"
}
```

**Response (Rate Limit Exceeded - 429):**
```json
{
  "success": false,
  "error": "Daily limit reached. You can submit 0 more report(s). Limit resets at 2024-01-06T12:00:00Z"
}
```

**Validations:**
- ✅ Required fields: `latitude`, `longitude`, `deviceId`
- ✅ Coordinate validation: -90 to 90 (lat), -180 to 180 (lon)
- ✅ Rate limit: 5 reports per 24 hours per device
- ✅ Status automatically set to "pending"

## Database Schema

**Table:** `reports`

```prisma
model Report {
  id          String   @id @default(uuid())
  latitude    Float
  longitude   Float
  description String?
  imageUrl    String?
  deviceId    String   // For anonymous rate limiting
  status      String   @default("pending") // pending | scheduled | cleaned
  createdAt   DateTime @default(now())

  // Relations
  events   CleanupEvent[]
  comments Comment[]

  @@index([deviceId, createdAt]) // For rate limit queries
  @@index([status]) // For filtering
  @@map("reports")
}
```

## Rate Limiting

**File:** `lib/rate-limiter.ts`

**Strategy:** Device ID-based (stored in localStorage)

**Limits:**
- 5 reports per 24-hour rolling window
- Window resets 24 hours after the oldest report
- Device ID format: `device_<timestamp>_<random>`

**Functions:**
```typescript
// Check if device can submit
await checkRateLimit(deviceId)
→ { canSubmit: boolean, remaining: number, resetAt: Date }

// Generate device ID (client-side)
getDeviceId()
→ "device_1234567890_abc123"
```

## Geospatial Utilities

**File:** `lib/geospatial.ts`

**Functions:**
```typescript
// Validate coordinates
isValidCoordinates(lat, lon) → boolean

// Calculate distance between points (Haversine)
calculateDistance(lat1, lon1, lat2, lon2) → meters

// Reverse geocode coordinates
reverseGeocode(lat, lon) → { state, city, suburb, ... }
```

## Setup Checklist

### ✅ Already Implemented
- [x] Upload API endpoint
- [x] Report submission API endpoint
- [x] Rate limiting utility
- [x] Geospatial validation
- [x] Database schema with indexes
- [x] Frontend form with GPS detection
- [x] Image preview and removal
- [x] Device ID generation

### 🔧 Supabase Configuration Needed

1. **Create Storage Bucket:**
   ```
   Bucket Name: report-images
   Public: Yes
   File Size Limit: 5MB
   Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp
   ```

2. **Set Storage Policies:**
   ```sql
   -- Allow public reads
   CREATE POLICY "Public read access"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'report-images');

   -- Allow authenticated uploads (for volunteers)
   CREATE POLICY "Authenticated upload"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'report-images' AND auth.role() = 'authenticated');

   -- Allow anonymous uploads (for reports)
   CREATE POLICY "Anonymous upload"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'report-images');
   ```

3. **Optional: Image Transformations**
   - Enable automatic image optimization
   - Set max dimensions (e.g., 1920x1920)
   - Enable WebP conversion

### 🔧 Database Setup

1. **Run Prisma Migration:**
   ```bash
   pnpm prisma db push
   # or
   pnpm prisma migrate dev
   ```

2. **Verify Indexes:**
   - `reports(deviceId, createdAt)` - For rate limiting
   - `reports(status)` - For filtering by status

## Testing

### Test Image Upload
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test-image.jpg"
```

### Test Report Submission
```bash
curl -X POST http://localhost:3000/api/reports/submit \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 40.7128,
    "longitude": -74.0060,
    "description": "Test report",
    "imageUrl": "https://...",
    "deviceId": "device_test_123"
  }'
```

### Test Rate Limiting
Submit 6 reports with the same `deviceId` to trigger rate limit.

## Frontend Integration

The frontend already integrates with these endpoints:

**File:** `app/(public)/report/page.tsx`

**Flow:**
1. User fills form (title, description, images)
2. GPS location detected automatically
3. User can override location via map picker
4. On submit:
   - Upload image → get URL
   - Submit report with URL
   - Redirect to thank-you page

## Status Values

| Status | Meaning | Set By |
|--------|---------|--------|
| `pending` | Newly submitted, awaiting review | System (default) |
| `scheduled` | Assigned to cleanup event | Volunteer/Admin |
| `cleaned` | Issue resolved | Volunteer/Admin |

## Error Handling

**Common Errors:**

| Error | Code | Cause | Solution |
|-------|------|-------|----------|
| No file provided | 400 | Missing image in upload | Check form data |
| Invalid file type | 400 | Unsupported image format | Use JPEG/PNG/WebP |
| File too large | 400 | Image > 5MB | Compress image |
| Invalid coordinates | 400 | Lat/Lon out of range | Validate GPS data |
| Rate limit exceeded | 429 | > 5 reports in 24hrs | Wait for reset |
| Failed to upload image | 500 | Supabase storage error | Check bucket config |

## Security Considerations

✅ **Implemented:**
- Rate limiting prevents spam
- File type validation prevents malicious uploads
- File size limits prevent resource exhaustion
- Coordinate validation prevents invalid data
- Device ID prevents tracking (anonymous)

⚠️ **Additional Recommendations:**
- Add CAPTCHA for production (prevent bots)
- Implement content moderation for images (AI/manual)
- Add geofencing (restrict to specific regions)
- Monitor for abuse patterns
- Add report flagging/moderation queue

## Monitoring

**Key Metrics to Track:**
- Reports submitted per day
- Rate limit hits (spam detection)
- Upload failures (storage issues)
- Average report response time
- Reports by status distribution

**Database Queries:**
```sql
-- Reports in last 24 hours
SELECT COUNT(*) FROM reports 
WHERE "createdAt" > NOW() - INTERVAL '24 hours';

-- Rate limited devices
SELECT "deviceId", COUNT(*) as count
FROM reports
WHERE "createdAt" > NOW() - INTERVAL '24 hours'
GROUP BY "deviceId"
HAVING COUNT(*) >= 5;

-- Reports by status
SELECT status, COUNT(*)
FROM reports
GROUP BY status;
```

## Next Steps

1. ✅ Backend is ready - APIs implemented
2. 🔧 Configure Supabase storage bucket
3. 🔧 Run database migrations
4. ✅ Frontend already integrated
5. 🧪 Test end-to-end flow
6. 🚀 Deploy to production

## Support

For issues or questions:
- Check logs in API routes (`console.error`)
- Verify Supabase bucket configuration
- Test rate limiting with different device IDs
- Check database indexes are created
