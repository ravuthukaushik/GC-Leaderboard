alter table public.profiles
add column if not exists requested_role text;

alter table public.profiles
add column if not exists approved boolean not null default false;

alter table public.profiles
drop constraint if exists profiles_requested_role_check;

alter table public.profiles
add constraint profiles_requested_role_check
check (requested_role in ('viewer', 'pho', 'emd', 'admin'));

update public.profiles
set requested_role = coalesce(requested_role, role, 'viewer')
where requested_role is null;

update public.profiles
set approved = true
where role in ('pho', 'emd', 'admin');

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
