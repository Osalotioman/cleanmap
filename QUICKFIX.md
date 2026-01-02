# 🚨 QUICK FIX: "Table does not exist" Error

## Problem
You're seeing this error when trying to create a user:
```
The table `public.users` does not exist in the current database.
```

## ✅ Solution (3 Steps)

### 1. Create `.env` file
Prisma CLI only reads from `.env`, not `.env.local`:

```bash
cp .env.local .env
```

### 2. Push schema to database
This creates the `users` table in Supabase:

```bash
pnpm prisma db push
```

You should see:
```
✔ Generated Prisma Client
Database is now in sync with Prisma schema
```

### 3. Restart dev server
Stop your dev server (Ctrl+C) and restart:

```bash
pnpm dev
```

## 🎉 Test It!

Now try creating a user at `http://localhost:3000/signup`

---

## 📝 Why This Happens

- **Next.js** reads environment variables from `.env.local`
- **Prisma CLI** only reads from `.env`
- You need **both files** with the same content!

---

## 🔍 Verify Setup

Open Prisma Studio to see your database:

```bash
pnpm prisma studio
```

Opens at: `http://localhost:5555`

You should see the `users` table there.

---

## ⚠️ Still Not Working?

### Check your DATABASE_URL

Make sure `.env` has this format:
```env
DATABASE_URL="postgresql://postgres.xxx:password@xxx.pooler.supabase.com:5432/postgres"
```

### Regenerate Prisma Client

```bash
pnpm prisma generate
```

### Check Supabase Connection

1. Go to Supabase Dashboard
2. Project Settings → Database
3. Copy the "Connection string" (Pooler connection recommended)
4. Replace `[YOUR-PASSWORD]` with your actual password
5. Update `DATABASE_URL` in both `.env` and `.env.local`

---

## 🎯 Complete Setup Checklist

- [x] Created `.env.local` with Supabase credentials
- [x] Copied `.env.local` to `.env` 
- [ ] Ran `pnpm prisma db push`
- [ ] Verified table exists in Prisma Studio
- [ ] Restarted dev server
- [ ] Successfully created test user

---

**After completing these steps, your authentication should work! 🚀**
