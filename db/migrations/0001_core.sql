do $$
begin
  if not exists (select from pg_catalog.pg_roles where rolname = 'barkits_runtime') then
    create role barkits_runtime nologin noinherit;
  end if;

  if exists (
    select from pg_catalog.pg_roles
    where rolname = 'barkits_runtime'
      and (rolcanlogin or rolinherit or rolsuper or rolcreaterole or rolcreatedb or rolreplication or rolbypassrls)
  ) or exists (
    select from pg_catalog.pg_auth_members
    where member = 'barkits_runtime'::regrole
  ) then
    raise exception 'Existing barkits_runtime role is not a restricted group.';
  end if;
end;
$$;

create schema barkits;
revoke all on schema barkits from public;
grant usage on schema barkits to barkits_runtime;

create table barkits.users (
  id uuid primary key default gen_random_uuid(),
  display_name text check (length(trim(display_name)) between 1 and 160),
  created_at timestamptz not null default now()
);

create table barkits.external_identities (
  provider text not null check (provider = 'google'),
  provider_subject text not null check (length(provider_subject) between 1 and 255),
  user_id uuid not null references barkits.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (provider, provider_subject),
  unique (user_id, provider)
);

create table barkits.meetups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references barkits.users(id),
  kind text not null check (kind in ('quick_catch_up', 'planned')),
  name text not null check (length(trim(name)) between 1 and 160),
  description text,
  activity text,
  starts_at timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'planning', 'decided', 'completed', 'archived', 'cancelled')),
  created_at timestamptz not null default now()
);
create index meetups_by_owner on barkits.meetups (owner_id, created_at desc, id);

create table barkits.meetup_members (
  meetup_id uuid references barkits.meetups(id) on delete cascade,
  user_id uuid references barkits.users(id) on delete cascade,
  primary key (meetup_id, user_id)
);
create index meetup_members_by_user on barkits.meetup_members (user_id, meetup_id);

alter table barkits.meetups
  add constraint meetup_owner_member foreign key (id, owner_id)
  references barkits.meetup_members(meetup_id, user_id) deferrable initially deferred;

revoke all on all tables in schema barkits from public, barkits_runtime;
