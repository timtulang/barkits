-- run with psql against a local migrated supabase database
\set ON_ERROR_STOP on
begin;
select gen_random_uuid() as organizer, gen_random_uuid() as friend, gen_random_uuid() as guest,
  gen_random_uuid() as meetup \gset
insert into auth.users(id) values (:'organizer'), (:'friend'), (:'guest');

create function pg_temp.check_result(ok boolean, message text) returns void language plpgsql as $$
begin
  if ok is not true then raise exception '%', message; end if;
end;
$$;

create function pg_temp.as_user(actor uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', actor::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', actor, 'role', 'authenticated')::text, true);
end;
$$;

create function pg_temp.code_rejected(code text) returns boolean language plpgsql as $$
begin
  perform public.join_shared_meetup(code, 'Friend');
  return false;
exception when raise_exception then
  if sqlerrm <> 'This code is invalid, expired, or already used. Ask the organizer for a new code.' then raise; end if;
  return true;
end;
$$;

set local role authenticated;
select pg_temp.as_user(:'organizer');
select public.create_shared_meetup(:'meetup', 'Picnic', 'Organizer', 'Park', '', null);
select public.create_shared_meetup(:'meetup', 'Picnic', 'Organizer', 'Park', '', null);
select pg_temp.check_result(count(*) = 1, 'creation retry duplicated the roster') from public.meetup_members where meetup_id = :'meetup';
select public.issue_meetup_code(:'meetup') as old_code \gset
select public.issue_meetup_code(:'meetup') as expired_code \gset
reset role;
update public.meetup_invites set expires_at = now() - interval '1 minute' where meetup_id = :'meetup';
set local role authenticated;
select pg_temp.as_user(:'friend');
select pg_temp.check_result(pg_temp.code_rejected(:'expired_code'), 'expired invite accepted');
select pg_temp.check_result(pg_temp.code_rejected(:'old_code'), 'replaced invite accepted');
select pg_temp.as_user(:'organizer');
select public.issue_meetup_code(:'meetup') as fresh_code \gset
select pg_temp.as_user(:'friend');
select pg_temp.check_result(public.join_shared_meetup(lower(:'fresh_code'), 'Friend') = :'meetup', 'join failed');
select pg_temp.check_result(public.join_shared_meetup(:'fresh_code', 'Friend') = :'meetup', 'join retry failed');
select pg_temp.check_result(count(*) = 2, 'wrong roster after retry') from public.meetup_members where meetup_id = :'meetup';
select pg_temp.as_user(:'guest');
select pg_temp.check_result(pg_temp.code_rejected(:'fresh_code'), 'used invite accepted another member');
select pg_temp.check_result(count(*) = 0, 'meetup visible to non-member') from public.meetups where id = :'meetup';
rollback;
