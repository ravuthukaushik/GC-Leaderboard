alter table public.hostels enable row level security;
alter table public.reporting_weeks enable row level security;
alter table public.profiles enable row level security;
alter table public.weekly_submissions enable row level security;
alter table public.weekly_scores enable row level security;

create policy "public read hostels"
on public.hostels for select
using (true);

create policy "public read reporting weeks"
on public.reporting_weeks for select
using (true);

create policy "public read weekly scores"
on public.weekly_scores for select
using (true);

create policy "user reads own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "admin manages submissions"
on public.weekly_submissions for all
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

create policy "admin manages scores"
on public.weekly_scores for all
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);
