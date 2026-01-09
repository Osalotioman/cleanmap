# Prisma Database Setup - FIXED ✅

## What Was the Problem?

You had:
- ✅ Prisma schema defined (`prisma/schema.prisma`)
- ❌ Empty database (no tables)
- ❌ No migration history

This caused the "drift detected" error because Prisma couldn't sync the schema with the database.

---

## How I Fixed It (Step-by-Step)

### Step 1: Push Schema to Database
```bash
pnpm prisma db push
```
**What this does:** Creates all tables in the database based on your schema WITHOUT creating migration files.

**Result:** ✅ All tables created (reports, users, volunteers, communities, etc.)

---

### Step 2: Create Initial Migration
```bash
mkdir -p prisma/migrations/0_init
pnpm prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql
```
**What this does:** Generates a migration file that represents the current state of your schema.

**Result:** ✅ Migration file created in `prisma/migrations/0_init/`

---

### Step 3: Mark Migration as Applied
```bash
pnpm prisma migrate resolve --applied 0_init
```
**What this does:** Tells Prisma "this migration is already applied" (since we used `db push` earlier).

**Result:** ✅ Prisma knows the database is in sync with the migration history

---

### Step 4: Verify Everything Works
```bash
pnpm prisma migrate status
```
**Expected output:**
```
Database schema is up to date!
```

---

### Step 5: Regenerate Prisma Client
```bash
pnpm prisma generate
```
**What this does:** Updates the Prisma Client TypeScript types to match your database.

---

## Moving Forward - How to Handle Prisma Changes

### When You Want to Change the Database Schema:

#### Option 1: Development (Recommended for Local)
```bash
# 1. Edit prisma/schema.prisma (add/modify models)
# 2. Create and apply migration
pnpm prisma migrate dev --name describe_your_change

# Example: Adding a new field
pnpm prisma migrate dev --name add_phone_to_users
```

**What this does:**
- Creates a new migration file
- Applies it to the database
- Regenerates Prisma Client automatically

---

#### Option 2: Prototype Quickly
```bash
# 1. Edit prisma/schema.prisma
# 2. Push changes immediately (no migration file)
pnpm prisma db push
```

**Use this when:**
- ⚠️ You're prototyping and don't care about migration history
- ⚠️ You're willing to lose data (it may recreate tables)

**Don't use in production!**

---

### When You Deploy to Production:

```bash
# Run pending migrations
pnpm prisma migrate deploy
```

**What this does:**
- Applies all migrations that haven't been run yet
- Safe for production (doesn't prompt for confirmation)

---

## Common Commands Reference

| Command | Use Case |
|---------|----------|
| `pnpm prisma migrate dev` | Create and apply new migration (dev) |
| `pnpm prisma migrate deploy` | Apply migrations (production) |
| `pnpm prisma migrate status` | Check if database is in sync |
| `pnpm prisma db push` | Quick prototype (skip migrations) |
| `pnpm prisma db pull` | Reverse: sync schema FROM database |
| `pnpm prisma generate` | Regenerate Prisma Client types |
| `pnpm prisma studio` | Open database GUI |

---

## Current Status ✅

- ✅ Database tables created
- ✅ Initial migration `0_init` applied
- ✅ Prisma Client generated
- ✅ Ready to submit reports!

---

## Test It Now

Go to http://localhost:3000/report and submit a report. It should work! 🎉

---

## Troubleshooting

### "Table does not exist" error
```bash
pnpm prisma db push
```

### "Drift detected" error
```bash
# Option 1: Reset and start fresh (DELETES ALL DATA)
pnpm prisma migrate reset

# Option 2: Resolve manually (see steps above)
```

### "Can't reach database server"
- Check `DATABASE_URL` in `.env.local`
- Make sure Supabase project is running
- Check your internet connection
