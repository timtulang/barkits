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
select pg_temp.as_user(:'friend');
select public.shortlist_shared_venue(:'meetup','park','Park',14.6,121.0) as park \gset
select pg_temp.check_result(public.shortlist_shared_venue(:'meetup','park','Park',14.6,121.0)=:'park','duplicate nomination');
select public.shortlist_shared_venue(:'meetup','cafe','Cafe',14.5,121.0) as cafe \gset
select public.set_shared_vote(:'meetup',:'park');
select public.set_shared_vote(:'meetup',:'cafe');
select pg_temp.check_result(count(*)=1 and bool_and(venue_id=:'cafe'),'changing a vote must replace it') from public.meetup_votes where meetup_id=:'meetup';
select public.set_shared_vote(:'meetup',null);
select pg_temp.check_result(count(*)=0,'vote withdrawal failed') from public.meetup_votes where meetup_id=:'meetup';
insert into public.meetup_origins(meetup_id,user_id,label,mode,max_fare_pesos,max_minutes) values(:'meetup',:'friend','Makati','Public transport',50,45);
select public.save_shared_estimate(:'meetup',:'park',30,45);
update public.meetup_origins set label='Pasig' where meetup_id=:'meetup' and user_id=:'friend';
select pg_temp.check_result(count(*)=0,'moving an origin must clear the old estimates') from public.meetup_journeys where meetup_id=:'meetup';

create function pg_temp.finalize_error(target uuid,venue uuid) returns text language plpgsql as $$
begin
  perform public.finalize_shared_venue(target,venue);
  return null;
exception when raise_exception then return sqlerrm;
end;
$$;
select pg_temp.check_result(pg_temp.finalize_error(:'meetup',:'park') like 'Only the organizer%', 'non-owner finalization');
select public.save_shared_estimate(:'meetup',:'park',30,null);
select pg_temp.as_user(:'organizer');
select pg_temp.check_result(pg_temp.finalize_error(:'meetup',:'park') like 'Each travel limit%', 'unknown fare passed a hard budget');
select pg_temp.as_user(:'friend');
select public.save_shared_estimate(:'meetup',:'park',46,0);
select pg_temp.as_user(:'organizer');
select pg_temp.check_result(pg_temp.finalize_error(:'meetup',:'park') like 'Each travel limit%', 'excess minutes passed a time limit');
select pg_temp.as_user(:'friend');
select public.save_shared_estimate(:'meetup',:'park',45,0);
select pg_temp.as_user(:'organizer');
select public.finalize_shared_venue(:'meetup',:'park');
select public.finalize_shared_venue(:'meetup',:'park');
select pg_temp.as_user(:'friend');
select pg_temp.check_result(venue_id=:'park' and status='decided','group cannot see final decision') from public.meetups where id=:'meetup';
create function pg_temp.vote_closed(target uuid,candidate uuid) returns boolean language plpgsql as $$
begin
  perform public.set_shared_vote(target,candidate);
  return false;
exception when raise_exception then return sqlerrm like 'Planning has closed%';
end;
$$;
select pg_temp.check_result(pg_temp.vote_closed(:'meetup',:'cafe'),'voting must close after confirmation');
select pg_temp.as_user(:'guest');
select pg_temp.check_result(count(*)=0,'group nominations visible to non-member') from public.venues where id=:'park';
rollback;
