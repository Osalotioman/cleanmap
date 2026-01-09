# Fix Storage Upload Error - DO THIS NOW ✅

## Current Error
```
new row violates row-level security policy
```

## Root Cause
Your `report-images` bucket exists, but either:
1. ❌ Service role key is not in `.env.local`, OR
2. ❌ The bucket wasn't created properly

## Fix It (3 Steps - 2 Minutes)

### Step 1: Add Service Role Key

1. Go to [Supabase Dashboard](https://app.supabase.com) → Your Project → **Settings** → **API**

2. Scroll down to **Project API keys**

3. Copy the `service_role` key (looks like `eyJhbGc...`)  
   ⚠️ **NOT the `anon` key!**

4. Add to your `.env.local` file:

```env
# Add this line to .env.local
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-actual-service-role-key-here
```

### Step 2: Restart Dev Server

```bash
# Stop current server (Ctrl+C in terminal)
pnpm dev
```

### Step 3: Test Upload

Go to http://localhost:3000/report and try uploading an image.

---

## Still Not Working? Check Bucket Setup

If you still get errors, the bucket might not be configured correctly. Delete and recreate it:

### Delete Old Bucket
1. Supabase Dashboard → **Storage** → **Buckets**
2. Click on `report-images` → **Settings** → **Delete bucket**

### Create New Bucket
1. Click **"New bucket"**
2. Fill in:
   ```
   Name: report-images
   Public bucket: ✅ YES (check this box!)
   ```
3. Click **"Create bucket"**
4. **Do NOT add any policies** - the service role key bypasses all policies

### Restart and Test
```bash
pnpm dev
```

---

## How to Verify It's Working

### ✅ Success Looks Like:
- Upload completes
- You get a response like:
  ```json
  {
    "success": true,
    "data": {
      "url": "https://...supabase.co/storage/v1/object/public/report-images/..."
    }
  }
  ```

### ❌ Still Failing?

Check terminal output for errors:

**Error: "SUPABASE_SERVICE_ROLE_KEY not found"**
- You forgot Step 1. Add the service role key to `.env.local`

**Error: "Bucket not found"**
- Bucket name is wrong or doesn't exist
- Make sure it's exactly `report-images` (no spaces, no typos)

**Error: "new row violates row-level security policy"**
- Service role key is wrong or not configured
- Double-check you copied the `service_role` key, not the `anon` key

---

## Quick Checklist

- [ ] Service role key added to `.env.local`
- [ ] Bucket named exactly `report-images`
- [ ] Bucket is marked as **Public**
- [ ] Dev server restarted
- [ ] No storage policies created (service role bypasses them)

---

## Why This Works

The backend uses `SUPABASE_SERVICE_ROLE_KEY` which has **full admin access** to Supabase, including storage. This bypasses all Row Level Security policies.

**Security:**
- ✅ Service role key is **server-side only** - never exposed to client
- ✅ Only your backend can upload files
- ✅ Public bucket allows viewing images (needed for displaying reports)
- ✅ No anonymous uploads possible
