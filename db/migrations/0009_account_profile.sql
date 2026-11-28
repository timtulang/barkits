create function barkits.save_own_profile(session_digest text, profile_name text)
returns table(id uuid, display_name text)
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid;
  saved_name text := btrim(profile_name);
begin
  select u.id into actor from barkits.session_user(session_digest) u;
  if actor is null then
    raise exception 'Sign in again to continue.' using errcode = '28000';
  end if;
  if saved_name is null or length(saved_name) not between 1 and 160 or saved_name ~ '[[:cntrl:]]' then
    raise exception 'Enter a display name of 1–160 characters without line breaks or control characters.' using errcode = '22023';
  end if;
  return query update barkits.users u set display_name = saved_name where u.id = actor
    returning u.id, u.display_name;
end;
$$;

revoke all on function barkits.save_own_profile(text,text) from public;
grant execute on function barkits.save_own_profile(text,text) to barkits_runtime;
