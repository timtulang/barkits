\set ON_ERROR_STOP on
begin;
select encode(sha256(gen_random_uuid()::text::bytea),'hex') as owner_session,
 encode(sha256(gen_random_uuid()::text::bytea),'hex') as other_session,gen_random_uuid() as target \gset
create function pg_temp.check_dashboard(ok boolean,message text) returns void language plpgsql as $$
begin if ok is not true then raise exception '%',message;end if;end;$$;
set local role barkits_runtime;
select barkits.start_google_session(:'owner_session','Dashboard owner',:'owner_session',null);
select barkits.start_google_session(:'other_session','Other account',:'other_session',null);
select id as owner_id from barkits.session_user(:'owner_session') \gset
select barkits.authorize_session(:'owner_session');
select barkits.create_shared_meetup(:'target','First upcoming','Owner',null,null,now());
reset role;
with inserted as (
 insert into barkits.meetups(owner_id,kind,name,status,starts_at)
 select :'owner_id','planned','Future '||n,'planning',now()+n*interval '1 day' from generate_series(1,51)n returning id
) insert into barkits.meetup_members(meetup_id,user_id,display_name) select id,:'owner_id','Owner' from inserted;
set local role barkits_runtime;
select barkits.account_dashboard(:'owner_session',false,0) as first_page \gset
select barkits.account_dashboard(:'owner_session',false,50) as second_page \gset
select pg_temp.check_dashboard(:'first_page'::jsonb->>'total'='52' and jsonb_array_length(:'first_page'::jsonb->'plans')=50,'incorrect bounded page');
select pg_temp.check_dashboard(:'first_page'::jsonb->>'next_offset'='50' and jsonb_array_length(:'second_page'::jsonb->'plans')=2,'incorrect pagination');
select pg_temp.check_dashboard(:'first_page'::jsonb->'plans'->0->>'id'=:'target','upcoming sort incorrect');
select pg_temp.check_dashboard(:'first_page'::jsonb->'plans'->0->>'next_action'='Add your starting point','missing starting-point action');
select pg_temp.check_dashboard(barkits.account_dashboard(:'other_session',false,0)->>'total'='0','another account saw plans');
select barkits.save_own_trip(:'target','Manual origin','Walking',14,121,null,null);
select pg_temp.check_dashboard(barkits.account_dashboard(:'owner_session',false,0)->'plans'->0->>'next_action'='Suggest a destination','missing discovery action');
select barkits.shortlist_shared_venue(:'target','dashboard-place','Meetup venue',14,121) as venue \gset
select pg_temp.check_dashboard(barkits.account_dashboard(:'owner_session',false,0)->'plans'->0->>'next_action'='Vote for a destination','missing vote action');
select barkits.set_shared_vote(:'target',:'venue');
select pg_temp.check_dashboard(barkits.account_dashboard(:'owner_session',false,0)->'plans'->0->>'next_action'='Add your travel estimates','missing estimate action');
select barkits.save_shared_fare_estimate(:'target',:'venue',10,0,null);
select pg_temp.check_dashboard(barkits.account_dashboard(:'owner_session',false,0)->'plans'->0->>'next_action'='Review votes and choose a destination','missing organizer action');
select barkits.finalize_shared_venue(:'target',:'venue');
select pg_temp.check_dashboard(barkits.account_dashboard(:'owner_session',false,0)->'plans'->0->>'next_action' is null,'confirmed plan has stale action');
select barkits.finish_shared_meetup(:'target','completed');
select pg_temp.check_dashboard(barkits.account_dashboard(:'owner_session',true,0)->'plans'->0->>'next_action'='Add a memory (optional)','missing optional memory action');
select pg_temp.check_dashboard(barkits.account_dashboard(:'owner_session',false,0)->>'total'='51','history remains in active list');
select pg_temp.check_dashboard(not has_table_privilege('barkits.meetups','SELECT'),'runtime gained direct dashboard access');
rollback;
