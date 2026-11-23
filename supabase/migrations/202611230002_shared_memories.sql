begin;

alter table public.meetups add column completed_at timestamptz;
alter table public.meetup_recaps add column revision integer not null default 1;
revoke insert, update, delete on public.meetup_recaps, public.meetup_ratings from authenticated;

create function public.finish_shared_meetup(target uuid, next_status text) returns void
language plpgsql security definer set search_path = '' as $$
declare current_status text;
begin
  select status into current_status from public.meetups where id = target and owner_id = auth.uid() for no key update;
  if not found then raise exception 'Only the organizer can change the meetup status.'; end if;
  if next_status is null or next_status not in ('completed','archived') then raise exception 'Unknown meetup status.'; end if;
  if current_status = next_status then return; end if;
  if next_status = 'completed' and current_status = 'decided' then
    update public.meetups set status = next_status, completed_at = now() where id = target;
  elsif next_status = 'archived' and current_status = 'completed' then
    update public.meetups set status = next_status where id = target;
  else
    raise exception 'Refresh the group to check its current status.';
  end if;
end;
$$;

create function public.save_shared_recap(target uuid, post_id uuid, expected_revision integer,
  heading text, body text, audience text) returns void language plpgsql security definer set search_path = '' as $$
declare
  entry public.meetup_recaps%rowtype;
  state text;
begin
  if not public.is_meetup_member(target) then raise exception 'This recap belongs to the meetup group.'; end if;
  select status into state from public.meetups where id = target for no key update;
  if state not in ('completed','archived') then raise exception 'Complete the meetup first.'; end if;
  select * into entry from public.meetup_recaps where id = post_id for update;
  if found and (entry.author_id <> auth.uid() or entry.meetup_id <> target) then raise exception 'Only the author can change this recap.'; end if;
  if audience = 'delete' then
    if entry.id is null then return; end if;
    if entry.revision is distinct from expected_revision then raise exception 'This recap has changed. Refresh and reopen it.'; end if;
    delete from public.meetup_recaps where id = entry.id;
    return;
  end if;
  if coalesce(length(trim(body)),0) not between 1 and 2000 or length(trim(heading)) > 160
     or audience is null or audience not in ('private','group') then raise exception 'Check the caption, title and audience.'; end if;
  if entry.id is not null and (entry.title,entry.caption,entry.visibility) is not distinct from
     (nullif(trim(heading),''),trim(body),audience) then return; end if;
  if state = 'archived' and (entry.id is null or audience <> 'private') then raise exception 'This meetup is archived.'; end if;
  if coalesce(entry.revision,0) is distinct from expected_revision then raise exception 'This recap has changed. Refresh and reopen it.'; end if;
  if entry.id is null then
    insert into public.meetup_recaps(id,meetup_id,author_id,title,caption,visibility,published_at)
      values(post_id,target,auth.uid(),nullif(trim(heading),''),trim(body),audience,case when audience='group' then now() end);
  else
    update public.meetup_recaps set title=nullif(trim(heading),''), caption=trim(body), visibility=audience,
      published_at=case when audience='group' then coalesce(entry.published_at,now()) end, revision=revision+1 where id=entry.id;
  end if;
end;
$$;

create function public.rate_shared_meetup(target uuid, stars_given integer) returns void
language plpgsql security definer set search_path = '' as $$
declare state text;
begin
  if not public.is_meetup_member(target) then raise exception 'Only meetup members can rate their experience.'; end if;
  select status into state from public.meetups where id=target for no key update;
  if state='archived' and stars_given is null or state='completed' then
    if stars_given is null then
      delete from public.meetup_ratings where meetup_id=target and user_id=auth.uid();
    elsif stars_given between 1 and 5 then
      insert into public.meetup_ratings(meetup_id,user_id,stars) values(target,auth.uid(),stars_given)
        on conflict(meetup_id,user_id) do update set stars=excluded.stars;
    else raise exception 'Choose one to five stars.'; end if;
  else raise exception 'Ratings are open on completed meetups.'; end if;
end;
$$;
revoke all on function public.finish_shared_meetup(uuid,text), public.save_shared_recap(uuid,uuid,integer,text,text,text),
  public.rate_shared_meetup(uuid,integer) from public, anon;
grant execute on function public.finish_shared_meetup(uuid,text), public.save_shared_recap(uuid,uuid,integer,text,text,text),
  public.rate_shared_meetup(uuid,integer) to authenticated;
commit;
