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
  electricity_kwh numeric not null check (electricity_kwh >= 0),
  students_in_hostel integer not null default 1 check (students_in_hostel > 0),
  wasted_food_kg numeric not null check (wasted_food_kg >= 0),
  hostel_waste_kg numeric not null check (hostel_waste_kg >= 0),
  mess_diners integer not null check (mess_diners > 0),
  segregation_status text not null check (segregation_status in ('segregated', 'partial', 'not_segregated')),
  events_count integer not null default 0 check (events_count >= 0),
  orientation_attendance integer not null default 0 check (orientation_attendance >= 0),
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
  electricity_score numeric not null,
  waste_score numeric not null,
  energy_score numeric not null,
  wasted_food_score numeric not null,
  segregation_score numeric not null,
  hostel_waste_score numeric not null,
  events_score numeric not null,
  orientation_score numeric not null,
  electricity_per_student numeric not null,
  wasted_food_per_diner numeric not null,
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
