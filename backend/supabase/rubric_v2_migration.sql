-- Migration to the reweighted Green Cup rubric (v2).
-- Core baskets now sum to 100: Electricity 10, Water 5, Waste 30,
-- Representation 20, Events 30, Attendance 5 (+ Extras bonus).
-- Run once on a database created under the earlier multi-basket rubric.

-- ── weekly_submissions: new input columns ──
alter table public.weekly_submissions
  add column if not exists food_waste_app boolean not null default false,
  add column if not exists four_bin_segregation boolean not null default false,
  add column if not exists green_score_users integer not null default 0;

-- Drop inputs that are no longer scored:
--   electricity_initiative  -> electricity basket is now consumption-only (10)
--   water_meter_installed   -> water basket is now overflow-sensor-only (5)
--   ganesha_participants    -> Ganesha now folds into Events participation
alter table public.weekly_submissions
  drop column if exists electricity_initiative,
  drop column if exists water_meter_installed,
  drop column if exists ganesha_participants;

-- Existing rows carry stale scores; recompute by re-saving each period's
-- submissions from the Admin console after running this migration.
