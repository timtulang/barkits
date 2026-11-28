create function barkits.account_dashboard(digest text, show_past boolean, page_offset integer) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare actor uuid; plans jsonb; total integer;
begin
  select u.id into actor from barkits.session_user(digest) u;
  if actor is null then raise exception 'Sign in again to continue.' using errcode='28000'; end if;
  if show_past is null or page_offset is null or page_offset not between 0 and 100000 or page_offset%50<>0 then
    raise exception 'Choose a valid dashboard page.' using errcode='22023';
  end if;
  select count(*) into total from barkits.meetups m join barkits.meetup_members mm on mm.meetup_id=m.id
    where mm.user_id=actor and m.status<>'cancelled' and (m.status in ('completed','archived'))=show_past;
  with selected as (
    select m.* from barkits.meetups m join barkits.meetup_members mm on mm.meetup_id=m.id
    where mm.user_id=actor and m.status<>'cancelled' and (m.status in ('completed','archived'))=show_past
    order by case when not show_past then m.starts_at end asc nulls last,
      case when show_past then coalesce(m.completed_at,m.created_at) end desc,m.created_at desc,m.id
    limit 50 offset page_offset
  ), rows as (
    select m.*,case
      when m.status in ('draft','planning') and not exists(select 1 from barkits.meetup_origins o
        where o.meetup_id=m.id and o.user_id=actor) then 'Add your starting point'
      when m.status='planning' and not exists(select 1 from barkits.meetup_candidates c where c.meetup_id=m.id)
        then 'Suggest a destination'
      when m.status='planning' and not exists(select 1 from barkits.meetup_votes v where v.meetup_id=m.id and v.user_id=actor)
        then 'Vote for a destination'
      when m.status='planning' and exists(select 1 from barkits.meetup_candidates c where c.meetup_id=m.id and not exists(
        select 1 from barkits.meetup_journeys j where j.meetup_id=m.id and j.venue_id=c.venue_id and j.user_id=actor))
        then 'Add your travel estimates'
      when m.status='planning' and m.owner_id=actor then 'Review votes and choose a destination'
      when m.status='completed' and not exists(select 1 from barkits.meetup_recaps r where r.meetup_id=m.id and r.author_id=actor)
        then 'Add a memory (optional)'
      else null end as next_action from selected m
  )
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'owner_id',owner_id,'name',name,'description',description,
    'activity',activity,'starts_at',starts_at,'status',status,'next_action',next_action)
    order by case when not show_past then starts_at end asc nulls last,
      case when show_past then coalesce(completed_at,created_at) end desc,created_at desc,id),'[]'::jsonb)
    into plans from rows;
  return jsonb_build_object('plans',plans,'total',total,'offset',page_offset,
    'next_offset',case when page_offset+50<total then page_offset+50 else null end);
end;
$$;
revoke all on function barkits.account_dashboard(text,boolean,integer) from public;
grant execute on function barkits.account_dashboard(text,boolean,integer) to barkits_runtime;
