create function barkits.list_shared_meetups() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', m.id, 'owner_id', m.owner_id, 'name', m.name, 'description', m.description,
    'activity', m.activity, 'starts_at', m.starts_at, 'status', m.status
  ) order by m.created_at desc, m.id), '[]'::jsonb)
  from barkits.meetup_members mm join barkits.meetups m on m.id = mm.meetup_id
  where mm.user_id = barkits.meetup_actor() and m.status <> 'cancelled';
$$;

create function barkits.get_shared_meetup(target uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'summary', jsonb_build_object(
      'id', m.id, 'owner_id', m.owner_id, 'name', m.name, 'description', m.description,
      'activity', m.activity, 'starts_at', m.starts_at, 'status', m.status,
      'chosen', (select jsonb_build_object('name', v.name, 'latitude', v.latitude,
        'longitude', v.longitude, 'catalog_key', v.catalog_key) from barkits.venues v where v.id = m.venue_id),
      'ballot', coalesce((
        select jsonb_agg(jsonb_build_object(
          'venue_id', c.venue_id,
          'place', jsonb_build_object('name', v.name, 'latitude', v.latitude, 'longitude', v.longitude, 'catalog_key', v.catalog_key),
          'votes', coalesce((select jsonb_agg(jsonb_build_object('user_id', ballot.user_id))
            from barkits.meetup_votes ballot where (ballot.meetup_id, ballot.venue_id) = (m.id, c.venue_id)), '[]'::jsonb),
          'estimates', coalesce((select jsonb_agg(jsonb_build_object('user_id', j.user_id, 'minutes', j.minutes,
              'fare_pesos', j.fare_pesos, 'source', j.source, 'calculated_at', j.calculated_at))
            from barkits.meetup_journeys j where (j.meetup_id, j.venue_id) = (m.id, c.venue_id)), '[]'::jsonb)
        ) order by v.name, v.id) from barkits.meetup_candidates c join barkits.venues v on v.id = c.venue_id
        where c.meetup_id = m.id
      ), '[]'::jsonb)
    ),
    'roster', coalesce((select jsonb_agg(jsonb_build_object('user_id', mm.user_id, 'display_name', coalesce(mm.display_name, u.display_name, 'Member'))
      order by mm.display_name, mm.user_id) from barkits.meetup_members mm join barkits.users u on u.id = mm.user_id
      where mm.meetup_id = m.id), '[]'::jsonb),
    'origins', case when m.status in ('completed','archived') then '[]'::jsonb else
      coalesce((select jsonb_agg(to_jsonb(o) - 'meetup_id') from barkits.meetup_origins o where o.meetup_id = m.id), '[]'::jsonb) end,
    'memories', case when m.status in ('completed','archived') then jsonb_build_object(
      'recaps', coalesce((select jsonb_agg(jsonb_build_object(
        'id', r.id, 'author_id', r.author_id, 'title', r.title, 'caption', r.caption,
        'visibility', r.visibility, 'revision', r.revision, 'created_at', r.created_at
      ) order by r.created_at desc, r.id) from barkits.meetup_recaps r where r.meetup_id = m.id
        and (r.author_id = barkits.meetup_actor() or (r.visibility = 'group' and r.published_at is not null))), '[]'::jsonb),
      'ratings', coalesce((select jsonb_agg(jsonb_build_object('user_id', r.user_id, 'stars', r.stars))
        from barkits.meetup_ratings r where r.meetup_id = m.id), '[]'::jsonb)
    ) end
  )
  from barkits.meetups m
  where m.id = target and m.status <> 'cancelled' and barkits.is_meetup_member(m.id);
$$;

create function barkits.save_own_trip(target uuid, origin_label text, transport_mode text,
  lat double precision, lng double precision, fare_limit numeric, time_limit integer) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not barkits.is_meetup_member(target) then raise exception 'This meetup is available to its members.'; end if;
  if coalesce(length(trim(origin_label)),0) not between 1 and 512
    or transport_mode is null or transport_mode not in ('Public transport','Private car','Motorcycle taxi','Ride-hailing car','Walking','Mixed commute')
    or (lat is null) <> (lng is null) or lat not between -90 and 90 or lng not between -180 and 180
    or fare_limit not between 0 and 9999999.99 or time_limit <= 0 then
    raise exception 'Enter a starting point, transport mode and valid travel limits.';
  end if;
  insert into barkits.meetup_origins(meetup_id,user_id,label,mode,latitude,longitude,max_fare_pesos,max_minutes)
    values(target,barkits.meetup_actor(),trim(origin_label),transport_mode,lat,lng,fare_limit,time_limit)
  on conflict (meetup_id,user_id) do update set label=excluded.label, mode=excluded.mode,
    latitude=excluded.latitude, longitude=excluded.longitude, max_fare_pesos=excluded.max_fare_pesos, max_minutes=excluded.max_minutes;
end;
$$;

revoke all on function barkits.list_shared_meetups(), barkits.get_shared_meetup(uuid),
  barkits.save_own_trip(uuid,text,text,double precision,double precision,numeric,integer) from public;
grant execute on function barkits.list_shared_meetups(), barkits.get_shared_meetup(uuid),
  barkits.save_own_trip(uuid,text,text,double precision,double precision,numeric,integer) to barkits_runtime;
