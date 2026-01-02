/**
 * Quick Setup Guide
 * 
 * If you're getting "table does not exist" error, follow these steps:
 */

console.log(`
╔══════════════════════════════════════════════════════════╗
║  DATABASE SETUP - Quick Fix for "table does not exist"  ║
╚══════════════════════════════════════════════════════════╝

The error you're seeing means the Prisma schema hasn't been pushed
to your Supabase database yet.

✅ SOLUTION:

1. Make sure you have a .env file (not just .env.local):
   $ cp .env.local .env

2. Push the Prisma schema to create tables:
   $ pnpm prisma db push

3. (Optional) Create a migration for version control:
   $ pnpm prisma migrate dev --name init

4. Restart your dev server:
   $ pnpm dev

═══════════════════════════════════════════════════════════

📝 NOTE: Prisma CLI reads from .env, not .env.local
Next.js reads from both .env.local and .env

That's why we need both files!

═══════════════════════════════════════════════════════════

🔍 To verify your database setup:
   $ pnpm prisma studio

This will open a GUI at http://localhost:5555 where you can
see your database tables and data.

═══════════════════════════════════════════════════════════
`);
