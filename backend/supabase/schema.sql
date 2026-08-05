create extension if not exists "pgcrypto";

create table if not exists public.hostels (
  id text primary key,
  name text not null unique,
  population integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.reporting_weeks (
  id text primary key,
  label text not null,
  starts_on date not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'viewer' check (role in ('viewer', 'pho', 'emd', 'admin')),
  requested_role text check (requested_role in ('viewer', 'pho', 'emd', 'admin')),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.weekly_submissions (
  id uuid primary key default gen_random_uuid(),
  week_id text not null references public.reporting_weeks(id) on delete cascade,
  hostel_id text not null references public.hostels(id) on delete cascade,
  students_in_hostel integer not null default 1 check (students_in_hostel > 0),

  -- Electricity basket (15)
  electricity_kwh numeric not null default 0 check (electricity_kwh >= 0),
  electricity_initiative boolean not null default false,

  -- Water basket (15)
  water_meter_installed boolean not null default false,
  overflow_sensor_installed boolean not null default false,
  water_tanks integer not null default 0 check (water_tanks >= 0),
  working_overflow_sensors integer not null default 0 check (working_overflow_sensors >= 0),

  -- Waste basket (20)
  mess_waste_kg numeric not null default 0 check (mess_waste_kg >= 0),
  mess_eating_students integer not null default 1 check (mess_eating_students > 0),
  dustbins_total integer not null default 0 check (dustbins_total >= 0),
  dustbins_with_signage integer not null default 0 check (dustbins_with_signage >= 0),
  waste_reduction_initiative boolean not null default false,

  -- Representation basket (20)
  sustainability_secretary boolean not null default false,
  meetings_attended integer not null default 0 check (meetings_attended >= 0),
  meetings_total integer not null default 0 check (meetings_total >= 0),
  pilot_involvement boolean not null default false,

  -- Events basket (20)
  event_placement integer not null default 0 check (event_placement >= 0),
  participating_students integer not null default 0 check (participating_students >= 0),

  -- Attendance basket (5)
  oc_representatives integer not null default 0 check (oc_representatives >= 0),

  -- Extras (bonus)
  sop_initiatives integer not null default 0 check (sop_initiatives >= 0),
  unique_initiative_points numeric not null default 0 check (unique_initiative_points >= 0),
  ganesha_participants integer not null default 0 check (ganesha_participants >= 0),

  notes text,
  submitted_by text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (week_id, hostel_id)
);

create table if not exists public.weekly_scores (
  id uuid primary key default gen_random_uuid(),
  week_id text not null references public.reporting_weeks(id) on delete cascade,
  hostel_id text not null references public.hostels(id) on delete cascade,
  hostel_name text not null,
  rank integer not null,
  total_score numeric not null,
  electricity_score numeric not null default 0,
  water_score numeric not null default 0,
  waste_score numeric not null default 0,
  representation_score numeric not null default 0,
  events_score numeric not null default 0,
  attendance_score numeric not null default 0,
  extras_score numeric not null default 0,
  electricity_per_student numeric not null default 0,
  mess_waste_per_student numeric not null default 0,
  momentum_delta numeric not null default 0,
  badges text[] not null default '{}',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (week_id, hostel_id)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, requested_role, approved)
  values (
    new.id,
    new.email,
    'viewer',
    case
      when coalesce(new.raw_user_meta_data ->> 'department_role', 'viewer') in ('viewer', 'pho', 'emd', 'admin')
        then coalesce(new.raw_user_meta_data ->> 'department_role', 'viewer')
      else 'viewer'
    end,
    false
  )
  on conflict (id) do update
  set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
