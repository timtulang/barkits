alter table barkits.sessions add column authenticated_at timestamptz;
alter table barkits.sessions alter column authenticated_at set default now();

create function barkits.own_account_security(digest text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid; owned jsonb; memberships jsonb;
begin
  select u.id into actor from barkits.session_user(digest) u;
  if actor is null then raise exception 'Sign in again to continue.' using errcode='28000'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'name',m.name,'members',
    (select coalesce(jsonb_agg(jsonb_build_object('id',mm.user_id,'name',coalesce(mm.display_name,u.display_name,'Member'))
      order by mm.user_id),'[]'::jsonb) from barkits.meetup_members mm join barkits.users u on u.id=mm.user_id
      where mm.meetup_id=m.id and mm.user_id<>actor)) order by m.id),'[]'::jsonb)
    into owned from barkits.meetups m where m.owner_id=actor;
  select coalesce(jsonb_agg(meetup_id order by meetup_id),'[]'::jsonb) into memberships
    from barkits.meetup_members where user_id=actor;
  return jsonb_build_object('owned',owned,'meetup_count',jsonb_array_length(memberships),
    'revision',encode(sha256(convert_to((owned||memberships)::text,'UTF8')),'hex'),
    'session_count',(select count(*) from barkits.sessions where user_id=actor and expires_at>now()),
    'recent_login',coalesce((select authenticated_at>=now()-interval '15 minutes' from barkits.sessions where token_digest=digest),false),
    'expires_at',(select expires_at from barkits.sessions where token_digest=digest));
end;
$$;

create function barkits.revoke_other_sessions(digest text) returns void
language plpgsql security definer set search_path = '' as $$
declare actor uuid;
begin
  select u.id into actor from barkits.session_user(digest) u;
  if actor is null then raise exception 'Sign in again to continue.' using errcode='28000'; end if;
  perform 1 from barkits.users where id=actor for update;
  delete from barkits.sessions where user_id=actor and token_digest<>digest;
  delete from barkits.native_sign_ins where user_id=actor;
end;
$$;

create function barkits.delete_own_account(digest text, expected_revision text, successors jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare actor uuid; snapshot jsonb; entry jsonb; successor uuid; needed integer := 0;
begin
  select u.id into actor from barkits.session_user(digest) u;
  if actor is null then raise exception 'Sign in again to continue.' using errcode='28000'; end if;
  if not coalesce((select authenticated_at>=now()-interval '15 minutes' from barkits.sessions where token_digest=digest),false) then
    raise exception 'Sign in with Google again before deleting your account.';
  end if;
  perform 1 from barkits.users where id=actor for update;
  perform 1 from barkits.meetups where id in (select meetup_id from barkits.meetup_members where user_id=actor)
    order by id for update;
  perform 1 from barkits.meetup_members where meetup_id in
    (select id from barkits.meetups where owner_id=actor) order by meetup_id,user_id for update;
  snapshot := barkits.own_account_security(digest);
  if snapshot->>'revision' is distinct from expected_revision then
    raise exception 'Your meetup memberships changed. Reload the deletion review.';
  end if;
  if jsonb_typeof(successors) is distinct from 'object' then
    raise exception 'Choose the next organizer for each shared meetup.' using errcode='22023';
  end if;
  for entry in select value from jsonb_array_elements(snapshot->'owned') loop
    if jsonb_array_length(entry->'members')>0 then
      needed := needed+1;
      successor := (successors->>(entry->>'id'))::uuid;
      if successor is null or not exists(select 1 from barkits.meetup_members
        where meetup_id=(entry->>'id')::uuid and user_id=successor and user_id<>actor) then
        raise exception 'Choose a current member as the next organizer.' using errcode='22023';
      end if;
      update barkits.meetups set owner_id=successor where id=(entry->>'id')::uuid and owner_id=actor;
      delete from barkits.meetup_invites where meetup_id=(entry->>'id')::uuid and redeemed_at is null;
    end if;
  end loop;
  if (select count(*) from jsonb_object_keys(successors))<>needed then
    raise exception 'Review the organizer choices again.' using errcode='22023';
  end if;
  delete from barkits.meetups where owner_id=actor;
  update barkits.meetup_invites set redeemed_by=null where redeemed_by=actor;
  delete from barkits.rate_limit_buckets where subject='user:'||actor;
  delete from barkits.users where id=actor;
end;
$$;

create or replace function barkits.guard_shared_origin() returns trigger language plpgsql security definer set search_path = '' as $$
declare target uuid; state text;
begin
  if tg_op='DELETE' then target:=old.meetup_id; else target:=new.meetup_id; end if;
  if tg_op='UPDATE' and (new.meetup_id,new.user_id) is distinct from (old.meetup_id,old.user_id) then
    raise exception 'A starting point belongs to one meetup member.';
  end if;
  select status into state from barkits.meetups where id=target for no key update;
  if state not in ('draft','planning') and not
    (tg_op='DELETE' and (not exists(select 1 from barkits.meetups where id=target)
      or not exists(select 1 from barkits.users where id=old.user_id))) then
    raise exception 'Planning has closed for this meetup.';
  end if;
  if tg_op='DELETE' or (tg_op='UPDATE' and (old.label,old.latitude,old.longitude,old.mode)
    is distinct from (new.label,new.latitude,new.longitude,new.mode)) then
    delete from barkits.meetup_journeys where meetup_id=target and user_id=old.user_id;
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function barkits.own_account_security(text),barkits.revoke_other_sessions(text),
  barkits.delete_own_account(text,text,jsonb) from public;
grant execute on function barkits.own_account_security(text),barkits.revoke_other_sessions(text),
  barkits.delete_own_account(text,text,jsonb) to barkits_runtime;
