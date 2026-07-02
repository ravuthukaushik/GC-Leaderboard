# Green Cup Backend

This folder contains the backend layer for the Green Cup dashboard in Supabase form.

Use these files in order:

1. `supabase/schema.sql`
2. `supabase/policies.sql`
3. `supabase/seed.sql`

If you already set up Supabase before the department-role and student-count update, also run:

4. `supabase/role_migration.sql`

What lives in Supabase:

- PostgreSQL tables for hostels, weekly raw submissions, computed weekly scores, reporting weeks, and user profiles
- Row-level security policies for public reads and admin-only writes
- Seed data for IIT Bombay hostels and starter reporting weeks

What lives in the Next.js app:

- Server-side API routes
- Scoring logic
- Dashboard aggregation
- Admin submission flow
