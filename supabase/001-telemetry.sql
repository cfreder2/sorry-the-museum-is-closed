-- Sorry, the Museum is Closed: telemetry. Who plays, how they get in, how far round they get,
-- what they look at, and which of the side games they find.
--
-- Lives in the VECTRENCH Supabase project (csicwkbfgmjtuharranh), beside that game's tables and
-- AXI's and MANTIS's, every name prefixed `museum_` so none of them touch. It reuses that
-- project's anonymous sign-in: a device silently becomes an auth user the first time it plays.
--
-- Idempotent and additive: safe to run twice, touches nothing that exists.
--
-- Write paths: the client may only call the two `museum_record_*` functions. The tables are
-- closed to every client role; the functions are security definer and clamp every field, because
-- the payload comes from a game that ships as readable JavaScript. Reads are for the service key
-- (tools/telemetry.mjs).
--
-- No personal data: the player is the anonymous auth uuid and nothing else.

-- One row per page load that got as far as playing. The client makes up the id and reports the
-- same session again as it goes (each minute, and as the page is hidden), so the row holds the
-- latest totals.
create table if not exists public.museum_sessions (
  id          uuid primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  build       text not null default '',
  host        text not null default 'other',     -- pages | itch | local | other
  device      text not null default 'desktop',   -- phone | tablet | desktop
  input       text not null default 'keys',      -- keys | pad | touch
  settings    jsonb not null default '{}'::jsonb,
  wall_secs   integer not null default 0,        -- page open
  play_secs   integer not null default 0,        -- driving, looking, or at the card table
  mode        text not null default 'explore',   -- explore | race (last started)
  toy         text not null default 'car',       -- car | drone (last in use)
  resumed     boolean not null default false,    -- continued a saved game
  got_in      text,                              -- vent | fanlight | skylight | dock | duct | flap | window | roof | door
  got_in_secs integer,                           -- seconds of play before getting in
  works_seen  integer not null default 0,        -- on this device, all told
  works_new   integer not null default 0,        -- first seen this session
  rooms       integer not null default 0,        -- rooms entered this session
  stats       jsonb not null default '{}'::jsonb, -- hoops, high places, snowmen, best air, roof, poker, hockey, frame rate, where they were last
  synthetic   text,                              -- null for a person; see src/telemetry.js
  started_at  timestamptz not null default now(),
  last_seen   timestamptz not null default now()
);

-- Things that happen once and are worth a row of their own.
--   start   a game begun or continued        ref: mode
--   in      got into the building             ref: how
--   room    a room entered for the first time this session   ref: room id
--   look    a work looked at closely          ref: the museum's id for the work
--   race    a race finished                   ref: place
--   roof    got onto a roof                   ref: how
--   poker   left the card table               data: hands, stack
--   hockey  a goal                            data: you, bot
create table if not exists public.museum_events (
  id          bigint generated always as identity primary key,
  session_id  uuid not null references public.museum_sessions (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null,
  ref         text,
  secs        real,                              -- seconds of play when it happened
  build       text not null default '',
  data        jsonb not null default '{}'::jsonb,
  synthetic   text,
  created_at  timestamptz not null default now()
);

create index if not exists museum_sessions_started_idx on public.museum_sessions (started_at desc);
create index if not exists museum_events_kind_idx on public.museum_events (kind, ref, created_at desc);
create index if not exists museum_events_session_idx on public.museum_events (session_id);

alter table public.museum_sessions enable row level security;
alter table public.museum_events   enable row level security;

-- A short token, or null.
create or replace function public.museum_tok(v text, n int)
returns text language sql immutable as $$
  select nullif(left(regexp_replace(coalesce(v, ''), '[^a-zA-Z0-9_.-]', '', 'g'), n), '')
$$;

-- A number from the payload, clamped, or null when it is missing or not a number.
create or replace function public.museum_num(v text, lo real, hi real)
returns real language plpgsql immutable as $$
begin
  if v is null then return null; end if;
  return least(greatest(v::real, lo), hi);
exception when others then return null;
end;
$$;

-- The session, created or brought up to date. Totals only ever go up; how they got in and a
-- harness flag are kept once set.
create or replace function public.museum_record_session(p jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  sid uuid;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p is null or pg_column_size(p) > 8192 or coalesce((p ->> 'v')::int, 0) <> 1 then return; end if;
  begin sid := (p ->> 'id')::uuid; exception when others then return; end;
  insert into public.museum_sessions as s
    (id, user_id, build, host, device, input, settings, wall_secs, play_secs, mode, toy, resumed,
     got_in, got_in_secs, works_seen, works_new, rooms, stats, synthetic)
  values (
    sid, uid,
    coalesce(museum_tok(p ->> 'build', 32), ''),
    coalesce(museum_tok(p ->> 'host', 12), 'other'),
    coalesce(museum_tok(p ->> 'device', 12), 'desktop'),
    case when p ->> 'input' in ('keys','pad','touch') then p ->> 'input' else 'keys' end,
    case when jsonb_typeof(p -> 'settings') = 'object' and pg_column_size(p -> 'settings') < 1024 then p -> 'settings' else '{}'::jsonb end,
    coalesce(museum_num(p ->> 'wall', 0, 86400)::int, 0),
    coalesce(museum_num(p ->> 'play', 0, 86400)::int, 0),
    case when p ->> 'mode' in ('explore','race') then p ->> 'mode' else 'explore' end,
    case when p ->> 'toy' in ('car','drone') then p ->> 'toy' else 'car' end,
    coalesce((p ->> 'resumed')::boolean, false),
    museum_tok(p ->> 'gotIn', 12),
    museum_num(p ->> 'gotInSecs', 0, 86400)::int,
    coalesce(museum_num(p ->> 'seen', 0, 100000)::int, 0),
    coalesce(museum_num(p ->> 'seenNew', 0, 100000)::int, 0),
    coalesce(museum_num(p ->> 'rooms', 0, 1000)::int, 0),
    case when jsonb_typeof(p -> 'stats') = 'object' and pg_column_size(p -> 'stats') < 2048 then p -> 'stats' else '{}'::jsonb end,
    museum_tok(p ->> 'synth', 12)
  )
  on conflict (id) do update set
    input       = excluded.input,
    settings    = excluded.settings,
    wall_secs   = greatest(s.wall_secs, excluded.wall_secs),
    play_secs   = greatest(s.play_secs, excluded.play_secs),
    mode        = excluded.mode,
    toy         = excluded.toy,
    resumed     = s.resumed or excluded.resumed,
    got_in      = coalesce(s.got_in, excluded.got_in),
    got_in_secs = coalesce(s.got_in_secs, excluded.got_in_secs),
    works_seen  = greatest(s.works_seen, excluded.works_seen),
    works_new   = greatest(s.works_new, excluded.works_new),
    rooms       = greatest(s.rooms, excluded.rooms),
    stats       = excluded.stats,
    synthetic   = coalesce(s.synthetic, excluded.synthetic),
    last_seen   = now()
  where s.user_id = uid;                       -- nobody updates someone else's session
end;
$$;

create or replace function public.museum_record_event(p jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  sid uuid;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p is null or pg_column_size(p) > 4096 or coalesce((p ->> 'v')::int, 0) <> 1 then return; end if;
  begin sid := (p ->> 'session')::uuid; exception when others then return; end;
  if not exists (select 1 from public.museum_sessions where id = sid and user_id = uid) then return; end if;
  insert into public.museum_events (session_id, user_id, kind, ref, secs, build, data, synthetic)
  values (
    sid, uid,
    coalesce(museum_tok(p ->> 'kind', 16), 'unknown'),
    museum_tok(p ->> 'ref', 40),
    museum_num(p ->> 'secs', 0, 86400),
    coalesce(museum_tok(p ->> 'build', 32), ''),
    case when jsonb_typeof(p -> 'data') = 'object' and pg_column_size(p -> 'data') < 2048 then p -> 'data' else '{}'::jsonb end,
    museum_tok(p ->> 'synth', 12)
  );
end;
$$;

-- People only in every summary: rows the client flagged as a harness are left out.
create or replace view public.museum_session_summary with (security_invoker = on) as
  select date_trunc('day', started_at)::date as day,
         count(*)                                   as sessions,
         count(distinct user_id)                    as players,
         round(avg(play_secs)::numeric)             as mean_play_secs,
         count(*) filter (where got_in is not null) as got_in,
         round(avg(works_new)::numeric, 1)          as mean_works_new,
         round(avg(rooms)::numeric, 1)              as mean_rooms,
         count(*) filter (where device = 'phone')   as on_phones
  from public.museum_sessions where synthetic is null group by 1;

create or replace view public.museum_entry_summary with (security_invoker = on) as
  select coalesce(got_in, '(never got in)') as how, count(*) as sessions, count(distinct user_id) as players,
         round((percentile_cont(0.5) within group (order by got_in_secs))::numeric) as median_secs
  from public.museum_sessions where synthetic is null and not resumed group by 1;

create or replace view public.museum_room_summary with (security_invoker = on) as
  select ref as room, count(*) as visits, count(distinct user_id) as players,
         round((percentile_cont(0.5) within group (order by secs))::numeric) as median_secs_in
  from public.museum_events where kind = 'room' and synthetic is null group by 1;

create or replace view public.museum_look_summary with (security_invoker = on) as
  select ref as work, max(data ->> 't') as title, count(*) as looks, count(distinct user_id) as players
  from public.museum_events where kind = 'look' and synthetic is null group by 1;

-- Grants. "Expose new tables" is off in this project, so everything is explicit.
revoke all on public.museum_sessions, public.museum_events from public, anon, authenticated;
grant select on public.museum_sessions, public.museum_events, public.museum_session_summary,
                public.museum_entry_summary, public.museum_room_summary, public.museum_look_summary to service_role;
revoke execute on function public.museum_record_session(jsonb), public.museum_record_event(jsonb) from public, anon;
grant  execute on function public.museum_record_session(jsonb), public.museum_record_event(jsonb) to authenticated;
