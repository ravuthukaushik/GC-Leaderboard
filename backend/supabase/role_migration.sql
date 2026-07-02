update public.profiles
set role = 'admin'
where role = 'sustainability';

alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check
check (role in ('viewer', 'pho', 'emd', 'admin'));

alter table public.weekly_submissions
add column if not exists students_in_hostel integer;

update public.weekly_submissions ws
set students_in_hostel = h.population
from public.hostels h
where ws.hostel_id = h.id
  and ws.students_in_hostel is null;

alter table public.weekly_submissions
alter column students_in_hostel set default 1;

alter table public.weekly_submissions
alter column students_in_hostel set not null;

alter table public.weekly_submissions
drop constraint if exists weekly_submissions_students_in_hostel_check;

alter table public.weekly_submissions
add constraint weekly_submissions_students_in_hostel_check
check (students_in_hostel > 0);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case
      when coalesce(new.raw_user_meta_data ->> 'department_role', 'viewer') in ('viewer', 'pho', 'emd', 'admin')
        then coalesce(new.raw_user_meta_data ->> 'department_role', 'viewer')
      else 'viewer'
    end
  )
  on conflict (id) do update
  set email = excluded.email;
  return new;
end;
$$;
