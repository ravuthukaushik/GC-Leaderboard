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
  ('wk1', 'Month 1 · Jan', '2026-01-06'),
  ('wk2', 'Month 2 · Feb', '2026-02-03'),
  ('wk3', 'Month 3 · Mar', '2026-03-03'),
  ('wk4', 'Month 4 · Apr', '2026-04-07'),
  ('wk5', 'Month 5 · May', '2026-05-05')
on conflict (id) do update set
  label = excluded.label,
  starts_on = excluded.starts_on;
