# Green Cup Dashboard

Next.js + Supabase dashboard for the Green Cup at IIT Bombay.

## What is included

- Public live leaderboard
- Analytics charts and hostel battle mode
- Admin login with Supabase Auth
- Weekly data submission form
- Automated Green Cup scoring logic
- Demo mode fallback until Supabase is connected

## Install

```bash
cd /Users/kaushikravuthu/waste-dashboard/frontend
npm install
```

## Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Connect Supabase

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. In Supabase SQL editor, run:
   - `/Users/kaushikravuthu/waste-dashboard/backend/supabase/schema.sql`
   - `/Users/kaushikravuthu/waste-dashboard/backend/supabase/policies.sql`
   - `/Users/kaushikravuthu/waste-dashboard/backend/supabase/seed.sql`
5. Create an auth user from the `/auth` page.
6. In the `profiles` table, set that user’s `role` to `admin`.

## Deploy

1. Push the `frontend` folder to GitHub.
2. Import it into Vercel.
3. Add the same environment variables in Vercel.
4. Deploy.
