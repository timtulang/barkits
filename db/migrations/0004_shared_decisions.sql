alter table barkits.venues add column shared_meetup_id uuid references barkits.meetups on delete cascade,
  add column catalog_key text, add unique (shared_meetup_id, catalog_key);

create function barkits.lock_shared_planning(target uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not barkits.is_meetup_member(target) then raise exception 'This meetup is available to its members.'; end if;
  perform 1 from barkits.meetups where id = target and status = 'planning' for no key update;
  if not found then raise exception 'Planning has closed. Refresh the group to see the chosen venue.'; end if;
end;
$$;
revoke all on function barkits.lock_shared_planning(uuid) from public, barkits_runtime;

create function barkits.shortlist_shared_venue(target uuid, place_key text, place_name text, lat double precision, lng double precision)
returns uuid language plpgsql security definer set search_path = '' as $$
declare candidate uuid;
begin
  perform barkits.lock_shared_planning(target);
  if coalesce(length(trim(place_key)),0) not between 1 and 160 or coalesce(length(trim(place_name)),0) not between 1 and 512
    or lat is null or lng is null or lat not between -90 and 90 or lng not between -180 and 180 then
    raise exception 'Choose a named place with a valid pin.';
  end if;
  select id into candidate from barkits.venues where shared_meetup_id = target and catalog_key = trim(place_key);
  if candidate is null then
    insert into barkits.venues(shared_meetup_id,catalog_key,name,latitude,longitude)
      values(target,trim(place_key),trim(place_name),lat,lng) returning id into candidate;
    insert into barkits.meetup_candidates(meetup_id,venue_id) values(target,candidate);
  end if;
  return candidate;
end;
$$;

create function barkits.set_shared_vote(target uuid, candidate uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform barkits.lock_shared_planning(target);
  if candidate is null then
    delete from barkits.meetup_votes where meetup_id = target and user_id = barkits.meetup_actor();
  else
    insert into barkits.meetup_votes(meetup_id,user_id,venue_id) values(target,barkits.meetup_actor(),candidate)
      on conflict (meetup_id,user_id) do update set venue_id = excluded.venue_id;
  end if;
end;
$$;

create function barkits.save_shared_estimate(target uuid, candidate uuid, trip_minutes integer, fare numeric) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform barkits.lock_shared_planning(target);
  if not exists(select 1 from barkits.meetup_origins where meetup_id = target and user_id = barkits.meetup_actor()) then
    raise exception 'Save your starting point before estimating this trip.';
  end if;
  if trip_minutes is null or trip_minutes < 0 or (fare is not null and (fare not between 0 and 9999999.99 or fare <> round(fare,2))) then
    raise exception 'Enter whole minutes and an optional fare in pesos.';
  end if;
  insert into barkits.meetup_journeys(meetup_id,user_id,venue_id,minutes,fare_pesos,provenance,source)
    values(target,barkits.meetup_actor(),candidate,trip_minutes,fare,'estimated','Participant estimate')
    on conflict(meetup_id,user_id,venue_id) do update set minutes=excluded.minutes, fare_pesos=excluded.fare_pesos,
      provenance=excluded.provenance, source=excluded.source, calculated_at=now();
end;
$$;

create function barkits.guard_shared_origin() returns trigger language plpgsql security definer set search_path = '' as $$
declare target uuid; state text;
begin
  if tg_op = 'DELETE' then target := old.meetup_id; else target := new.meetup_id; end if;
  if tg_op = 'UPDATE' and (new.meetup_id,new.user_id) is distinct from (old.meetup_id,old.user_id) then
    raise exception 'A starting point belongs to one meetup member.';
  end if;
  select status into state from barkits.meetups where id = target for no key update;
  if state not in ('draft','planning') then raise exception 'Planning has closed for this meetup.'; end if;
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and (old.label,old.latitude,old.longitude,old.mode)
    is distinct from (new.label,new.latitude,new.longitude,new.mode)) then
    delete from barkits.meetup_journeys where meetup_id = target and user_id = old.user_id;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function barkits.guard_shared_origin() from public, barkits_runtime;
create trigger shared_origin_changes before insert or update or delete on barkits.meetup_origins
  for each row execute function barkits.guard_shared_origin();

create function barkits.finalize_shared_venue(target uuid, candidate uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare chosen barkits.meetups%rowtype;
begin
  select * into chosen from barkits.meetups where id=target and owner_id=barkits.meetup_actor() for no key update;
  if not found then raise exception 'Only the organizer can finalize the venue.'; end if;
  if chosen.status='decided' and chosen.venue_id=candidate then return; end if;
  if chosen.status<>'planning' then raise exception 'Planning has closed. Refresh the group.'; end if;
  if not exists(select 1 from barkits.meetup_candidates where meetup_id=target and venue_id=candidate) then
    raise exception 'Choose a venue from this group’s shortlist.';
  end if;
  if exists(select 1 from barkits.meetup_origins o left join barkits.meetup_journeys j
      on (j.meetup_id,j.user_id,j.venue_id)=(o.meetup_id,o.user_id,candidate)
      where o.meetup_id=target and ((o.max_minutes is not null and (j.minutes is null or j.minutes>o.max_minutes))
        or (o.max_fare_pesos is not null and (j.fare_pesos is null or j.fare_pesos>o.max_fare_pesos)))) then
    raise exception 'Each travel limit needs a trip estimate within that limit.';
  end if;
  update barkits.meetups set status='decided',venue_id=candidate where id=target;
end;
$$;

revoke all on function barkits.shortlist_shared_venue(uuid,text,text,double precision,double precision), barkits.set_shared_vote(uuid,uuid),
  barkits.save_shared_estimate(uuid,uuid,integer,numeric), barkits.finalize_shared_venue(uuid,uuid) from public;
grant execute on function barkits.shortlist_shared_venue(uuid,text,text,double precision,double precision), barkits.set_shared_vote(uuid,uuid),
  barkits.finalize_shared_venue(uuid,uuid) to barkits_runtime;
create function barkits.join_shared_meetup(invite_code text, member_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := barkits.meetup_actor();
  code text := upper(regexp_replace(invite_code, '[[:space:]-]+', '', 'g'));
  invitation barkits.meetup_invites%rowtype;
begin
  if actor is null or coalesce(length(trim(member_name)), 0) not between 1 and 80 then
    raise exception 'Enter your display name to join.';
  end if;
  perform 1 from barkits.meetups m where m.id = (
    select i.meetup_id from barkits.meetup_invites i where i.token_digest = encode(sha256(convert_to(code, 'UTF8')), 'hex')
  ) for no key update;
  select * into invitation from barkits.meetup_invites
    where token_digest = encode(sha256(convert_to(code, 'UTF8')), 'hex') for no key update;
  if invitation.redeemed_by = actor then return invitation.meetup_id; end if;
  if invitation.id is null or invitation.expires_at <= now() or invitation.redeemed_at is not null
    or not exists(select 1 from barkits.meetups where id = invitation.meetup_id and status in ('draft','planning')) then
    raise exception 'This code is invalid, expired, or already used. Ask the organizer for a new code.';
  end if;
  insert into barkits.meetup_members(meetup_id, user_id, display_name)
    values (invitation.meetup_id, actor, trim(member_name)) on conflict do nothing;
  if found then
    update barkits.meetup_invites set redeemed_at = now(), redeemed_by = actor where id = invitation.id;
  end if;
  return invitation.meetup_id;
end;
$$;

revoke all on function barkits.join_shared_meetup(text,text) from public;
grant execute on function barkits.join_shared_meetup(text,text) to barkits_runtime;
create function barkits.save_shared_fare_estimate(target uuid, candidate uuid, trip_minutes integer, fare numeric, provider text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if provider is not null and (provider not in ('Angkas','Grab') or fare is null) then
    raise exception 'Choose a supported provider and enter its fare.';
  end if;
  perform barkits.save_shared_estimate(target,candidate,trip_minutes,fare);
  if provider is not null then
    update barkits.meetup_journeys set source='User-entered ' || provider
      where meetup_id=target and venue_id=candidate and user_id=barkits.meetup_actor();
  end if;
end;
$$;
revoke all on function barkits.save_shared_fare_estimate(uuid,uuid,integer,numeric,text) from public;
grant execute on function barkits.save_shared_fare_estimate(uuid,uuid,integer,numeric,text) to barkits_runtime;
