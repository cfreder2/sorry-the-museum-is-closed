-- Sorry, the Museum is Closed: the title screen's "X patrons have enjoyed Y art pieces".
--
-- Additive and idempotent. A patron is a device that has looked closely at a work at least once
-- (one row each in museum_view_rate); a piece is a work anybody has looked at. Numbers only.
create or replace function public.museum_view_totals()
returns table (patrons bigint, works bigint, looks bigint)
language sql stable security definer set search_path = public
as $$
  select (select count(*) from public.museum_view_rate),
         (select count(*) from public.museum_work_views where views > 0),
         (select coalesce(sum(views), 0)::bigint from public.museum_work_views)
$$;
revoke execute on function public.museum_view_totals() from public;
grant  execute on function public.museum_view_totals() to anon, authenticated;
