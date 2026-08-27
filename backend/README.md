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

If you set up Supabase before the reweighted rubric below (Electricity 10, Water 5,
Waste 30, Events 30 + the Food Waste App, Four-Bin, and Green Score Calculator
inputs), also run:

6. `supabase/rubric_v2_migration.sql`

This adds `food_waste_app`, `four_bin_segregation`, and `green_score_users`, and
drops `electricity_initiative`, `water_meter_installed`, and `ganesha_participants`.
After running it, re-save each period's submissions so scores recompute.

## Scoring rubric (see `frontend/lib/scoring.js`)

Core baskets sum to 100; Extras are pure bonus points on top.

- **Electricity (10):** relative per-capita consumption, lowest wins
- **Water (5):** working overflow sensors / tanks ratio (penalty if none installed)
- **Waste (30):** relative per-capita mess waste (10, lowest wins) + PHO Food Waste App & staff training (5, binary) + four-bin mess segregation (5, binary) + dustbin signage ratio (5) + waste-reduction initiative (5, binary)
- **Representation (20):** sustainability secretary (5, binary) + meets attendance ratio (10) + pilot involvement (5, binary)
- **Events (30):** individual participation — performance placement (winner 100, −10 per rank) + participation percentage, weighted to 25 — plus Green Score Calculator resident-usage percentage (5)
- **Attendance (5):** OC representatives / total students, scaled to 5
- **Extras (bonus):** SOP-listed initiatives (3 each) + new/unique initiatives (≤5 each)

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
