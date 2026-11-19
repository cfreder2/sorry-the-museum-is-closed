-- Sorry, the Museum is Closed: permissions. A record of who holds the rights in each work the game
-- shows that is still in copyright, and of every message to and from them.
--
-- Lives in the VECTRENCH Supabase project beside the telemetry tables, every name prefixed
-- `museum_`. Idempotent and additive.
--
-- Private: row level security is on with no policy, so no client role can read or write these.
-- They are for the service key and the dashboard only. Nothing in the game reads them.

-- Who to ask. One row per rights holder: a collecting society, an estate or foundation, an artist,
-- or the museum itself where no one else is named.
create table if not exists public.museum_rights_holders (
  id            bigint generated always as identity primary key,
  name          text not null unique,
  kind          text not null default 'unknown',   -- society | estate | artist | museum | unknown
  contact_email text,                              -- only where it has been found on the holder's own pages
  contact_url   text,
  contact_notes text not null default '',
  created_at    timestamptz not null default now()
);

-- One row per work shown. `status` is where the asking has got to.
create table if not exists public.museum_rights_works (
  artwork_id       bigint primary key,             -- the museum's own id (artic.edu/artworks/<id>)
  title            text not null,
  artist           text not null default '',
  date_display     text not null default '',
  gallery          text not null default '',
  copyright_notice text not null default '',       -- as the museum's API gives it
  image_id         text not null default '',
  holder_id        bigint references public.museum_rights_holders (id),
  status           text not null default 'not_asked',   -- not_asked | drafted | sent | granted | refused | no_reply | removed
  displayed        boolean not null default true,  -- shown in the game as of last_listed
  notes            text not null default '',
  last_listed      timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists museum_rights_works_holder on public.museum_rights_works (holder_id);

-- Every message, out and in. A draft is a message not yet sent.
create table if not exists public.museum_rights_messages (
  id          bigint generated always as identity primary key,
  holder_id   bigint not null references public.museum_rights_holders (id),
  artwork_ids bigint[] not null default '{}',      -- the works the message is about
  direction   text not null default 'out',         -- out | in
  channel     text not null default 'email',
  status      text not null default 'draft',       -- draft | sent | received
  subject     text not null default '',
  body        text not null default '',
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists museum_rights_messages_holder on public.museum_rights_messages (holder_id);

alter table public.museum_rights_holders  enable row level security;
alter table public.museum_rights_works    enable row level security;
alter table public.museum_rights_messages enable row level security;
revoke all on public.museum_rights_holders, public.museum_rights_works, public.museum_rights_messages from anon, authenticated;
