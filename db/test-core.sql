begin;

do $$
declare
  organizer uuid;
  friend uuid;
  plan uuid;
  subject text := gen_random_uuid()::text;
begin
  insert into barkits.users (display_name) values ('Organizer rehearsal') returning id into organizer;
  insert into barkits.users default values returning id into friend;
  insert into barkits.external_identities (provider, provider_subject, user_id)
  values ('google', subject, organizer);

  begin
    insert into barkits.external_identities (provider, provider_subject, user_id)
    values ('google', subject, friend);
    raise exception 'A Google subject was assigned to two accounts.';
  exception when unique_violation then
    null;
  end;

  begin
    insert into barkits.external_identities (provider, provider_subject, user_id)
    values ('google', gen_random_uuid()::text, organizer);
    raise exception 'Two Google subjects were assigned to the same account.';
  exception when unique_violation then
    null;
  end;

  begin
    insert into barkits.meetups (owner_id, kind, name) values (organizer, 'planned', 'Missing membership');
    set constraints barkits.meetup_owner_member immediate;
    raise exception 'A meetup was allowed to exist without its organizer membership.';
  exception when foreign_key_violation then
    null;
  end;

  insert into barkits.meetups (owner_id, kind, name)
  values (organizer, 'quick_catch_up', 'Migration rehearsal') returning id into plan;
  insert into barkits.meetup_members (meetup_id, user_id) values (plan, organizer), (plan, friend);
  set constraints barkits.meetup_owner_member immediate;

  begin
    insert into barkits.meetup_members (meetup_id, user_id) values (plan, friend);
    raise exception 'A user joined the same meetup twice.';
  exception when unique_violation then
    null;
  end;

  begin
    delete from barkits.users where id = organizer;
    raise exception 'An organizer account was deleted while it still owned a meetup.';
  exception when foreign_key_violation then
    null;
  end;

  delete from barkits.meetups where id = plan;
  if exists (select from barkits.meetup_members where meetup_id = plan) then
    raise exception 'Deleting a meetup left orphaned members.';
  end if;

  delete from barkits.users where id = organizer;
  if exists (select from barkits.external_identities where user_id = organizer) then
    raise exception 'Deleting a user left an orphaned Google identity.';
  end if;
end;
$$;

rollback;
