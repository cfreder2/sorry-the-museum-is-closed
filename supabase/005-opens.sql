-- Sorry, the Museum is Closed: page opens. One row per page load, from the loading screen on, and how far it got.
--
-- Why: a museum_sessions row is only made when a game is started (Start, or Continue). Anyone who leaves while the
-- building loads, or at the title screen, was never recorded anywhere, on any host. On a slow phone over a slow network
-- the title takes most of a minute, so "players bounce after about 60 s" and "no sessions from itch" can both be people
-- who never reached Start. This table counts them, so opens -> title -> play can be read per host (pages, itch, other).
--
-- Additive and idempotent: a new table and a new function, nothing existing is touched. Same rules as 001: the table
-- is closed to clients, the client may only call museum_record_open, which is security definer and clamps every field.
-- The id is the page's own (src/telemetry.js), the same id its session row gets if a game is started.

create table if not exists public.museum_opens (
  id          uuid primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  build       text not null default '',
  host        text not null default 'other',     -- pages | itch | local | other
  device      text not null default 'desktop',   -- phone | tablet | desktop
  framed      boolean not null default false,    -- played inside another page's frame (itch.io does this)
  reached     text not null default 'loading',   -- loading | title | play: only ever moves on
  load_secs   real,                              -- page open to the title ready
  wall_secs   integer not null default 0,        -- page open, all told (sent again as the page is hidden)
  synthetic   text,                              -- null for a person; see src/telemetry.js
  opened_at   timestamptz not null default now(),
  last_seen   timestamptz not null default now()
);
create index if not exists museum_opens_opened_idx on public.museum_opens (opened_at desc);
alter table public.museum_opens enable row level security;

create or replace function public.museum_record_open(p jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  oid uuid;
  stage text;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p is null or pg_column_size(p) > 4096 or coalesce((p ->> 'v')::int, 0) <> 1 then return; end if;
  begin oid := (p ->> 'id')::uuid; exception when others then return; end;
  stage := case when p ->> 'reached' in ('loading', 'title', 'play') then p ->> 'reached' else 'loading' end;
  insert into public.museum_opens as o (id, user_id, build, host, device, framed, reached, load_secs, wall_secs, synthetic)
  values (
    oid, uid,
    coalesce(museum_tok(p ->> 'build', 32), ''),
    coalesce(museum_tok(p ->> 'host', 12), 'other'),
    coalesce(museum_tok(p ->> 'device', 12), 'desktop'),
    coalesce((p ->> 'framed')::boolean, false),
    stage,
    museum_num(p ->> 'loadSecs', 0, 3600),
    coalesce(museum_num(p ->> 'wall', 0, 86400)::int, 0),
    museum_tok(p ->> 'synth', 12)
  )
  on conflict (id) do update set
    reached   = case when array_position(array['loading','title','play'], excluded.reached) > array_position(array['loading','title','play'], o.reached) then excluded.reached else o.reached end,
    load_secs = coalesce(o.load_secs, excluded.load_secs),
    wall_secs = greatest(o.wall_secs, excluded.wall_secs),
    synthetic = coalesce(o.synthetic, excluded.synthetic),
    last_seen = now()
  where o.user_id = uid;                       -- nobody updates someone else's row
end;
$$;

-- People only: how many pages opened, reached the title, and started, by host and day.
create or replace view public.museum_open_summary with (security_invoker = on) as
  select date_trunc('day', opened_at)::date as day, host,
         count(*)                                              as opens,
         count(*) filter (where reached in ('title', 'play'))  as reached_title,
         count(*) filter (where reached = 'play')              as started,
         round((percentile_cont(0.5) within group (order by load_secs))::numeric, 1) as median_load_secs
  from public.museum_opens where synthetic is null group by 1, 2;

revoke all on public.museum_opens, public.museum_open_summary from public, anon, authenticated;
grant select on public.museum_opens, public.museum_open_summary to service_role;
revoke execute on function public.museum_record_open(jsonb) from public, anon;
grant  execute on function public.museum_record_open(jsonb) to authenticated;
