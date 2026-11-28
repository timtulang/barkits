\set ON_ERROR_STOP on
begin;

create function pg_temp.check_result(ok boolean, message text) returns void language plpgsql as $$
begin
  if ok is not true then raise exception '%', message; end if;
end;
$$;

set local role barkits_runtime;
select pg_temp.check_result(not has_table_privilege(current_user,'barkits.rate_limit_buckets','SELECT,INSERT,UPDATE,DELETE'),
  'runtime must not access counters directly');
select pg_temp.check_result(not has_function_privilege(current_user,
  'barkits.consume_rate_bucket(text,text,integer,integer)','EXECUTE'), 'runtime must not choose limits');

select barkits.start_google_session('abuse-test-first','First',repeat('a',64),null);
select barkits.start_google_session('abuse-test-first','First',repeat('b',64),null);
select barkits.start_google_session('abuse-test-second','Second',repeat('c',64),null);

do $$
declare i integer; retry integer;
begin
  for i in 1..10 loop
    perform pg_temp.check_result(barkits.consume_ip_quota(repeat('d',64),'auth-start') = 0, 'early IP throttle');
  end loop;
  retry := barkits.consume_ip_quota(repeat('d',64),'auth-start');
  perform pg_temp.check_result(retry between 1 and 600, 'missing bounded IP retry');
  perform pg_temp.check_result(barkits.consume_ip_quota(repeat('e',64),'auth-start') = 0, 'IP isolation');
  perform pg_temp.check_result(barkits.consume_ip_quota(repeat('d',64),'auth-callback') = 0, 'callback has its own budget');
  for i in 1..120 loop
    perform pg_temp.check_result(barkits.consume_ip_quota(repeat('2',64),'api') = 0, 'early API throttle');
  end loop;
  perform pg_temp.check_result(barkits.consume_ip_quota(repeat('2',64),'api') > 0, 'missing general API budget');

  for i in 1..10 loop
    perform pg_temp.check_result(barkits.consume_account_quota(repeat('a',64),'join') = 0, 'early join throttle');
    begin
      perform barkits.authorize_session(repeat('a',64));
      perform barkits.join_shared_meetup('not-a-valid-code','Friend');
      raise exception 'Invalid invite unexpectedly accepted.';
    exception when raise_exception then
      if sqlerrm <> 'This code is invalid, expired, or already used. Ask the organizer for a new code.' then raise; end if;
    end;
  end loop;
  perform pg_temp.check_result(barkits.consume_account_quota(repeat('b',64),'join') > 0,
    'failed joins or changing sessions bypassed account quota');
  perform pg_temp.check_result(barkits.consume_account_quota(repeat('c',64),'join') = 0, 'account isolation');

  for i in 1..120 loop
    perform pg_temp.check_result(barkits.consume_account_quota(repeat('a',64),'read') = 0, 'early read throttle');
  end loop;
  perform pg_temp.check_result(barkits.consume_account_quota(repeat('b',64),'read') > 0, 'missing read throttle');
  for i in 1..49 loop
    perform pg_temp.check_result(barkits.consume_account_quota(repeat('a',64),'write') = 0, 'early write throttle');
  end loop;
  perform pg_temp.check_result(barkits.consume_account_quota(repeat('b',64),'write') > 0, 'missing shared write budget');
  begin
    perform barkits.consume_account_quota(repeat('f',64),'create');
    raise exception 'Invalid session accepted.';
  exception when invalid_authorization_specification then null;
  end;
end;
$$;

reset role;
update barkits.rate_limit_buckets set expires_at = now() - interval '1 second'
  where subject = 'ip:' || repeat('d',64) and bucket = 'auth-start';
insert into barkits.rate_limit_buckets values ('ip:' || repeat('f',64),'auth-start',1,now() - interval '2 days');
set local role barkits_runtime;
select pg_temp.check_result(barkits.consume_ip_quota(repeat('d',64),'auth-start') = 0, 'expired window did not reset');
reset role;
select pg_temp.check_result(not exists(select from barkits.rate_limit_buckets where expires_at < now() - interval '1 day'),
  'expired anonymous counters retained');
rollback;
