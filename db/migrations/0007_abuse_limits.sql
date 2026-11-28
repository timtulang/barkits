create table barkits.rate_limit_buckets (
  subject text not null,
  bucket text not null,
  hits integer not null check (hits > 0),
  expires_at timestamptz not null,
  primary key (subject, bucket)
);
create index rate_limit_expiry on barkits.rate_limit_buckets(expires_at);
revoke all on barkits.rate_limit_buckets from public, barkits_runtime;

create function barkits.consume_rate_bucket(subject_key text, bucket_key text, maximum integer, seconds integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  instant timestamptz := clock_timestamp();
  deadline timestamptz := date_bin(make_interval(secs => seconds), instant, '1970-01-01'::timestamptz)
    + make_interval(secs => seconds);
  used integer;
begin
  delete from barkits.rate_limit_buckets where (subject, bucket) in (
    select subject, bucket from barkits.rate_limit_buckets
    where expires_at < instant - interval '1 day' order by expires_at limit 100
    for update skip locked
  );
  insert into barkits.rate_limit_buckets as counters(subject, bucket, hits, expires_at)
    values(subject_key, bucket_key, 1, deadline)
  on conflict(subject, bucket) do update set
    hits = case when counters.expires_at <= instant then 1 else least(counters.hits + 1, maximum + 1) end,
    expires_at = case when counters.expires_at <= instant then deadline else counters.expires_at end
  returning hits, expires_at into used, deadline;
  return case when used <= maximum then 0 else greatest(1, ceil(extract(epoch from deadline - instant))::integer) end;
end;
$$;
revoke all on function barkits.consume_rate_bucket(text,text,integer,integer) from public, barkits_runtime;

create function barkits.consume_ip_quota(ip_digest text, action text) returns integer
language plpgsql security definer set search_path = '' as $$
declare maximum integer;
begin
  if ip_digest is null or ip_digest !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid connection identifier.' using errcode = '22023';
  end if;
  maximum := case action when 'auth-start' then 10 when 'auth-callback' then 30 when 'native-claim' then 20 end;
  if maximum is null then raise exception 'Invalid authentication action.' using errcode = '22023'; end if;
  return barkits.consume_rate_bucket('ip:' || ip_digest, action, maximum, 600);
end;
$$;

create function barkits.consume_account_quota(digest text, action text) returns integer
language plpgsql security definer set search_path = '' as $$
declare actor uuid; retry integer; maximum integer; seconds integer;
begin
  select id into actor from barkits.session_user(digest);
  if actor is null then raise exception 'Sign in again to continue.' using errcode = '28000'; end if;
  if action is null or action not in ('read','write','create','join','invite') then
    raise exception 'Invalid account action.' using errcode = '22023';
  end if;
  retry := barkits.consume_rate_bucket('user:' || actor, case when action = 'read' then 'read' else 'write' end,
    case when action = 'read' then 120 else 60 end, 60);
  if retry > 0 then return retry; end if;
  maximum := case action when 'create' then 10 when 'join' then 10 when 'invite' then 20 end;
  seconds := case action when 'join' then 600 else 3600 end;
  if maximum is null then return 0; end if;
  return barkits.consume_rate_bucket('user:' || actor, action, maximum, seconds);
end;
$$;

revoke all on function barkits.consume_ip_quota(text,text), barkits.consume_account_quota(text,text) from public;
grant execute on function barkits.consume_ip_quota(text,text), barkits.consume_account_quota(text,text) to barkits_runtime;
