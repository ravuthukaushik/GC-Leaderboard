# Green Cup Backend

This folder contains the backend layer for the Green Cup dashboard in Supabase form.

Use these files in order:

1. `supabase/schema.sql`
2. `supabase/policies.sql`
3. `supabase/seed.sql`

If you already set up Supabase before the department-role and student-count update, also run:

4. `supabase/role_migration.sql`

If you set up Supabase before the multi-basket rubric (Electricity, Water, Waste,
Representation, Events, Attendance, Extras), also run:

5. `supabase/metrics_migration.sql`

This adds the new per-basket input columns to `weekly_submissions` and the new
basket score columns to `weekly_scores`, and drops the obsolete columns from the
old three-basket model. After running it, re-save each period's submissions from
the Admin console so scores recompute.

## Scoring rubric (see `frontend/lib/scoring.js`)

- **Electricity (15):** relative per-capita consumption (10, lowest wins) + hostel-wide initiative (5, binary)
- **Water (15):** water meter installed (10, binary) + working overflow sensors / tanks ratio (5, penalty if none)
- **Waste (20):** relative per-capita mess waste (10, lowest wins) + dustbin signage ratio (5) + waste-reduction initiative (5, binary)
- **Representation (20):** sustainability secretary (5, binary) + meets attendance ratio (10) + pilot involvement (5, binary)
- **Events (20):** performance placement (winner 100, −10 per rank) + participation percentage, weighted to 20
- **Attendance (5):** OC representatives / total students, scaled to 5
- **Extras (bonus):** SOP-listed initiatives (3 each) + new/unique initiatives (≤5 each) + Ganesha workshop participation (5)

Relative baskets (electricity, mess waste) are computed across all hostels in a
period, so they only settle once every hostel's data for that period is entered.

What lives in Supabase:

- PostgreSQL tables for hostels, per-period raw submissions, computed scores, reporting periods, and user profiles
- Row-level security policies for public reads and admin-only writes
- Seed data for IIT Bombay hostels and starter reporting periods

What lives in the Next.js app:

- Server-side API routes
- Scoring logic
- Dashboard aggregation
- Admin submission flow
