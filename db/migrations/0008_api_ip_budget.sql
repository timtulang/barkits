create or replace function barkits.consume_ip_quota(ip_digest text, action text) returns integer
language plpgsql security definer set search_path = '' as $$
declare maximum integer; seconds integer;
begin
  if ip_digest is null or ip_digest !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid connection identifier.' using errcode = '22023';
  end if;
  maximum := case action when 'api' then 120 when 'auth-start' then 10 when 'auth-callback' then 30 when 'native-claim' then 20 end;
  seconds := case action when 'api' then 60 else 600 end;
  if maximum is null then raise exception 'Invalid request action.' using errcode = '22023'; end if;
  return barkits.consume_rate_bucket('ip:' || ip_digest, action, maximum, seconds);
end;
$$;
