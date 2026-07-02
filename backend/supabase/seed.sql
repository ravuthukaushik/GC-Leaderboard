insert into public.hostels (id, name, population) values
  ('h1', 'Hostel 1', 410),
  ('h2', 'Hostel 2', 395),
  ('h3', 'Hostel 3', 380),
  ('h4', 'Hostel 4', 360),
  ('h5', 'Hostel 5', 420),
  ('h6', 'Hostel 6', 350),
  ('h7', 'Hostel 7', 370),
  ('h8', 'Hostel 8', 365),
  ('h9', 'Hostel 9', 400),
  ('h10', 'Hostel 10', 390),
  ('h11', 'Hostel 11', 345),
  ('h12', 'Hostel 12', 405),
  ('h13', 'Hostel 13', 330),
  ('h14', 'Hostel 14', 415)
on conflict (id) do update set
  name = excluded.name,
  population = excluded.population;

insert into public.reporting_weeks (id, label, starts_on) values
  ('wk1', 'Week 1 · Jan 06', '2026-01-06'),
  ('wk2', 'Week 2 · Jan 13', '2026-01-13'),
  ('wk3', 'Week 3 · Jan 20', '2026-01-20'),
  ('wk4', 'Week 4 · Jan 27', '2026-01-27'),
  ('wk5', 'Week 5 · Feb 03', '2026-02-03')
on conflict (id) do update set
  label = excluded.label,
  starts_on = excluded.starts_on;
