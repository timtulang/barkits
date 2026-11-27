set local lock_timeout = '10s';
select pg_advisory_xact_lock(126430573, 1);

create schema if not exists barkits_meta;
revoke all on schema barkits_meta from public;
create table if not exists barkits_meta.schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
);
revoke all on table barkits_meta.schema_migrations from public;

select not exists (
  select 1 from barkits_meta.schema_migrations where version = '0001_core'
) as apply_core
\gset

\if :apply_core
  \ir migrations/0001_core.sql
  insert into barkits_meta.schema_migrations (version) values ('0001_core');
\else
  \echo 0001_core already applied.
\endif
