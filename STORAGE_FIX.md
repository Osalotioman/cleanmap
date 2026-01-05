# Storage Upload Fix - Quick Guide

## Problem
Getting "Failed to upload image" error when submitting reports.

## Root Cause
The Supabase storage bucket `report-images` is not configured yet.

## Solution (3 Steps)

### Step 1: View Setup Instructions
```bash
./scripts/setup-storage.sh
```

This will display complete setup instructions for Supabase.

### Step 2: Create Bucket in Supabase

1. **Go to Supabase Dashboard:**
   - https://app.supabase.com/project/YOUR_PROJECT/storage/buckets

2. **Click "New bucket"**

3. **Configure:**
   - Name: `report-images`
   - **Public bucket: ✅ MUST BE CHECKED**
   - File size limit: 5MB (optional)
   - Click "Create bucket"

### Step 3: Add Storage Policies

#### Option A: Quick SQL (Copy & Paste)

Go to SQL Editor and run:

```sql
-- Allow anonymous uploads (for report submissions)
CREATE POLICY "Allow anonymous uploads"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'report-images');

-- Allow public reads (to view images)
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'report-images');
```

#### Option B: Via UI

1. Go to: Storage → Policies
2. Select bucket: `report-images`
3. Click "New policy"
4. Use templates:
   - "Allow public read access"
   - "Allow insert access to authenticated users"

## Verify Setup

### Option 1: Run Test Script
```bash
node scripts/test-storage.mjs
```

This will:
- ✅ Check if bucket exists
- ✅ Test anonymous upload
- ✅ Verify public URL access
- ✅ Clean up test file

### Option 2: Test via Frontend
1. Start dev server: `pnpm dev`
2. Go to: http://localhost:3000/report
3. Upload an image
4. Submit report
5. Should succeed! ✅

### Option 3: Test via cURL
```bash
# Create a test image first
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test-image.jpg"
```

## Troubleshooting

### Error: "Bucket not found"
- ❌ Bucket doesn't exist
- ✅ Go create it in Supabase Dashboard

### Error: "Policy violation" or "Permission denied"
- ❌ Storage policies not configured
- ✅ Add the SQL policies above

### Error: "Failed to upload image"
- Check console logs in terminal (shows detailed error)
- Verify bucket name is exactly `report-images`
- Verify bucket is marked as **Public**
- Verify policies allow `anon` role

### Error: "Images uploaded but not visible"
- ❌ Bucket not public or missing read policy
- ✅ Enable public reads in policies

## What Gets Fixed

Once configured, these features work:
- ✅ Anonymous report submissions with photos
- ✅ Image uploads from `/report` page
- ✅ Public image URLs for viewing reports
- ✅ Image deletion for authenticated users

## Architecture

```
User submits report with photo
    ↓
POST /api/upload
    ↓
Supabase Storage (report-images bucket)
    ↓
Returns public URL
    ↓
POST /api/reports/submit (with imageUrl)
    ↓
Saves to database
    ↓
Redirects to thank-you page
```

## Security Notes

- ✅ **Anonymous uploads:** Allowed (for community reports)
- ✅ **Public reads:** Required (to view report images)
- ✅ **Rate limiting:** Applied at report submission level (5/day per device)
- ✅ **File validation:** Type & size checked before upload
- ⚠️ **Consider:** Add content moderation for production

## Additional Configuration (Optional)

### Add File Size Limit in Bucket Settings
1. Go to Storage → Buckets → report-images
2. Edit bucket
3. Set: Max file size = 5MB

### Enable Image Transformations
1. Go to Storage → Settings
2. Enable image transformations
3. Automatic optimization for web delivery

### Add Authenticated Delete Policy
```sql
CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'report-images');
```

## Quick Reference

| Item | Value |
|------|-------|
| Bucket name | `report-images` |
| Public | Yes ✅ |
| Max size | 5MB |
| Allowed types | JPEG, PNG, WebP |
| Anonymous upload | Enabled |
| Public read | Enabled |

## Related Files

- `app/api/upload/route.ts` - Upload endpoint (improved error messages)
- `app/api/reports/submit/route.ts` - Report submission
- `scripts/test-storage.mjs` - Automated test script
- `scripts/setup-storage.sh` - Setup instructions
- `.github/REPORT_BACKEND_SETUP.md` - Full backend documentation

---

**Status after setup: ✅ Ready to upload images!**
