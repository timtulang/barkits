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

select not exists (
  select 1 from barkits_meta.schema_migrations where version = '0002_google_identity'
) as apply_next
\gset

\if :apply_next
  \ir migrations/0002_google_identity.sql
  insert into barkits_meta.schema_migrations (version) values ('0002_google_identity');
\else
  \echo 0002_google_identity already applied.
\endif

select not exists (
  select 1 from barkits_meta.schema_migrations where version = '0003_shared_meetups'
) as apply_next
\gset

\if :apply_next
  \ir migrations/0003_shared_meetups.sql
  insert into barkits_meta.schema_migrations (version) values ('0003_shared_meetups');
\else
  \echo 0003_shared_meetups already applied.
\endif

select not exists (
  select 1 from barkits_meta.schema_migrations where version = '0004_shared_decisions'
) as apply_next
\gset

\if :apply_next
  \ir migrations/0004_shared_decisions.sql
  insert into barkits_meta.schema_migrations (version) values ('0004_shared_decisions');
\else
  \echo 0004_shared_decisions already applied.
\endif

select not exists (
  select 1 from barkits_meta.schema_migrations where version = '0005_shared_memories'
) as apply_next
\gset

\if :apply_next
  \ir migrations/0005_shared_memories.sql
  insert into barkits_meta.schema_migrations (version) values ('0005_shared_memories');
\else
  \echo 0005_shared_memories already applied.
\endif

select not exists (
  select 1 from barkits_meta.schema_migrations where version = '0006_shared_api'
) as apply_next
\gset

\if :apply_next
  \ir migrations/0006_shared_api.sql
  insert into barkits_meta.schema_migrations (version) values ('0006_shared_api');
\else
  \echo 0006_shared_api already applied.
\endif
