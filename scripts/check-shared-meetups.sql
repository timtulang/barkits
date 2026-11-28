-- run with psql against a local migrated barkits database
\set ON_ERROR_STOP on
begin;
select gen_random_uuid() as meetup,
  encode(sha256(gen_random_uuid()::text::bytea),'hex') as organizer,
  encode(sha256(gen_random_uuid()::text::bytea),'hex') as friend,
  encode(sha256(gen_random_uuid()::text::bytea),'hex') as guest,
  encode(sha256(gen_random_uuid()::text::bytea),'hex') as handoff,
  encode(sha256(gen_random_uuid()::text::bytea),'hex') as proof,
  encode(sha256(gen_random_uuid()::text::bytea),'hex') as expired_session,
  encode(sha256(gen_random_uuid()::text::bytea),'hex') as native_session \gset

create function pg_temp.check_result(ok boolean, message text) returns void language plpgsql as $$
begin
  if ok is not true then raise exception '%', message; end if;
end;
$$;

create function pg_temp.code_rejected(code text) returns boolean language plpgsql as $$
begin
  perform barkits.join_shared_meetup(code, 'Friend');
  return false;
exception when raise_exception then
  if sqlerrm <> 'This code is invalid, expired, or already used. Ask the organizer for a new code.' then raise; end if;
  return true;
end;
$$;

set local role barkits_runtime;
select barkits.start_google_session(:'organizer', 'Organizer', :'organizer', null);
select barkits.start_google_session(:'friend', 'Friend', :'friend', null);
select barkits.start_google_session(:'guest', 'Guest', :'guest', null);
select barkits.start_google_session(:'organizer', 'Organizer', :'handoff', :'proof');
select pg_temp.check_result(not barkits.claim_native_session(:'handoff', :'guest', :'native_session'), 'wrong app could claim the handoff');
select pg_temp.check_result(barkits.claim_native_session(:'handoff', :'proof', :'native_session'), 'native sign-in failed');
select pg_temp.check_result(not barkits.claim_native_session(:'handoff', :'proof', :'native_session'), 'native code was reused');
select pg_temp.check_result(n.id = o.id, 'one Google subject produced different accounts')
  from barkits.session_user(:'native_session') n cross join barkits.session_user(:'organizer') o;
select barkits.end_session(:'native_session');
select pg_temp.check_result(not exists(select from barkits.session_user(:'native_session')), 'signed-out session still worked');
select barkits.start_google_session(:'organizer', 'Organizer', :'expired_session', null);
reset role;
update barkits.sessions set expires_at = now() - interval '1 minute' where token_digest = :'expired_session';
set local role barkits_runtime;
select pg_temp.check_result(not exists(select from barkits.session_user(:'expired_session')), 'expired session still worked');
select pg_temp.check_result(not has_table_privilege('barkits.sessions', 'SELECT')
  and not has_table_privilege('barkits.meetups', 'SELECT'), 'runtime can read private tables directly');
select barkits.authorize_session(:'organizer');
select barkits.create_shared_meetup(:'meetup', 'Picnic', 'Organizer', 'Park', '', null);
select barkits.create_shared_meetup(:'meetup', 'Picnic', 'Organizer', 'Park', '', null);
select pg_temp.check_result(jsonb_array_length(barkits.get_shared_meetup(:'meetup')->'roster') = 1, 'creation retry duplicated the roster');
select barkits.issue_meetup_code(:'meetup') as old_code \gset
select barkits.issue_meetup_code(:'meetup') as expired_code \gset
reset role;
update barkits.meetup_invites set expires_at = now() - interval '1 minute' where meetup_id = :'meetup';
set local role barkits_runtime;
select barkits.authorize_session(:'friend');
select pg_temp.check_result(pg_temp.code_rejected(:'expired_code'), 'expired invite accepted');
select pg_temp.check_result(pg_temp.code_rejected(:'old_code'), 'replaced invite accepted');
select barkits.authorize_session(:'organizer');
select barkits.issue_meetup_code(:'meetup') as fresh_code \gset
select barkits.authorize_session(:'friend');
select pg_temp.check_result(barkits.join_shared_meetup(lower(:'fresh_code'), 'Friend') = :'meetup', 'join failed');
select pg_temp.check_result(barkits.join_shared_meetup(:'fresh_code', 'Friend') = :'meetup', 'join retry failed');
select pg_temp.check_result(jsonb_array_length(barkits.get_shared_meetup(:'meetup')->'roster') = 2, 'wrong roster after retry');
select barkits.authorize_session(:'guest');
select pg_temp.check_result(pg_temp.code_rejected(:'fresh_code'), 'used invite accepted another member');
select pg_temp.check_result(barkits.get_shared_meetup(:'meetup') is null and barkits.list_shared_meetups() = '[]'::jsonb, 'meetup visible to non-member');
select barkits.authorize_session(:'friend');
select barkits.shortlist_shared_venue(:'meetup','park','Park',14.6,121.0) as park \gset
select pg_temp.check_result(barkits.shortlist_shared_venue(:'meetup','park','Park',14.6,121.0)=:'park','duplicate nomination');
select barkits.shortlist_shared_venue(:'meetup','cafe','Cafe',14.5,121.0) as cafe \gset
select barkits.set_shared_vote(:'meetup',:'park');
select barkits.set_shared_vote(:'meetup',:'cafe');
select pg_temp.check_result(count(*) = 1 and bool_and(c->>'venue_id' = :'cafe'), 'changing a vote must replace it')
  from jsonb_array_elements(barkits.get_shared_meetup(:'meetup')->'summary'->'ballot') c, jsonb_array_elements(c->'votes');
select barkits.set_shared_vote(:'meetup',null);
select pg_temp.check_result(count(*) = 0, 'vote withdrawal failed')
  from jsonb_array_elements(barkits.get_shared_meetup(:'meetup')->'summary'->'ballot') c, jsonb_array_elements(c->'votes');
select barkits.save_own_trip(:'meetup','Makati','Public transport',null,null,50,45);
select barkits.save_shared_fare_estimate(:'meetup',:'park',30,45,'Angkas');
select pg_temp.check_result(count(*) = 1 and bool_and(e->>'source' = 'User-entered Angkas' and (e->>'fare_pesos')::numeric = 45 and e->>'calculated_at' is not null),
  'provider fare lost its source or time')
  from jsonb_array_elements(barkits.get_shared_meetup(:'meetup')->'summary'->'ballot') c, jsonb_array_elements(c->'estimates') e
  where c->>'venue_id' = :'park';
select barkits.save_shared_fare_estimate(:'meetup',:'park',30,42,null);
select pg_temp.check_result(count(*) = 1 and bool_and(e->>'source' = 'Participant estimate'), 'manual edit retained a stale provider')
  from jsonb_array_elements(barkits.get_shared_meetup(:'meetup')->'summary'->'ballot') c, jsonb_array_elements(c->'estimates') e
  where c->>'venue_id' = :'park';
select barkits.save_own_trip(:'meetup','Pasig','Public transport',null,null,50,45);
select pg_temp.check_result(count(*) = 0, 'moving an origin must clear the old estimates')
  from jsonb_array_elements(barkits.get_shared_meetup(:'meetup')->'summary'->'ballot') c, jsonb_array_elements(c->'estimates');

create function pg_temp.finalize_error(target uuid,venue uuid) returns text language plpgsql as $$
begin
  perform barkits.finalize_shared_venue(target,venue);
  return null;
exception when raise_exception then return sqlerrm;
end;
$$;
select pg_temp.check_result(pg_temp.finalize_error(:'meetup',:'park') like 'Only the organizer%', 'non-owner finalization');
select barkits.save_shared_fare_estimate(:'meetup',:'park',30,null,null);
select barkits.authorize_session(:'organizer');
select pg_temp.check_result(pg_temp.finalize_error(:'meetup',:'park') like 'Each travel limit%', 'unknown fare passed a hard budget');
select barkits.authorize_session(:'friend');
select barkits.save_shared_fare_estimate(:'meetup',:'park',46,0,null);
select barkits.authorize_session(:'organizer');
select pg_temp.check_result(pg_temp.finalize_error(:'meetup',:'park') like 'Each travel limit%', 'excess minutes passed a time limit');
select barkits.authorize_session(:'friend');
select barkits.save_shared_fare_estimate(:'meetup',:'park',45,0,null);
select barkits.authorize_session(:'organizer');
select barkits.finalize_shared_venue(:'meetup',:'park');
select barkits.finalize_shared_venue(:'meetup',:'park');
select barkits.authorize_session(:'friend');
select pg_temp.check_result(barkits.get_shared_meetup(:'meetup')->'summary'->>'status' = 'decided'
  and barkits.get_shared_meetup(:'meetup')->'summary'->'chosen'->>'name' = 'Park', 'group cannot see final decision');
create function pg_temp.vote_closed(target uuid,candidate uuid) returns boolean language plpgsql as $$
begin
  perform barkits.set_shared_vote(target,candidate);
  return false;
exception when raise_exception then return sqlerrm like 'Planning has closed%';
end;
$$;
select pg_temp.check_result(pg_temp.vote_closed(:'meetup',:'cafe'),'voting must close after confirmation');
select barkits.authorize_session(:'guest');
select pg_temp.check_result(barkits.get_shared_meetup(:'meetup') is null, 'group nominations visible to non-member');
select barkits.authorize_session(:'organizer');
select barkits.finish_shared_meetup(:'meetup','completed');
select gen_random_uuid() as post \gset
select barkits.save_shared_recap(:'meetup',:'post',0,'Dinner','Kita-kits ulit!','private');
select barkits.authorize_session(:'friend');
select pg_temp.check_result(barkits.get_shared_meetup(:'meetup')->'memories'->'recaps' = '[]'::jsonb, 'private draft visible to friend');
select barkits.rate_shared_meetup(:'meetup',4);
select barkits.rate_shared_meetup(:'meetup',5);
select barkits.authorize_session(:'organizer');
select barkits.save_shared_recap(:'meetup',:'post',1,'Dinner','Kita-kits ulit!','group');
select barkits.authorize_session(:'friend');
select pg_temp.check_result(jsonb_array_length(barkits.get_shared_meetup(:'meetup')->'memories'->'recaps') = 1, 'published recap missing');
select pg_temp.check_result(count(*) = 1 and avg((r->>'stars')::int) = 5, 'rating replacement failed')
  from jsonb_array_elements(barkits.get_shared_meetup(:'meetup')->'memories'->'ratings') r;
select barkits.authorize_session(:'guest');
select pg_temp.check_result(barkits.get_shared_meetup(:'meetup') is null, 'group recap visible outside the meetup');
select barkits.authorize_session(:'organizer');
select barkits.finish_shared_meetup(:'meetup','archived');
select barkits.save_shared_recap(:'meetup',:'post',2,'Dinner','Kita-kits ulit!','private');
select barkits.save_shared_recap(:'meetup',:'post',3,null,null,'delete');
select barkits.authorize_session(:'friend');
select barkits.rate_shared_meetup(:'meetup',null);
select pg_temp.check_result(barkits.get_shared_meetup(:'meetup')->'memories'->'ratings' = '[]'::jsonb, 'removed rating counted');
rollback;
