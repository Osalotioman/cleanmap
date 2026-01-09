# Quick Test Guide - Email Verification Fix

## ✅ Test 1: Wrong Credentials (Fixed!)

**Steps:**
1. Go to http://localhost:3001/auth/login
2. Enter:
   - Email: `anyemail@example.com`
   - Password: `wrongpassword123`
3. Click Login

**Expected Result:**
- ❌ Error: "Invalid email or password"
- ❌ NO "Resend Verification Email" button

**Terminal Should Show:**
```
Error code: invalid_credentials
Error status: 400
Error message: Invalid login credentials
```

---

## ✅ Test 2: Unverified Email (Fixed!)

### Step 1: Create Unverified User

1. Go to http://localhost:3001/auth/sign-up
2. Sign up with:
   - Email: `test@example.com` (use your real email!)
   - Password: `Test123!@#`
   - First Name: `Test`
   - Last Name: `User`
3. Click Sign Up
4. **DON'T click the verification link yet!**

### Step 2: Try to Login

1. Go to http://localhost:3001/auth/login
2. Enter same credentials
3. Click Login

**Expected Result:**
- ❌ Error: "Please verify your email address..."
- ✅ "Resend Verification Email" button appears

**Terminal Should Show:**
```
Error code: email_not_confirmed (or similar)
Error status: 400
Error message: Email not confirmed
```

### Step 3: Resend Verification

1. Click "Resend Verification Email" button
2. Watch the terminal output

**Terminal Should Show:**
```
📧 Resending verification email to: test@example.com
🔗 Redirect URL: http://localhost:3001/auth/confirm
✅ Verification email sent successfully
```

**OR if there's an error:**
```
❌ Resend verification error: [error details]
```

---

## 🔍 Troubleshooting

### If emails aren't arriving:

**Check 1: Spam Folder**
- Supabase emails often go to spam
- Check your spam/junk folder

**Check 2: Supabase Settings**
1. Go to [Supabase Dashboard](https://app.supabase.com/project/neigvurbwjxznvxpjaky/auth/providers)
2. Click **Email** provider
3. Verify:
   - ☑️ Enable email confirmations = ON
   - ☑️ Confirm email = ON

**Check 3: Supabase Auth Logs**
1. Go to [Auth Logs](https://app.supabase.com/project/neigvurbwjxznvxpjaky/logs/auth-logs)
2. Look for:
   - "Email sent to test@example.com" ✅
   - OR error messages ❌

**Check 4: SMTP Rate Limits**
- Supabase free tier: 4 emails/hour
- If you've sent too many, wait an hour

---

## 🚀 Quick Dev Fix (Temporary!)

If you just want to test without emails:

1. Supabase Dashboard → **Authentication** → **Email**
2. ☑️ **Enable email autoconfirm**
3. Save
4. Now all signups are auto-verified!

⚠️ **Remember to turn this OFF for production!**

---

## ✅ What Got Fixed

1. **Wrong credentials detection** ✅
   - Now properly detects `invalid_credentials` error code
   - Shows "Invalid email or password" (not verification message)

2. **Enhanced logging** ✅
   - Shows exact error codes in terminal
   - Detailed resend email logs
   - Easier to debug

3. **Better error handling** ✅
   - Checks error code, not just status
   - Only shows verification UI for actual verification errors

---

## 📊 Current Status

- ✅ Server running: http://localhost:3001
- ✅ Login endpoint fixed
- ✅ Resend endpoint enhanced with logging
- ⏳ Email delivery depends on Supabase settings

---

## Next: Test & Report

1. Try Test 1 (wrong credentials)
2. Try Test 2 (unverified email)
3. Check terminal logs
4. Check Supabase Auth logs
5. Report results!
