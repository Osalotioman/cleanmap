# Storage Setup - Simple Guide

## What Changed?

✅ **Backend now uses service role key for uploads** - No RLS policies needed!

## Setup Steps (2 minutes)

### 1. Create Storage Bucket

Go to: [Supabase Dashboard](https://app.supabase.com) → Storage → Buckets

Click **"New bucket"**:
- **Name:** `report-images`
- **Public bucket:** ✅ **YES** (allows public URL access to view images)
- Click "Create bucket"

### 2. Add Service Role Key to Environment

In your `.env.local` file:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-secret-key-here
```

**Where to find it:**
- Supabase Dashboard → Project Settings → API
- Copy the `service_role` key (**NOT** the `anon` key)
- This is a **secret key** - never commit it to git!

### 3. Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
pnpm dev
```

## Done! ✅

Your backend now has full access to upload images using the service role key, which bypasses all Row Level Security policies.

## How It Works

```
User uploads image → Frontend sends to /api/upload
                   ↓
/api/upload uses SUPABASE_SERVICE_ROLE_KEY (admin access)
                   ↓
File uploaded to report-images bucket (bypasses RLS)
                   ↓
Public URL returned to user
```

## Security Notes

✅ **Secure:** Only your backend can upload (service role key is server-side only)  
✅ **No public uploads:** Users can't upload directly to Supabase  
✅ **Public reads:** Anyone can view images via public URL (needed for displaying reports)  
✅ **No RLS policies needed:** Service role bypasses all policies  

## Troubleshooting

**Error: "Bucket not found"**
- Create the bucket in Supabase Dashboard

**Error: "Invalid API key"**
- Check `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- Make sure you're using the `service_role` key, not `anon` key

**Upload works but can't view images**
- Make sure bucket is marked as **Public**
