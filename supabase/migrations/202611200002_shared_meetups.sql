begin;

alter table public.meetup_invites add column redeemed_by uuid references auth.users(id);

create function public.create_shared_meetup(
  request_id uuid, meetup_name text, member_name text, meetup_activity text,
  meetup_description text, meetup_start timestamptz
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null or request_id is null or coalesce(length(trim(meetup_name)), 0) not between 1 and 160
     or coalesce(length(trim(member_name)), 0) not between 1 and 80 then
    raise exception 'Enter a meetup name and your display name.';
  end if;
  insert into public.meetups(id, owner_id, name, activity, description, starts_at, status)
    values (request_id, actor, trim(meetup_name), nullif(trim(meetup_activity), ''), nullif(trim(meetup_description), ''), meetup_start, 'planning')
    on conflict (id) do nothing;
  if not public.is_meetup_owner(request_id) then raise exception 'Could not create this meetup.'; end if;
  insert into public.meetup_members(meetup_id, user_id, display_name)
    values (request_id, actor, trim(member_name)) on conflict do nothing;
  return request_id;
end;
$$;

create function public.issue_meetup_code(target uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare
  code text := upper(right(replace(gen_random_uuid()::text, '-', ''), 16));
begin
  perform 1 from public.meetups where id = target and owner_id = auth.uid() and status in ('draft','planning') for no key update;
  if not found then raise exception 'Only the organizer of an open meetup can invite friends.'; end if;
  delete from public.meetup_invites where meetup_id = target and redeemed_at is null;
  insert into public.meetup_invites(meetup_id, token_digest, expires_at)
    values (target, encode(sha256(convert_to(code, 'UTF8')), 'hex'), now() + interval '24 hours');
  return code;
end;
$$;

create function public.join_shared_meetup(invite_code text, member_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  code text := upper(regexp_replace(invite_code, '[[:space:]-]+', '', 'g'));
  invitation public.meetup_invites%rowtype;
begin
  if actor is null or coalesce(length(trim(member_name)), 0) not between 1 and 80 then
    raise exception 'Enter your display name to join.';
  end if;
  select * into invitation from public.meetup_invites
    where token_digest = encode(sha256(convert_to(code, 'UTF8')), 'hex') for no key update;
  if invitation.redeemed_by = actor then return invitation.meetup_id; end if;
  if invitation.id is null or invitation.expires_at <= now() or invitation.redeemed_at is not null
    or not exists(select 1 from public.meetups where id = invitation.meetup_id and status in ('draft','planning')) then
    raise exception 'This code is invalid, expired, or already used. Ask the organizer for a new code.';
  end if;
  insert into public.meetup_members(meetup_id, user_id, display_name)
    values (invitation.meetup_id, actor, trim(member_name)) on conflict do nothing;
  if found then
    update public.meetup_invites set redeemed_at = now(), redeemed_by = actor where id = invitation.id;
  end if;
  return invitation.meetup_id;
end;
$$;

revoke all on function public.create_shared_meetup(uuid,text,text,text,text,timestamptz),
  public.issue_meetup_code(uuid), public.join_shared_meetup(text,text) from public, anon;
grant execute on function public.create_shared_meetup(uuid,text,text,text,text,timestamptz),
  public.issue_meetup_code(uuid), public.join_shared_meetup(text,text) to authenticated;
commit;
