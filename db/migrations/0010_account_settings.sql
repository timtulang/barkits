create table barkits.account_settings (
  user_id uuid primary key references barkits.users on delete cascade,
  username text unique check (username ~ '^[a-z][a-z0-9_]{2,23}$'),
  biography text not null default '' check (length(biography) <= 500 and biography !~ '[[:cntrl:]]'),
  avatar text not null default 'map-pin' check (avatar in ('map-pin','coffee','sun','smile','heart','user')),
  mode text check (mode in ('Public transport','Private car','Motorcycle taxi','Ride-hailing car','Walking','Mixed commute')),
  budget numeric(9,2) check (budget between 0 and 9999999.99),
  max_minutes integer check (max_minutes between 1 and 1440),
  category text not null default 'All' check (category in ('All','Café','Restaurant','Mall','Museum','Park')),
  recap_audience text not null default 'private' check (recap_audience in ('private','group')),
  reminders boolean not null default true,
  revision integer not null default 1 check (revision > 0)
);
revoke all on barkits.account_settings from public, barkits_runtime;

create function barkits.own_account_settings(digest text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid; result jsonb;
begin
  select u.id into actor from barkits.session_user(digest) u;
  if actor is null then raise exception 'Sign in again to continue.' using errcode='28000'; end if;
  select to_jsonb(s) - 'user_id' into result from barkits.account_settings s where user_id=actor;
  return coalesce(result, jsonb_build_object('username',null,'biography','','avatar','map-pin','mode',null,
    'budget',null,'max_minutes',null,'category','All','recap_audience','private','reminders',true,'revision',0));
end;
$$;

create function barkits.save_account_settings(digest text, expected_revision integer, settings jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid; current_settings jsonb; revision integer;
begin
  select u.id into actor from barkits.session_user(digest) u;
  if actor is null then raise exception 'Sign in again to continue.' using errcode='28000'; end if;
  perform 1 from barkits.users where id=actor for update;
  current_settings := barkits.own_account_settings(digest);
  if jsonb_typeof(settings) is distinct from 'object' or (select count(*) from jsonb_object_keys(settings)) <> 10
    or not settings ?& array['username','biography','avatar','mode','budget','max_minutes','category','recap_audience','reminders','revision']
    or jsonb_typeof(settings->'biography') is distinct from 'string'
    or jsonb_typeof(settings->'avatar') is distinct from 'string'
    or jsonb_typeof(settings->'category') is distinct from 'string'
    or jsonb_typeof(settings->'recap_audience') is distinct from 'string'
    or jsonb_typeof(settings->'reminders') is distinct from 'boolean'
    or jsonb_typeof(settings->'revision') is distinct from 'number'
    or jsonb_typeof(settings->'username') not in ('string','null')
    or jsonb_typeof(settings->'mode') not in ('string','null')
    or jsonb_typeof(settings->'budget') not in ('number','null')
    or jsonb_typeof(settings->'max_minutes') not in ('number','null')
    or settings->>'revision' is distinct from expected_revision::text then
    raise exception 'Check your account settings.' using errcode='22023';
  end if;
  if current_settings - 'revision' = settings - 'revision' then return current_settings; end if;
  if (current_settings->>'revision')::integer is distinct from expected_revision then
    raise exception 'Your settings changed in another session. Reload settings before saving.';
  end if;
  if settings->>'username' is not null and settings->>'username' !~ '^[a-z][a-z0-9_]{2,23}$'
    or (settings->>'budget')::numeric <> round((settings->>'budget')::numeric,2)
    or (settings->>'max_minutes')::numeric <> trunc((settings->>'max_minutes')::numeric) then
    raise exception 'Check your username and travel limits.' using errcode='22023';
  end if;
  revision := expected_revision + 1;
  insert into barkits.account_settings as s(user_id,username,biography,avatar,mode,budget,max_minutes,category,recap_audience,reminders,revision)
    values(actor,settings->>'username',settings->>'biography',settings->>'avatar',settings->>'mode',
      (settings->>'budget')::numeric,(settings->>'max_minutes')::integer,settings->>'category',settings->>'recap_audience',
      (settings->>'reminders')::boolean,revision)
    on conflict(user_id) do update set username=excluded.username,biography=excluded.biography,avatar=excluded.avatar,
      mode=excluded.mode,budget=excluded.budget,max_minutes=excluded.max_minutes,category=excluded.category,
      recap_audience=excluded.recap_audience,reminders=excluded.reminders,revision=excluded.revision;
  return barkits.own_account_settings(digest);
exception when unique_violation then
  raise exception 'That username is already in use. Choose another.';
end;
$$;

revoke all on function barkits.own_account_settings(text), barkits.save_account_settings(text,integer,jsonb) from public;
grant execute on function barkits.own_account_settings(text), barkits.save_account_settings(text,integer,jsonb) to barkits_runtime;
