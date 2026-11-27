do $$
begin
  if not pg_has_role(current_user, 'barkits_runtime', 'USAGE') or exists (
    select from pg_catalog.pg_roles
    where (rolname in (current_user, 'barkits_runtime')
      and (rolsuper or rolcreaterole or rolcreatedb or rolreplication or rolbypassrls))
      or (rolname = 'barkits_runtime' and rolcanlogin)
      or (rolname not in (current_user, 'barkits_runtime') and pg_has_role(current_user, oid, 'MEMBER'))
  ) then
    raise exception 'Connect through a dedicated login with only the restricted Barkits runtime membership.';
  end if;

  if not has_schema_privilege(current_user, 'barkits', 'USAGE')
      or has_schema_privilege(current_user, 'barkits', 'CREATE')
      or has_schema_privilege(current_user, 'barkits_meta', 'USAGE, CREATE') then
    raise exception 'Unexpected schema permissions for the runtime login.';
  end if;

  if exists (
    select from pg_catalog.pg_class
    where relnamespace = 'barkits'::regnamespace and relkind in ('r', 'p')
      and (has_table_privilege(current_user, oid, concat(
        'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER',
        case when current_setting('server_version_num')::int >= 170000 then ', MAINTAIN' end
      ))
        or has_any_column_privilege(current_user, oid, 'SELECT, INSERT, UPDATE, REFERENCES'))
  ) then
    raise exception 'Phase 2 runtime login must not have Barkits table privileges.';
  end if;
end;
$$;

select current_database() as database, current_user as verified_runtime;
