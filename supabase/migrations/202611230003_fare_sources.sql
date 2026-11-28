begin;
create function public.save_shared_fare_estimate(target uuid, candidate uuid, trip_minutes integer, fare numeric, provider text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if provider is not null and (provider not in ('Angkas','Grab') or fare is null) then
    raise exception 'Choose a supported provider and enter its fare.';
  end if;
  perform public.save_shared_estimate(target,candidate,trip_minutes,fare);
  if provider is not null then
    update public.meetup_journeys set source='User-entered ' || provider
      where meetup_id=target and venue_id=candidate and user_id=auth.uid();
  end if;
end;
$$;
revoke all on function public.save_shared_fare_estimate(uuid,uuid,integer,numeric,text) from public, anon;
grant execute on function public.save_shared_fare_estimate(uuid,uuid,integer,numeric,text) to authenticated;
commit;
