# Authentication Setup Guide

This guide will walk you through setting up the authentication system for CleanMap.

## 📋 Prerequisites

- Node.js 18+ and pnpm installed
- Supabase account and project created
- PostgreSQL database (via Supabase)

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

This will install:
- `@supabase/ssr` - Supabase SSR helpers
- `@prisma/client` - Prisma ORM client
- `jsonwebtoken` - JWT token generation
- `prisma` (dev) - Prisma CLI tools
- `@types/jsonwebtoken` (dev) - TypeScript types

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Then fill in your Supabase credentials:

```env
# Get from https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Get from https://app.supabase.com/project/_/settings/database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres

# Generate using: openssl rand -base64 32
APP_JWT_SECRET=generate-a-secure-random-string-here
```

**Important:** Never commit `.env.local` to version control!

### 3. Set Up Database

Generate Prisma client:

```bash
pnpm prisma:generate
```

Push schema to database:

```bash
pnpm prisma:push
```

Or run migrations (recommended for production):

```bash
pnpm prisma:migrate
```

### 4. Verify Setup

Start the development server:

```bash
pnpm dev
```

The app will validate all environment variables on startup. If any are missing, you'll see a helpful error message.

---

## 🧪 Testing the Authentication API

### Test Signup

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "User created successfully. Please check your email to verify your account.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "test@example.com",
      "role": "student",
      "status": "active",
      "firstName": "Test",
      "lastName": "User",
      "createdAt": "2026-01-02T..."
    }
  }
}
```

### Test Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "test@example.com",
      "role": "student",
      "status": "active",
      "firstName": "Test",
      "lastName": "User"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "supabaseSession": {
      "access_token": "...",
      "refresh_token": "...",
      "expires_in": 3600
    }
  }
}
```

---

## 📚 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm prisma:generate` | Generate Prisma client |
| `pnpm prisma:migrate` | Run database migrations |
| `pnpm prisma:push` | Push schema to database (dev) |
| `pnpm prisma:studio` | Open Prisma Studio (DB GUI) |

---

## 🔧 Prisma Commands

### View Database in GUI

```bash
pnpm prisma:studio
```

Opens Prisma Studio at `http://localhost:5555`

### Create a New Migration

```bash
pnpm prisma migrate dev --name add_user_fields
```

### Reset Database (⚠️ Destructive)

```bash
pnpm prisma migrate reset
```

### Format Prisma Schema

```bash
pnpm prisma format
```

---

## 🔐 Supabase Configuration

### Enable Email Auth

1. Go to **Authentication** → **Providers** in Supabase Dashboard
2. Enable **Email** provider
3. Configure email templates (optional)

### Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize the confirmation email template
3. Add your app's branding

### Set Up Row Level Security (RLS)

Add RLS policies to your Supabase database:

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

---

## 🚢 Deployment Checklist

### Vercel Deployment

1. **Add Environment Variables:**
   - Go to Vercel project settings → Environment Variables
   - Add all variables from `.env.local`
   - Make sure to add them for all environments (Production, Preview, Development)

2. **Configure Build Settings:**
   - Build Command: `pnpm prisma:generate && pnpm build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

3. **Database Migration:**
   - Run migrations manually: `pnpm prisma migrate deploy`
   - Or add to build command: `pnpm prisma migrate deploy && pnpm build`

4. **Verify Environment Variables:**
   - The app will fail fast if any required variables are missing
   - Check deployment logs for environment validation errors

### Post-Deployment Verification

1. Test signup endpoint: `https://your-app.vercel.app/api/auth/signup`
2. Test login endpoint: `https://your-app.vercel.app/api/auth/login`
3. Verify email confirmation works
4. Check Supabase logs for auth events
5. Monitor Vercel logs for errors

---

## 🐛 Troubleshooting

### "Missing required environment variable"

- Make sure all variables from `.env.example` are in `.env.local`
- Check for typos in variable names
- Ensure no trailing whitespace in values

### "Prisma Client not found"

```bash
pnpm prisma:generate
```

### "Can't reach database server"

- Check `DATABASE_URL` format
- Verify database is accessible from your IP
- Check Supabase project is active

### "Invalid JWT secret"

- Ensure `APP_JWT_SECRET` is at least 32 characters
- Generate new secret: `openssl rand -base64 32`
- Make sure there's no trailing whitespace

### "Supabase auth error"

- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check Supabase project is active
- Verify email auth is enabled in Supabase

---

## 📖 Additional Resources

- [Authentication Implementation Guide](.github/AUTH_IMPLEMENTATION.md)
- [Supabase Documentation](https://supabase.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

## 🆘 Getting Help

If you encounter issues:

1. Check the [troubleshooting section](#-troubleshooting)
2. Review [AUTH_IMPLEMENTATION.md](.github/AUTH_IMPLEMENTATION.md)
3. Check environment variable validation errors
4. Review Supabase dashboard logs
5. Check Vercel deployment logs

---

**Last Updated:** January 2, 2026
