\set ON_ERROR_STOP on
begin;
select gen_random_uuid() as meetup,
  encode(sha256(gen_random_uuid()::text::bytea),'hex') as first_session,
  encode(sha256(gen_random_uuid()::text::bytea),'hex') as second_session,
  encode(sha256(gen_random_uuid()::text::bytea),'hex') as other_session,
  encode(sha256(gen_random_uuid()::text::bytea),'hex') as expired_session \gset

create function pg_temp.check_result(ok boolean, message text) returns void language plpgsql as $$
begin
  if ok is not true then raise exception '%', message; end if;
end;
$$;

create function pg_temp.rejected_profile(session_digest text, profile_name text, expected_code text)
returns boolean language plpgsql as $$
begin
  perform barkits.save_own_profile(session_digest, profile_name);
  return false;
exception when others then
  if sqlstate <> expected_code then raise; end if;
  return true;
end;
$$;

set local role barkits_runtime;
select barkits.start_google_session(:'first_session', 'Original name', :'first_session', null);
select barkits.start_google_session(:'first_session', 'Ignored Google rename', :'second_session', null);
select barkits.start_google_session(:'other_session', 'Other account', :'other_session', null);
select barkits.start_google_session(:'other_session', 'Other account', :'expired_session', null);
select id as actor from barkits.session_user(:'first_session') \gset
select barkits.authorize_session(:'first_session');
select barkits.create_shared_meetup(:'meetup', 'Profile check', 'Meetup-specific name', null, null, null);

select pg_temp.check_result(id = :'actor' and display_name = 'María 🥭', 'profile did not save')
  from barkits.save_own_profile(:'first_session', '  María 🥭  ');
select pg_temp.check_result(id = :'actor' and display_name = 'María 🥭', 'second session did not see saved profile')
  from barkits.session_user(:'second_session');
select pg_temp.check_result(display_name = 'Other account', 'another account was changed')
  from barkits.session_user(:'other_session');
select pg_temp.check_result(barkits.get_shared_meetup(:'meetup')->'summary'->>'owner_id' = :'actor'
  and barkits.get_shared_meetup(:'meetup')->'roster'->0->>'display_name' = 'Meetup-specific name',
  'profile edit changed meetup ownership or member name');
select pg_temp.check_result(count(*) = 1, 'duplicate save did not return one account')
  from barkits.save_own_profile(:'first_session', 'María 🥭');
select pg_temp.check_result(display_name = repeat('🥭', 160), 'Unicode limit differs from character limit')
  from barkits.save_own_profile(:'first_session', repeat('🥭', 160));
select pg_temp.check_result(pg_temp.rejected_profile(:'first_session', v, '22023'), 'invalid profile was accepted')
  from unnest(array[null, '', '   ', repeat('a', 161), repeat('🥭', 161), E'A\nB', E'A\tB', E'A\x7fB']) v;
select pg_temp.check_result(pg_temp.rejected_profile(null, 'Name', '28000'), 'missing session was accepted');
select barkits.end_session(:'second_session');
select pg_temp.check_result(pg_temp.rejected_profile(:'second_session', 'Name', '28000'), 'revoked session was accepted');
reset role;
update barkits.sessions set expires_at = now() - interval '1 minute' where token_digest = :'expired_session';
set local role barkits_runtime;
select pg_temp.check_result(pg_temp.rejected_profile(:'expired_session', 'Name', '28000'), 'expired session was accepted');
select pg_temp.check_result(not has_table_privilege('barkits.users', 'SELECT, UPDATE')
  and not has_schema_privilege('barkits_meta', 'USAGE'), 'runtime gained direct privileges');
select pg_temp.check_result(not exists(select 1 from information_schema.routine_privileges
  where routine_schema = 'barkits' and routine_name = 'save_own_profile' and grantee = 'PUBLIC'),
  'public can execute the profile mutation');
reset role;
select pg_temp.check_result((select count(*) from barkits.meetup_members where meetup_id = :'meetup') = 1,
  'profile editing changed membership');
rollback;
