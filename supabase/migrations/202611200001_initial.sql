begin;

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180)
);
create table public.meetups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  name text not null check (length(trim(name)) between 1 and 160),
  description text,
  activity text,
  starts_at timestamptz,
  status text not null default 'draft' check (status in ('draft','planning','decided','completed','archived')),
  venue_id uuid references public.venues(id),
  created_at timestamptz not null default now(),
  check ((status in ('draft','planning')) = (venue_id is null))
);
create table public.meetup_members (
  meetup_id uuid references public.meetups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text not null,
  primary key (meetup_id, user_id)
);
create index meetup_members_by_user on public.meetup_members(user_id, meetup_id);
create table public.meetup_invites (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null references public.meetups(id) on delete cascade,
  token_digest text not null unique,
  expires_at timestamptz not null,
  redeemed_at timestamptz
);
create table public.meetup_origins (
  meetup_id uuid,
  user_id uuid,
  label text not null,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  mode text not null,
  max_fare_pesos numeric(9,2) check (max_fare_pesos >= 0),
  max_minutes integer check (max_minutes > 0),
  primary key (meetup_id, user_id),
  foreign key (meetup_id, user_id) references public.meetup_members on delete cascade,
  check ((latitude is null) = (longitude is null))
);
create table public.meetup_candidates (
  meetup_id uuid references public.meetups(id) on delete cascade,
  venue_id uuid references public.venues(id),
  primary key (meetup_id, venue_id)
);
create table public.meetup_journeys (
  meetup_id uuid,
  user_id uuid,
  venue_id uuid,
  minutes integer check (minutes >= 0),
  fare_pesos numeric(9,2) check (fare_pesos >= 0),
  provenance text not null check (provenance in ('verified','calculated','estimated','mocked','unavailable')),
  source text not null,
  calculated_at timestamptz not null default now(),
  primary key (meetup_id, user_id, venue_id),
  foreign key (meetup_id, user_id) references public.meetup_members on delete cascade,
  foreign key (meetup_id, venue_id) references public.meetup_candidates on delete cascade
);
create table public.meetup_votes (
  meetup_id uuid,
  user_id uuid,
  venue_id uuid not null,
  primary key (meetup_id, user_id),
  foreign key (meetup_id, user_id) references public.meetup_members on delete cascade,
  foreign key (meetup_id, venue_id) references public.meetup_candidates on delete cascade
);
create table public.meetup_recaps (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null,
  author_id uuid not null,
  title text,
  caption text not null check (length(trim(caption)) between 1 and 2000),
  visibility text not null default 'private' check (visibility in ('private','group')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (meetup_id, author_id) references public.meetup_members on delete cascade,
  check (visibility = 'private' or published_at is not null)
);
create index meetup_recaps_by_meetup on public.meetup_recaps(meetup_id);
create table public.meetup_ratings (
  meetup_id uuid,
  user_id uuid,
  stars smallint not null check (stars between 1 and 5),
  primary key (meetup_id, user_id),
  foreign key (meetup_id, user_id) references public.meetup_members on delete cascade
);

create function public.is_meetup_owner(target uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists(select 1 from public.meetups where id = target and owner_id = auth.uid());
$$;
create function public.is_meetup_member(target uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists(select 1 from public.meetup_members where meetup_id = target and user_id = auth.uid());
$$;
create function public.meetup_has_status(target uuid, states text[])
returns boolean language sql stable security invoker set search_path = ''
as $$
  select exists(select 1 from public.meetups where id = target and status = any(states));
$$;
revoke all on function public.is_meetup_owner(uuid), public.is_meetup_member(uuid), public.meetup_has_status(uuid,text[]) from public;
grant execute on function public.is_meetup_owner(uuid), public.is_meetup_member(uuid), public.meetup_has_status(uuid,text[]) to authenticated;

alter table public.venues enable row level security;
alter table public.meetups enable row level security;
alter table public.meetup_members enable row level security;
alter table public.meetup_invites enable row level security;
alter table public.meetup_origins enable row level security;
alter table public.meetup_candidates enable row level security;
alter table public.meetup_journeys enable row level security;
alter table public.meetup_votes enable row level security;
alter table public.meetup_recaps enable row level security;
alter table public.meetup_ratings enable row level security;

create policy venues_read on public.venues for select to authenticated using (true);
create policy meetups_read on public.meetups for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_meetup_member(id));
create policy meetups_create on public.meetups for insert to authenticated
  with check (owner_id = (select auth.uid()) and status = 'draft');
create policy members_read on public.meetup_members for select to authenticated
  using (public.is_meetup_owner(meetup_id) or public.is_meetup_member(meetup_id));
create policy owners_join on public.meetup_members for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_meetup_owner(meetup_id));
create policy origins_read on public.meetup_origins for select to authenticated using (public.is_meetup_member(meetup_id));
create policy origins_write on public.meetup_origins for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.is_meetup_member(meetup_id) and public.meetup_has_status(meetup_id, array['draft','planning']));
create policy candidates_read on public.meetup_candidates for select to authenticated using (public.is_meetup_member(meetup_id));
create policy journeys_read on public.meetup_journeys for select to authenticated using (public.is_meetup_member(meetup_id));
create policy votes_read on public.meetup_votes for select to authenticated using (public.is_meetup_member(meetup_id));
create policy votes_write on public.meetup_votes for all to authenticated
  using (user_id = (select auth.uid()) and public.meetup_has_status(meetup_id, array['planning']))
  with check (user_id = (select auth.uid()) and public.is_meetup_member(meetup_id) and public.meetup_has_status(meetup_id, array['planning']));
create policy recaps_read on public.meetup_recaps for select to authenticated
  using (public.is_meetup_member(meetup_id) and (author_id = (select auth.uid()) or (visibility = 'group' and published_at is not null)));
create policy recaps_write on public.meetup_recaps for all to authenticated
  using (author_id = (select auth.uid()) and public.is_meetup_member(meetup_id))
  with check (author_id = (select auth.uid()) and public.is_meetup_member(meetup_id) and public.meetup_has_status(meetup_id, array['completed']));
create policy ratings_read on public.meetup_ratings for select to authenticated using (public.is_meetup_member(meetup_id));
create policy ratings_write on public.meetup_ratings for all to authenticated
  using (user_id = (select auth.uid()) and public.is_meetup_member(meetup_id))
  with check (user_id = (select auth.uid()) and public.is_meetup_member(meetup_id) and public.meetup_has_status(meetup_id, array['completed']));

revoke all on public.venues, public.meetups, public.meetup_members, public.meetup_invites, public.meetup_origins,
  public.meetup_candidates, public.meetup_journeys, public.meetup_votes, public.meetup_recaps, public.meetup_ratings from anon, authenticated;

grant select on public.venues, public.meetups, public.meetup_members, public.meetup_origins, public.meetup_candidates,
  public.meetup_journeys, public.meetup_votes, public.meetup_recaps, public.meetup_ratings to authenticated;
grant insert on public.meetups, public.meetup_members to authenticated;
grant insert, update, delete on public.meetup_origins, public.meetup_votes, public.meetup_recaps, public.meetup_ratings to authenticated;

commit;
