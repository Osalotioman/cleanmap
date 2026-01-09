# Email Verification Issues - Diagnosis & Fix

## Problem 1: Wrong Credentials Show "Verify Email" ❌

**Issue:** When entering wrong email/password, system says "verify your email" instead of "invalid credentials"

**Root Cause:** I was checking `authError.status === 400` which catches ALL auth errors, not just email verification.

**Fix Applied:** ✅
- Now checks for specific error code: `email_not_confirmed`
- Only shows verification message for actual verification errors
- Wrong credentials → "Invalid email or password"
- Unverified email → "Please verify your email address"

---

## Problem 2: Verification Emails Not Arriving 📧

**Possible Causes:**

### Cause A: Supabase Email Confirmations Disabled

Check your Supabase settings:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `neigvurbwjxznvxpjaky`
3. Go to **Authentication** → **Providers** → **Email**
4. Check these settings:
   - ✅ **Enable email confirmations** should be ON
   - ✅ **Confirm email** should be checked
   - ⚠️ **Enable email autoconfirm** should be OFF (for production)

**Fix:**
```
Authentication → Providers → Email → 
☑️ Enable email confirmations
☑️ Confirm email
☐ Enable email autoconfirm (leave unchecked for real verification)
```

---

### Cause B: Email Template Not Configured

Supabase needs to know where to redirect users after verification.

1. Go to **Authentication** → **Email Templates**
2. Find **Confirm signup** template
3. Make sure it has the correct redirect URL:
   ```
   {{ .ConfirmationURL }}
   ```
4. The default template should work, but verify it exists

---

### Cause C: SMTP Not Configured (Using Supabase's Dev SMTP)

Supabase free tier has limited email sending. Check:

1. **Authentication** → **Settings** → **SMTP Settings**
2. If using Supabase's default SMTP:
   - ⚠️ Rate limited to **4 emails per hour**
   - ⚠️ May go to spam
   - ⚠️ Not reliable for production

**Solution for Production:**
Configure your own SMTP (Gmail, SendGrid, etc.):
```
SMTP Host: smtp.gmail.com
Port: 587
Sender Email: your-email@gmail.com
Sender Name: CleanMap
```

---

### Cause D: Email Going to Spam

Check your spam folder! Supabase default emails often end up there.

**Fix:**
- Use custom SMTP with proper domain
- Add SPF, DKIM records
- Or use `autoconfirm` for development (not production!)

---

## Quick Test - Which Error Do You Have?

### Test 1: Check Supabase Logs
1. Go to Supabase Dashboard
2. **Logs** → **Auth Logs**
3. Try to sign up a new user
4. Look for email sending logs

**What to look for:**
- ✅ "Email sent to user@example.com" → Email system working, check spam
- ❌ No email logs → Email confirmations disabled
- ❌ "SMTP error" → SMTP not configured

---

### Test 2: Check Terminal Logs

When you try to login with unverified email, check the terminal for:

```bash
Error code: invalid_credentials  ← Wrong credentials
Error code: email_not_confirmed  ← Actually needs verification
```

Now it will show the correct error code!

---

### Test 3: Try Signup with Console Open

1. Open browser console (F12)
2. Go to http://localhost:3001/auth/sign-up
3. Sign up with a new email
4. Check console for errors
5. Check Supabase Auth logs

---

## Temporary Fix for Development

If you just want to test without email verification:

1. Go to Supabase Dashboard
2. **Authentication** → **Providers** → **Email**
3. ☑️ **Enable email autoconfirm**
4. Save

**Warning:** This auto-confirms all emails without verification. **DO NOT USE IN PRODUCTION!**

---

## Proper Fix for Production

1. ✅ Enable email confirmations
2. ✅ Configure custom SMTP (not Supabase default)
3. ✅ Add proper email templates
4. ✅ Set up SPF/DKIM records
5. ✅ Test with real email addresses

---

## Test Current Fix

### Test Wrong Credentials:
```
Email: test@example.com
Password: wrongpassword123

Expected: "Invalid email or password" ✅
NOT: "Please verify your email" ❌
```

### Test Unverified Email:
```
1. Sign up new user
2. DON'T verify email
3. Try to login

Expected: "Please verify your email address" ✅
AND: "Resend Verification Email" button ✅
```

---

## Server Running

✅ Dev server: http://localhost:3001
(Note: Running on port 3001 because 3000 was in use)

---

## Next Steps

1. **Test wrong credentials** - Should say "Invalid email or password"
2. **Check Supabase email settings** - Enable confirmations
3. **Check spam folder** - Verification emails might be there
4. **Consider autoconfirm for dev** - Only for development/testing!
