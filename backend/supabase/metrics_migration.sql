-- Migration to the multi-basket Green Cup rubric
-- (Electricity, Water, Waste, Representation, Events, Attendance, Extras).
-- Safe to run once on a database created before this rubric. Old scoring
-- columns are dropped because the previous model is not convertible.

-- ── weekly_submissions: new input columns ──
alter table public.weekly_submissions
  add column if not exists electricity_initiative boolean not null default false,
  add column if not exists water_meter_installed boolean not null default false,
  add column if not exists overflow_sensor_installed boolean not null default false,
  add column if not exists water_tanks integer not null default 0,
  add column if not exists working_overflow_sensors integer not null default 0,
  add column if not exists mess_waste_kg numeric not null default 0,
  add column if not exists mess_eating_students integer not null default 1,
  add column if not exists dustbins_total integer not null default 0,
  add column if not exists dustbins_with_signage integer not null default 0,
  add column if not exists waste_reduction_initiative boolean not null default false,
  add column if not exists sustainability_secretary boolean not null default false,
  add column if not exists meetings_attended integer not null default 0,
  add column if not exists meetings_total integer not null default 0,
  add column if not exists pilot_involvement boolean not null default false,
  add column if not exists event_placement integer not null default 0,
  add column if not exists participating_students integer not null default 0,
  add column if not exists oc_representatives integer not null default 0,
  add column if not exists sop_initiatives integer not null default 0,
  add column if not exists unique_initiative_points numeric not null default 0,
  add column if not exists ganesha_participants integer not null default 0;

-- Make electricity_kwh optional (defaults to 0) so partial uploads work.
alter table public.weekly_submissions
  alter column electricity_kwh set default 0;

-- Drop obsolete input columns from the old model.
alter table public.weekly_submissions
  drop column if exists wasted_food_kg,
  drop column if exists hostel_waste_kg,
  drop column if exists mess_diners,
  drop column if exists segregation_status,
  drop column if exists events_count,
  drop column if exists orientation_attendance;

-- ── weekly_scores: new basket columns ──
alter table public.weekly_scores
  add column if not exists water_score numeric not null default 0,
  add column if not exists representation_score numeric not null default 0,
  add column if not exists attendance_score numeric not null default 0,
  add column if not exists extras_score numeric not null default 0,
  add column if not exists mess_waste_per_student numeric not null default 0;

alter table public.weekly_scores
  alter column electricity_score set default 0,
  alter column waste_score set default 0;

-- Drop obsolete score columns from the old model.
alter table public.weekly_scores
  drop column if exists energy_score,
  drop column if exists wasted_food_score,
  drop column if exists segregation_score,
  drop column if exists hostel_waste_score,
  drop column if exists orientation_score,
  drop column if exists wasted_food_per_diner;

-- Existing rows carry stale scores; recompute by re-saving any submission
-- for each week from the Admin console, or clear and re-enter data.
