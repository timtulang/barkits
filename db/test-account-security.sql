\set ON_ERROR_STOP on
begin;
select encode(sha256(gen_random_uuid()::text::bytea),'hex') as owner_session,
 encode(sha256(gen_random_uuid()::text::bytea),'hex') as owner_second,
 encode(sha256(gen_random_uuid()::text::bytea),'hex') as member_session,
 gen_random_uuid() as shared,gen_random_uuid() as solo,gen_random_uuid() as other_group,
 gen_random_uuid() as owner_post,gen_random_uuid() as member_post \gset
create function pg_temp.check_security(ok boolean,message text) returns void language plpgsql as $$
begin if ok is not true then raise exception '%',message; end if; end; $$;
create function pg_temp.deletion_rejected(digest text,revision text,choices jsonb,expected text) returns boolean language plpgsql as $$
begin perform barkits.delete_own_account(digest,revision,choices);return false;
exception when others then if sqlstate<>expected then raise;end if;return true;end;$$;
set local role barkits_runtime;
select barkits.start_google_session(:'owner_session','Owner',:'owner_session',null);
select barkits.start_google_session(:'owner_session','Owner',:'owner_second',null);
select barkits.start_google_session(:'member_session','Member',:'member_session',null);
select id as owner_id from barkits.session_user(:'owner_session') \gset
select id as member_id from barkits.session_user(:'member_session') \gset
select pg_temp.check_security((barkits.own_account_security(:'owner_session')->>'session_count')::int=2,'missing sessions');
select barkits.revoke_other_sessions(:'owner_session');
select pg_temp.check_security(not exists(select 1 from barkits.session_user(:'owner_second')),'other session remains');
select pg_temp.check_security(exists(select 1 from barkits.session_user(:'owner_session')),'current session revoked');
select barkits.authorize_session(:'owner_session');
select barkits.create_shared_meetup(:'shared','Shared retained','Owner',null,null,null);
select barkits.create_shared_meetup(:'solo','Solo deleted','Owner',null,null,null);
select barkits.issue_meetup_code(:'shared') as shared_code \gset
select barkits.save_own_trip(:'shared','Private origin','Walking',14,121,null,null);
select barkits.shortlist_shared_venue(:'shared','security-test','A venue',14,121) as venue \gset
select barkits.authorize_session(:'member_session');
select barkits.join_shared_meetup(:'shared_code','Member');
select barkits.create_shared_meetup(:'other_group','Another owner','Member',null,null,null);
select barkits.issue_meetup_code(:'other_group') as other_code \gset
select barkits.authorize_session(:'owner_session');
select barkits.join_shared_meetup(:'other_code','Owner');
select barkits.finalize_shared_venue(:'shared',:'venue');
select barkits.finish_shared_meetup(:'shared','completed');
select barkits.save_shared_recap(:'shared',:'owner_post',0,'Owner recap','Deleted personal text','private');
select barkits.rate_shared_meetup(:'shared',5);
select barkits.authorize_session(:'member_session');
select barkits.save_shared_recap(:'shared',:'member_post',0,'Member recap','Retained other text','group');
select barkits.rate_shared_meetup(:'shared',4);
select barkits.own_account_security(:'owner_session')->>'revision' as review \gset
select jsonb_build_object(:'shared',:'member_id') as choices \gset
select pg_temp.check_security(pg_temp.deletion_rejected(null,:'review',:'choices','28000'),'anonymous deletion allowed');
select pg_temp.check_security(pg_temp.deletion_rejected(:'owner_session','stale',:'choices','P0001'),'stale review allowed');
select pg_temp.check_security(pg_temp.deletion_rejected(:'owner_session',:'review','{}','22023'),'missing successor allowed');
select pg_temp.check_security(pg_temp.deletion_rejected(:'owner_session',:'review',jsonb_build_object(:'shared',:'owner_id'),'22023'),'self successor allowed');
reset role;
update barkits.sessions set authenticated_at=now()-interval '20 minutes' where token_digest=:'owner_session';
set local role barkits_runtime;
select pg_temp.check_security(pg_temp.deletion_rejected(:'owner_session',:'review',:'choices','P0001'),'old login allowed deletion');
reset role;
update barkits.sessions set authenticated_at=now() where token_digest=:'owner_session';
set local role barkits_runtime;
select barkits.delete_own_account(:'owner_session',:'review',:'choices');
select pg_temp.check_security(pg_temp.deletion_rejected(:'owner_session',:'review',:'choices','28000'),'deleted session authorized');
reset role;
select pg_temp.check_security(not exists(select 1 from barkits.users where id=:'owner_id'),'account retained');
select pg_temp.check_security(not exists(select 1 from barkits.sessions where user_id=:'owner_id'),'sessions retained');
select pg_temp.check_security(not exists(select 1 from barkits.external_identities where user_id=:'owner_id'),'identity retained');
select pg_temp.check_security(not exists(select 1 from barkits.meetups where id=:'solo'),'solo meetup retained');
select pg_temp.check_security((select owner_id=:'member_id' from barkits.meetups where id=:'shared'),'shared owner not transferred');
select pg_temp.check_security(not exists(select 1 from barkits.meetup_members where user_id=:'owner_id'),'membership retained');
select pg_temp.check_security(not exists(select 1 from barkits.meetup_origins where user_id=:'owner_id'),'closed origin retained');
select pg_temp.check_security(not exists(select 1 from barkits.meetup_invites where redeemed_by=:'owner_id'),'redeemer retained');
select pg_temp.check_security(not exists(select 1 from barkits.meetup_recaps where id=:'owner_post'),'personal recap retained');
select pg_temp.check_security(exists(select 1 from barkits.meetup_recaps where id=:'member_post'),'another recap deleted');
select pg_temp.check_security(exists(select 1 from barkits.meetup_ratings where user_id=:'member_id' and stars=4),'another rating deleted');
rollback;
