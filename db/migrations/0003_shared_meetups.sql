create table barkits.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180)
);
alter table barkits.meetups add column venue_id uuid references barkits.venues(id);
alter table barkits.meetup_members add column display_name text check (length(trim(display_name)) between 1 and 80);
create table barkits.meetup_invites (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null references barkits.meetups(id) on delete cascade,
  token_digest text not null unique,
  expires_at timestamptz not null,
  redeemed_at timestamptz
);
create table barkits.meetup_origins (
  meetup_id uuid,
  user_id uuid,
  label text not null,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  mode text not null,
  max_fare_pesos numeric(9,2) check (max_fare_pesos >= 0),
  max_minutes integer check (max_minutes > 0),
  primary key (meetup_id, user_id),
  foreign key (meetup_id, user_id) references barkits.meetup_members on delete cascade,
  check ((latitude is null) = (longitude is null))
);
create table barkits.meetup_candidates (
  meetup_id uuid references barkits.meetups(id) on delete cascade,
  venue_id uuid references barkits.venues(id),
  primary key (meetup_id, venue_id)
);
create table barkits.meetup_journeys (
  meetup_id uuid,
  user_id uuid,
  venue_id uuid,
  minutes integer check (minutes >= 0),
  fare_pesos numeric(9,2) check (fare_pesos >= 0),
  provenance text not null check (provenance in ('verified','calculated','estimated','mocked','unavailable')),
  source text not null,
  calculated_at timestamptz not null default now(),
  primary key (meetup_id, user_id, venue_id),
  foreign key (meetup_id, user_id) references barkits.meetup_members on delete cascade,
  foreign key (meetup_id, venue_id) references barkits.meetup_candidates on delete cascade
);
create table barkits.meetup_votes (
  meetup_id uuid,
  user_id uuid,
  venue_id uuid not null,
  primary key (meetup_id, user_id),
  foreign key (meetup_id, user_id) references barkits.meetup_members on delete cascade,
  foreign key (meetup_id, venue_id) references barkits.meetup_candidates on delete cascade
);
create table barkits.meetup_recaps (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null,
  author_id uuid not null,
  title text,
  caption text not null check (length(trim(caption)) between 1 and 2000),
  visibility text not null default 'private' check (visibility in ('private','group')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (meetup_id, author_id) references barkits.meetup_members on delete cascade,
  check (visibility = 'private' or published_at is not null)
);
create index meetup_recaps_by_meetup on barkits.meetup_recaps(meetup_id);
create table barkits.meetup_ratings (
  meetup_id uuid,
  user_id uuid,
  stars smallint not null check (stars between 1 and 5),
  primary key (meetup_id, user_id),
  foreign key (meetup_id, user_id) references barkits.meetup_members on delete cascade
);

create function barkits.is_meetup_owner(target uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists(select 1 from barkits.meetups where id = target and owner_id = barkits.meetup_actor());
$$;
create function barkits.is_meetup_member(target uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists(select 1 from barkits.meetup_members where meetup_id = target and user_id = barkits.meetup_actor());
$$;
alter table barkits.meetup_invites add column redeemed_by uuid references barkits.users(id);

create function barkits.create_shared_meetup(
  request_id uuid, meetup_name text, member_name text, meetup_activity text,
  meetup_description text, meetup_start timestamptz
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := barkits.meetup_actor();
begin
  if actor is null or request_id is null or coalesce(length(trim(meetup_name)), 0) not between 1 and 160
     or coalesce(length(trim(member_name)), 0) not between 1 and 80 then
    raise exception 'Enter a meetup name and your display name.';
  end if;
  insert into barkits.meetups(id, owner_id, name, activity, description, starts_at, status, kind)
    values (request_id, actor, trim(meetup_name), nullif(trim(meetup_activity), ''), nullif(trim(meetup_description), ''), meetup_start, 'planning', 'planned')
    on conflict (id) do nothing;
  if not barkits.is_meetup_owner(request_id) then raise exception 'Could not create this meetup.'; end if;
  insert into barkits.meetup_members(meetup_id, user_id, display_name)
    values (request_id, actor, trim(member_name)) on conflict do nothing;
  return request_id;
end;
$$;

create function barkits.issue_meetup_code(target uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare
  code text := upper(right(replace(gen_random_uuid()::text, '-', ''), 16));
begin
  perform 1 from barkits.meetups where id = target and owner_id = barkits.meetup_actor() and status in ('draft','planning') for no key update;
  if not found then raise exception 'Only the organizer of an open meetup can invite friends.'; end if;
  delete from barkits.meetup_invites where meetup_id = target and redeemed_at is null;
  insert into barkits.meetup_invites(meetup_id, token_digest, expires_at)
    values (target, encode(sha256(convert_to(code, 'UTF8')), 'hex'), now() + interval '24 hours');
  return code;
end;
$$;

revoke all on all tables in schema barkits from public, barkits_runtime;
revoke all on all functions in schema barkits from public;
grant execute on function barkits.create_shared_meetup(uuid,text,text,text,text,timestamptz),
  barkits.issue_meetup_code(uuid) to barkits_runtime;
alter table barkits.meetups add constraint shared_venue_state
  check ((status in ('decided','completed','archived')) = (venue_id is not null)) not valid;
