create table barkits.sessions (
  token_digest text primary key check (token_digest ~ '^[0-9a-f]{64}$'),
  user_id uuid not null references barkits.users on delete cascade,
  expires_at timestamptz not null
);
create index sessions_expiry on barkits.sessions(expires_at);

create table barkits.native_sign_ins (
  code_digest text primary key check (code_digest ~ '^[0-9a-f]{64}$'),
  challenge text not null check (challenge ~ '^[0-9a-f]{64}$'),
  user_id uuid not null references barkits.users on delete cascade,
  expires_at timestamptz not null
);
create index native_sign_ins_expiry on barkits.native_sign_ins(expires_at);

create function barkits.start_google_session(subject text, profile_name text, digest text, challenge text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(subject, 790271));
  select user_id into actor from barkits.external_identities
    where provider = 'google' and provider_subject = subject;
  if actor is null then
    insert into barkits.users(display_name) values (nullif(left(trim(profile_name), 160), '')) returning id into actor;
    insert into barkits.external_identities(provider, provider_subject, user_id) values ('google', subject, actor);
  end if;

  delete from barkits.sessions where expires_at <= now();
  delete from barkits.native_sign_ins where expires_at <= now();
  if challenge is null then
    insert into barkits.sessions values (digest, actor, now() + interval '30 days');
  else
    insert into barkits.native_sign_ins values (digest, challenge, actor, now() + interval '5 minutes');
  end if;
end;
$$;

create function barkits.claim_native_session(code text, proof text, digest text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  actor uuid;
begin
  delete from barkits.native_sign_ins
    where code_digest = code and challenge = proof and expires_at > now()
    returning user_id into actor;
  if actor is null then return false; end if;
  insert into barkits.sessions values (digest, actor, now() + interval '30 days');
  return true;
end;
$$;

create function barkits.session_user(digest text) returns table(id uuid, display_name text)
language sql stable security definer set search_path = '' as $$
  select u.id, u.display_name from barkits.sessions s join barkits.users u on u.id = s.user_id
  where s.token_digest = digest and s.expires_at > now();
$$;

create function barkits.end_session(digest text) returns void
language sql security definer set search_path = '' as $$
  delete from barkits.sessions where token_digest = digest;
$$;

create function barkits.authorize_session(digest text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid;
begin
  select id into actor from barkits.session_user(digest);
  if actor is null then raise exception 'Sign in again to continue.' using errcode = '28000'; end if;
  perform set_config('barkits.actor_id', actor::text, true);
end;
$$;

create function barkits.meetup_actor() returns uuid language sql stable set search_path = '' as $$
  select nullif(current_setting('barkits.actor_id', true), '')::uuid;
$$;

revoke all on all functions in schema barkits from public;
grant execute on function barkits.start_google_session(text,text,text,text), barkits.claim_native_session(text,text,text),
  barkits.session_user(text), barkits.end_session(text), barkits.authorize_session(text) to barkits_runtime;
