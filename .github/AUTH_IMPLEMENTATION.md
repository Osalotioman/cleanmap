# Authentication Implementation Guide

**Project:** CleanMap  
**Date:** January 2, 2026  
**Author:** AI Coding Agent  
**Status:** Implementation in Progress

---

## 📋 Overview

This document details the authentication system implementation for CleanMap, a mobile-first PWA for community waste management. The system uses a hybrid approach combining **Supabase Auth** for authentication with **Prisma** for user profile management.

---

## 🏗️ Architecture

### Technology Stack

- **Authentication Provider:** Supabase Auth
- **Database ORM:** Prisma
- **Token Strategy:** JWT (JSON Web Tokens)
- **Runtime:** Next.js App Router (Serverless on Vercel)
- **Session Management:** @supabase/ssr with cookie-based sessions

### Architecture Principles

1. **Separation of Concerns:**
   - Supabase Auth handles authentication (email/password verification)
   - Prisma handles user profile data and application-specific fields
   - JWT provides app-level authentication tokens

2. **Serverless-First:**
   - All APIs designed as Next.js Route Handlers
   - No persistent server state
   - Cookie-based session management via SSR helpers

3. **Security-First:**
   - Environment variables validated at startup
   - Service role key used only server-side
   - JWT secrets never exposed to client
   - Row Level Security (RLS) enforced in Supabase

---

## 📁 Project Structure

```
cleanmap/
├── app/
│   └── api/
│       └── auth/
│           ├── login/
│           │   └── route.ts          # POST /api/auth/login
│           └── signup/
│               └── route.ts          # POST /api/auth/signup
│
├── lib/
│   ├── env.ts                        # Centralized env validation
│   ├── api-utils.ts                  # Response helpers & validation
│   ├── prisma.ts                     # Prisma client singleton
│   └── supabase/
│       ├── client.ts                 # Browser Supabase client
│       └── server.ts                 # Server Supabase client (SSR)
│
├── services/
│   └── token-service.ts              # JWT generation & verification
│
├── prisma/
│   └── schema.prisma                 # User model definition
│
└── types/
    ├── database.ts                   # Supabase generated types
    └── auth.ts                       # Auth-specific types
```

---

## 🔐 Authentication Flow

### Signup Flow

1. Client sends `POST /api/auth/signup` with email & password
2. Server validates email format
3. Server creates Supabase Auth user via `supabase.auth.signUp()`
4. Server creates Prisma user profile with:
   - `id` matching Supabase user id
   - `passwordHash` set to `supabase:{id}` (placeholder)
   - Default role: `"student"`
5. Server returns success response
6. User receives email verification (Supabase handles this)

### Login Flow

1. Client sends `POST /api/auth/login` with email & password
2. Server authenticates via `supabase.auth.signInWithPassword()`
3. Server fetches/creates Prisma user profile
4. Server generates JWT token with user payload
5. Server sets Supabase session cookies
6. Server returns `{ user, token, supabaseSession }`

### Token Strategy

- **Supabase Session:** Cookie-based, managed by `@supabase/ssr`
- **App JWT:** Custom token for app-level authorization
- **Token Payload:** `{ userId, email, role }`

---

## 🌍 Environment Variables

### Required Variables

| Variable | Purpose | Used In |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Client & Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | Client & Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin operations | Server only |
| `SUPABASE_JWT_SECRET` | Verify Supabase tokens | Server only |
| `DATABASE_URL` | PostgreSQL connection | Prisma |
| `APP_JWT_SECRET` | Sign app-level JWTs | Server only |

### Validation Strategy

All environment variables are validated at application startup via `lib/env.ts`. The app will **fail fast** if any required variable is missing, preventing runtime errors in production.

---

## 🗄️ Database Schema

### User Model (Prisma)

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String   // Format: "supabase:{supabase_user_id}"
  role         String   @default("student")
  status       String   @default("active")
  firstName    String?
  lastName     String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### Key Design Decisions

- **`id` matches Supabase user id:** Enables easy joins and lookups
- **`passwordHash` placeholder:** Actual password stored in Supabase Auth
- **Role-based access:** Supports future admin/moderator features
- **Status field:** Enables account suspension/activation

---

## 🔧 Implementation Details

### Supabase Server Client (`lib/supabase/server.ts`)

- Uses `@supabase/ssr` for cookie management
- Reads/writes cookies via `next/headers`
- Uses service role key for admin operations
- Singleton pattern to prevent multiple instances

### Prisma Client (`lib/prisma.ts`)

- Global singleton to prevent connection exhaustion
- Development mode: cached in `globalThis`
- Production mode: new instance per deployment

### Token Service (`services/token-service.ts`)

- Generates JWT with configurable expiry (default: 7 days)
- Verifies and decodes tokens
- Uses `APP_JWT_SECRET` for signing

### API Utilities (`lib/api-utils.ts`)

- **`successResponse(data, status)`:** Standardized success format
- **`errorResponse(message, status)`:** Standardized error format
- **`validateEmail(email)`:** Email format validation
- Consistent error handling across all endpoints

---

## 🧪 Testing Strategy

### Manual Testing

1. **Signup:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!@#"}'
   ```

2. **Login:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!@#"}'
   ```

### Expected Responses

- **Signup Success:** `{ success: true, message: "User created successfully" }`
- **Login Success:** `{ success: true, data: { user, token, supabaseSession } }`
- **Errors:** `{ success: false, error: "Error message" }`

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] All environment variables set in Vercel
- [ ] Prisma migrations applied to production database
- [ ] Supabase RLS policies configured
- [ ] Email templates configured in Supabase
- [ ] JWT secret rotated and secured

### Post-Deployment

- [ ] Test signup endpoint
- [ ] Test login endpoint
- [ ] Verify email confirmation works
- [ ] Check error logging
- [ ] Monitor rate limiting

---

## 🔒 Security Considerations

### Best Practices

1. **Never expose service role key:** Server-side only
2. **Validate all inputs:** Email format, password strength
3. **Use HTTPS in production:** Prevent token interception
4. **Implement rate limiting:** Prevent brute force attacks
5. **Rotate secrets regularly:** JWT and service keys
6. **Enable RLS:** Supabase Row Level Security

### Future Enhancements

- [ ] Add refresh token rotation
- [ ] Implement OAuth providers (Google, GitHub)
- [ ] Add two-factor authentication (2FA)
- [ ] Rate limiting middleware
- [ ] Audit logging for auth events

---

## 📚 References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [@supabase/ssr Package](https://www.npmjs.com/package/@supabase/ssr)

---

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid JWT secret"**
   - Check `APP_JWT_SECRET` is set correctly
   - Ensure no trailing whitespace in env vars

2. **"Prisma connection failed"**
   - Verify `DATABASE_URL` format
   - Check database is accessible from Vercel
   - Run `npx prisma generate`

3. **"Supabase session not persisted"**
   - Ensure cookies are enabled
   - Check `@supabase/ssr` is installed
   - Verify domain settings in production

4. **"User not found after signup"**
   - Check Supabase email confirmation settings
   - Verify Prisma user creation succeeded
   - Check for database constraints

---

## 📝 Maintenance Notes

### Regular Tasks

- **Weekly:** Review error logs for auth failures
- **Monthly:** Audit active sessions and tokens
- **Quarterly:** Rotate JWT secrets
- **Annually:** Review and update dependencies

### Monitoring

- Track failed login attempts
- Monitor token expiration patterns
- Watch for unusual signup activity
- Alert on database connection errors

---

**Last Updated:** January 2, 2026  
**Next Review:** April 2, 2026
