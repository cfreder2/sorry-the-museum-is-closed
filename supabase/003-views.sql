-- Sorry, the Museum is Closed: view counts. How many times each work has been looked at, by
-- everybody, so a label can say "Seen 214 times by everyone".
--
-- Lives in the VECTRENCH Supabase project beside the telemetry tables (001-telemetry.sql), every
-- name prefixed `museum_`, and reuses that project's anonymous sign-in.
--
-- Idempotent and additive: safe to run twice, touches nothing that exists.
--
-- Write path: the client may only call `museum_record_view`. The tables are closed to every
-- client role; the function is security definer, checks and clamps what it is given (the payload
-- comes from a game that ships as readable JavaScript), and lets one device add only so many
-- views an hour. Read path: `museum_top_views`, which gives back counts and titles and nothing
-- else. The game calls neither from a test, nor when the player has switched statistics off
-- (src/telemetry.js).
--
-- No personal data: a count per work. The limiter keeps the anonymous auth uuid and a number.

-- One row per work that anybody has looked at. `artwork_id` is the museum's own id
-- (artic.edu/artworks/<id>). A "look" is looking closer at a work, or a Stunt Look, which is
-- counted in `views` and again in `stunt_views`.
create table if not exists public.museum_work_views (
  artwork_id  bigint primary key,
  title       text not null default '',          -- as the first client to report it gave it; a convenience for reading, not trusted
  views       bigint not null default 0,
  stunt_views bigint not null default 0,
  first_at    timestamptz not null default now(),
  last_at     timestamptz not null default now()
);

-- How many views each device has added in the current hour, so that one of them cannot run the
-- numbers up. One row per device, overwritten as the hours go by.
create table if not exists public.museum_view_rate (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  hour     timestamptz not null default date_trunc('hour', now()),
  n        integer not null default 0
);

create index if not exists museum_work_views_top_idx on public.museum_work_views (views desc);

alter table public.museum_work_views enable row level security;
alter table public.museum_view_rate  enable row level security;

-- A work has been looked at. Returns the work's total afterwards, or null when nothing was
-- recorded (a bad id, or a device over its limit for the hour: 240, four a minute).
create or replace function public.museum_record_view(artwork_id bigint, title text default '', stunt boolean default false)
returns bigint
language plpgsql security definer set search_path = public
as $$
#variable_conflict use_column
declare
  uid  uuid := auth.uid();
  aid  bigint := museum_record_view.artwork_id;
  ttl  text := left(btrim(regexp_replace(coalesce(museum_record_view.title, ''), '[[:cntrl:]]', ' ', 'g')), 200);
  st   boolean := coalesce(museum_record_view.stunt, false);
  used integer;
  total bigint;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if aid is null or aid < 1 or aid > 10000000 then return null; end if;

  insert into public.museum_view_rate as r (user_id, hour, n)
  values (uid, date_trunc('hour', now()), 1)
  on conflict (user_id) do update set
    n    = case when r.hour = excluded.hour then r.n + 1 else 1 end,
    hour = excluded.hour
  returning r.n into used;
  if used > 240 then return null; end if;

  insert into public.museum_work_views as w (artwork_id, title, views, stunt_views)
  values (aid, ttl, 1, case when st then 1 else 0 end)
  on conflict (artwork_id) do update set
    views       = w.views + 1,
    stunt_views = w.stunt_views + case when st then 1 else 0 end,
    title       = case when w.title = '' then excluded.title else w.title end,
    last_at     = now()
  returning w.views into total;
  return total;
end;
$$;

-- The most-viewed works, most first. `n` is clamped to 1..2000 (the whole hang is under 2000).
create or replace function public.museum_top_views(n integer default 20)
returns table (artwork_id bigint, title text, views bigint, stunt_views bigint)
language sql stable security definer set search_path = public
as $$
  select w.artwork_id, w.title, w.views, w.stunt_views
  from public.museum_work_views w
  order by w.views desc, w.artwork_id
  limit least(greatest(coalesce(n, 20), 1), 2000)
$$;

-- Grants. "Expose new tables" is off in this project, so everything is explicit.
revoke all on public.museum_work_views, public.museum_view_rate from public, anon, authenticated;
grant select on public.museum_work_views, public.museum_view_rate to service_role;
revoke execute on function public.museum_record_view(bigint, text, boolean) from public, anon;
grant  execute on function public.museum_record_view(bigint, text, boolean) to authenticated;
revoke execute on function public.museum_top_views(integer) from public;
grant  execute on function public.museum_top_views(integer) to anon, authenticated;
