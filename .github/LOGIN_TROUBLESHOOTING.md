# 🔐 Sign In / Login Troubleshooting Guide

## Issues Fixed

### ✅ Issue 1: Wrong Supabase Client (CRITICAL)
**Problem:** Login was using `createAdminClient()` instead of `createClient()`

**Why it failed:**
- `signInWithPassword()` doesn't work with admin/service role client
- Admin client is for admin operations only (creating users, etc.)
- Regular authentication must use the anon key client

**Fixed in:** `app/api/auth/login/route.ts`
- Changed from `createAdminClient()` to `await createClient()`

### ✅ Issue 2: Email Verification Requirement
**Problem:** Users couldn't log in because email wasn't verified

**Why it happened:**
- Signup was creating users with `email_confirm: false`
- Supabase blocks login until email is verified
- No email verification flow was implemented yet

**Fixed in:** `app/api/auth/signup/route.ts`
- Changed to `email_confirm: true` for development
- Users can now log in immediately after signup

---

## 🧪 Testing the Fix

### 1. Create a new user
```bash
# Go to: http://localhost:3000/signup

Fill in:
- Email: test@example.com
- Password: TestPass123!
- First Name: Test
- Last Name: User
```

### 2. Sign in with the user
```bash
# Go to: http://localhost:3000/login

Use:
- Email: test@example.com
- Password: TestPass123!
```

### 3. Expected result
✅ Redirects to `/dashboard`  
✅ Navbar shows "Test" (your first name)  
✅ Can access profile page

---

## 🔍 Common Login Errors

### Error: "Invalid email or password"
**Possible causes:**
1. **Wrong credentials** - Double-check email and password
2. **User doesn't exist** - Sign up first
3. **Email not verified** (if using old code) - Check Supabase for email confirmation

**Debug steps:**
```bash
# Check if user exists in database
pnpm prisma studio
# Look for your email in the users table
```

### Error: "Account is inactive"
**Cause:** User status is not "active"

**Fix:**
```bash
# Open Prisma Studio
pnpm prisma studio

# Find the user and change status to "active"
```

### Error: "Table does not exist"
**Cause:** Database schema not pushed

**Fix:**
```bash
cp .env.local .env
pnpm prisma db push
```

### Error: Network/CORS issues
**Cause:** Supabase configuration

**Fix:**
1. Check `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
3. Restart dev server

---

## 🏗️ How Login Works (After Fix)

1. **User submits login form** (`/login`)
   - Email and password validated

2. **API authenticates with Supabase** (`/api/auth/login`)
   - Uses `createClient()` (regular client with anon key)
   - Calls `supabase.auth.signInWithPassword()`
   - Supabase verifies credentials

3. **Fetch user profile from Prisma**
   - Gets user data from database
   - Creates profile if doesn't exist (edge case)

4. **Generate JWT token**
   - Custom app-level token
   - Stored in localStorage

5. **Return user + token + session**
   - User object (profile data)
   - JWT token (for API calls)
   - Supabase session (for auth state)

6. **Client stores data**
   - Token saved in localStorage
   - Profile saved in localStorage
   - Auth context updated

7. **Redirect to dashboard**
   - Navbar updates to show user name
   - Protected routes now accessible

---

## 📝 Code Changes Made

### Login Route (`app/api/auth/login/route.ts`)
```diff
- import { createAdminClient } from '@/lib/supabase/server';
+ import { createClient } from '@/lib/supabase/server';

- const supabase = createAdminClient();
+ const supabase = await createClient();
```

### Signup Route (`app/api/auth/signup/route.ts`)
```diff
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email.toLowerCase(),
    password,
-   email_confirm: false, // Require email verification
+   email_confirm: true, // Auto-confirm for development
  });
```

---

## 🚀 Production Considerations

### Email Verification
For production, you should:

1. **Set `email_confirm: false`** in signup
2. **Implement email verification page**
3. **Add "Resend verification email" feature**
4. **Handle unverified login attempts gracefully**

### Security Enhancements
- [ ] Rate limiting on login attempts
- [ ] Account lockout after failed attempts
- [ ] Password reset flow
- [ ] Two-factor authentication
- [ ] Session management (refresh tokens)

---

## 🎯 Quick Verification Checklist

- [x] Login uses `createClient()` not `createAdminClient()`
- [x] Signup auto-confirms email for development
- [x] User can signup successfully
- [x] User can login immediately after signup
- [x] Navbar shows user information
- [x] Profile page displays correctly
- [x] Protected routes work

---

## 🐛 Still Having Issues?

### Check Terminal Logs
Look for errors in your terminal where `pnpm dev` is running.

### Check Browser Console
Open DevTools (F12) and check for:
- Network errors (failed requests)
- JavaScript errors
- Auth state issues

### Check Supabase Dashboard
1. Go to Authentication → Users
2. Verify user was created
3. Check email confirmation status
4. Look at logs for auth events

### Verify Environment Variables
```bash
# Make sure these are set correctly:
cat .env | grep SUPABASE
```

Should show:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`

---

## ✅ Expected Behavior (After Fix)

1. ✅ Signup creates user in Supabase + Prisma
2. ✅ User email is auto-confirmed
3. ✅ Login works with correct credentials
4. ✅ JWT token generated and stored
5. ✅ User redirected to dashboard
6. ✅ Navbar shows user name
7. ✅ Profile page accessible
8. ✅ Sign out works correctly

---

**Date:** January 2, 2026  
**Status:** ✅ Fixed  
**Impact:** Critical - Login now works correctly
