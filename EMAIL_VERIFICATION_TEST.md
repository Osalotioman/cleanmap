# Test Checklist - Email Verification Fix

## ✅ Quick Test (2 minutes)

### Test 1: Unverified Email Login
- [ ] Go to http://localhost:3000/auth/sign-up
- [ ] Sign up with a new test email (e.g., `test@example.com`)
- [ ] **DO NOT click the verification link in email**
- [ ] Go to http://localhost:3000/auth/login
- [ ] Try to login with the unverified email
- [ ] **Expected:** 
  - ✅ Error says "Please verify your email address..."
  - ✅ "Resend Verification Email" button appears
  - ❌ Does NOT say "Invalid email or password"

### Test 2: Resend Verification
- [ ] Click "Resend Verification Email" button
- [ ] **Expected:**
  - ✅ Button shows "Sending..." while processing
  - ✅ Success message: "Verification email sent! Please check your inbox..."
  - ✅ Check email - new verification email received

### Test 3: After Verification
- [ ] Click verification link in email
- [ ] **Expected:**
  - ✅ Redirected to site
  - ✅ "Email confirmed successfully! You can now log in." message
- [ ] Try login again with same email
- [ ] **Expected:**
  - ✅ Login succeeds
  - ✅ Redirected to volunteer dashboard

### Test 4: Wrong Password (Control Test)
- [ ] Try to login with correct email but wrong password
- [ ] **Expected:**
  - ✅ Error: "Invalid email or password"
  - ❌ NO "Resend Verification Email" button

---

## Pass Criteria

✅ All checkboxes above should be checked  
✅ Clear error messages  
✅ Resend button only appears for verification errors  
✅ No confusion between wrong password and unverified email  

---

## If Test Fails

Check browser console for errors:
```
Right click → Inspect → Console tab
```

Check server terminal for errors:
```
Look for lines starting with:
"Supabase auth error:"
"Sign in error:"
```
