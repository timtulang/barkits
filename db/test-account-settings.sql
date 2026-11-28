\set ON_ERROR_STOP on
begin;
select encode(sha256(gen_random_uuid()::text::bytea),'hex') as first_session,
  encode(sha256(gen_random_uuid()::text::bytea),'hex') as second_session,
  encode(sha256(gen_random_uuid()::text::bytea),'hex') as other_session \gset
create function pg_temp.check_account(ok boolean, message text) returns void language plpgsql as $$
begin if ok is not true then raise exception '%',message; end if; end; $$;
create function pg_temp.settings_rejected(digest text, revision integer, value jsonb, expected text) returns boolean language plpgsql as $$
begin perform barkits.save_account_settings(digest,revision,value); return false;
exception when others then if sqlstate<>expected then raise; end if; return true; end; $$;
set local role barkits_runtime;
select barkits.start_google_session(:'first_session','Settings owner',:'first_session',null);
select barkits.start_google_session(:'first_session','Ignored',:'second_session',null);
select barkits.start_google_session(:'other_session','Other account',:'other_session',null);
select barkits.own_account_settings(:'first_session') as initial \gset
select pg_temp.check_account(:'initial'::jsonb->>'revision'='0' and :'initial'::jsonb->>'recap_audience'='private','unsafe defaults');
select :'initial'::jsonb || '{"username":"kits_test","biography":"Hello 🥭","avatar":"coffee","mode":"Walking","budget":50.25,"max_minutes":30,"category":"Park","reminders":false}'::jsonb as draft \gset
select barkits.save_account_settings(:'first_session',0,:'draft') as saved \gset
select pg_temp.check_account(:'saved'::jsonb->>'revision'='1','settings not versioned');
select pg_temp.check_account(barkits.own_account_settings(:'second_session')=:'saved'::jsonb,'second session missed settings');
select pg_temp.check_account(barkits.own_account_settings(:'other_session')=:'initial'::jsonb,'settings leaked to other account');
select pg_temp.check_account(barkits.save_account_settings(:'first_session',0,:'draft')=:'saved'::jsonb,'duplicate save changed revision');
select pg_temp.check_account(pg_temp.settings_rejected(:'second_session',0,:'draft'::jsonb||'{"biography":"stale"}', 'P0001'),'stale edit overwrote settings');
select pg_temp.check_account(pg_temp.settings_rejected(:'other_session',0,:'draft','P0001'),'duplicate username accepted');
select pg_temp.check_account(pg_temp.settings_rejected(:'first_session',1,:'saved'::jsonb||v,'22023'),'invalid settings accepted')
  from unnest(array['{"username":"INVALID"}','{"budget":1.234}','{"max_minutes":1.5}','{"user_id":"attacker"}','{"biography":null}','{"reminders":"false"}','{"revision":2}']::jsonb[]) v;
select pg_temp.check_account(pg_temp.settings_rejected(null,0,:'draft','28000'),'anonymous settings write accepted');
select pg_temp.check_account(not has_table_privilege('barkits.account_settings','SELECT,UPDATE'),'runtime gained table access');
select barkits.end_session(:'second_session');
select pg_temp.check_account(pg_temp.settings_rejected(:'second_session',0,:'draft','28000'),'revoked session accepted');
rollback;
