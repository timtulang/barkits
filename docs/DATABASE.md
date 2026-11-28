# Barkits database

## Schema and access

Neon PostgreSQL is the shared database for the backend. The Phase 2 baseline owns a `barkits` schema and a separate private migration ledger. It starts with four tables.

| Table | Contract |
| --- | --- |
| `users` | Internal UUID plus optional application profile name. |
| `external_identities` | One verified Google subject per user and a unique subject-to-user mapping. Email addresses do not identify accounts. |
| `meetups` | Stable UUID, owner, Quick Catch-up or Planned Meetup kind, basic lifecycle state and optional scheduled instant. The owner must be a member by transaction commit. |
| `meetup_members` | Unique user and meetup membership, indexed for each user's meetup list. |

The later migrations add expiring app sessions, proof-bound native sign-ins, and the shared meetup tables for invites, origins, venues, votes, estimates, recaps, and ratings. Google subjects map to the same internal UUID on every platform. Sessions and account handoffs store digests, with 30-day and five-minute lifetimes respectively.

Barkits starts fresh on Neon. The earlier Supabase migrations are retained for historical reference. Existing AsyncStorage guest meetups remain readable. The runtime role has no table privileges. Its allowed functions derive the acting user from a valid session inside the same transaction as each shared operation. They enforce meetup membership, organizer privileges, status, invite redemption, and recap audience.

## Environment

Use a dedicated Neon development branch and a database intended for Barkits. Obtain the direct URL for migrations and a pooled URL for the least-privileged API login. The CLI uses Node 24 and PostgreSQL 17 or newer client tools. Supply the variables through backend or operator secrets.

```dotenv
DIRECT_DATABASE_URL=postgresql://<migration-role>:<secret>@<direct-dev-host>/<database>?sslmode=require&channel_binding=require
DATABASE_URL=postgresql://<runtime-login>:<secret>@<pooled-dev-host>/<database>?sslmode=require&channel_binding=require
```

Values contain credentials. Keep them out of Git, chat, logs and Expo client configuration. The CLI uses hostname-verified TLS and the system trust store for remote databases. Local PostgreSQL can use a loopback URL. The migration login must own the schema it creates and be able to create the restricted role. A runtime login created through SQL avoids the `neon_superuser` membership that Neon applies to roles created through the Console, CLI or API. [Neon connections](https://neon.com/docs/connect/connect-securely), [Neon roles](https://neon.com/docs/manage/roles), [Neon pooling](https://neon.com/docs/connect/connection-pooling)

## Apply and verify

1. In the Neon Connect dialog, select the confirmed development branch and database, disable pooling for the migration URL, and set `DIRECT_DATABASE_URL` privately. Check the target and recovery point before applying.
2. Run `node db/cli.mjs migrate`. The runner serializes concurrent migration runs for the database, applies its versioned SQL and records success in one transaction. Run it again to check that the applied versions are skipped.
3. Use `node db/cli.mjs shell` for the direct operator connection. Create a separate runtime login through SQL and set a generated password interactively.

```sql
create role barkits_api login inherit;
grant barkits_runtime to barkits_api;
\password barkits_api
```

4. Select the same development branch, database and restricted runtime login in Neon’s Connect dialog. Enable pooling and save that URL as `DATABASE_URL`. The host has a `-pooler` suffix before its first dot. Run `node db/cli.mjs check` to test the PostgreSQL TCP connection, inherited runtime membership, schema access and absence of elevated or table privileges. If your environment can reach Neon over HTTPS but cannot open TCP port 5432, run `node db/cli.mjs check --https` for the same permissions check over port 443. The runtime role has schema usage and specific function grants. It has no direct table privileges.

The HTTPS check runs without `psql`. Operator commands such as `migrate`, `backup` and `restore` use the direct URL and require a machine or runner that can reach Neon on TCP port 5432.

On a disposable development database, run `node db/cli.mjs shell < db/test-core.sql` to check identity uniqueness, organizer membership, duplicate protection and deletion behavior. Run `node db/cli.mjs shell < scripts/check-shared-meetups.sql` for Google identity mapping, session revocation, shared membership, invite expiry, voting, and recap privacy. Both checks roll back their fixtures.

Add future numbered migrations to `db/migrations/` and register them in order in `db/migrate.sql`. Add a new migration for changes after a version is applied.

Migrations `0007_abuse_limits` and `0008_api_ip_budget` add private rate-limit counters and restricted IP/account quota functions, including a general API budget. Apply both before deploying the guarded API. Counters commit separately from shared mutations so failed attempts consume their budget. See [production guardrails](SECURITY.md) for limits, retention and local concurrency verification.

## Backup and recovery

- Before changing an existing environment, capture a Neon restore point within its retention window or create a restricted backup outside the repository. Run `node db/cli.mjs backup > "$backup_file"` after setting a private umask. The dump contains the Barkits schemas and their data.
- Rehearse recovery into a fresh database or branch. Create the `barkits_runtime` group there if absent, with `CREATE ROLE barkits_runtime NOLOGIN NOINHERIT`. Set `DIRECT_DATABASE_URL` for the restore target. Run `node db/cli.mjs restore < "$backup_file"` before running migrations on the target. The restore keeps ACLs and runs as one transaction.
- Compare migration versions, row counts, foreign keys and representative records. Provision a target-specific runtime login and rerun the role check. A failed migration rolls back automatically. For recovery after a successful migration, restore to a separate target and verify it before switching connections. Preserve and reconcile writes if a live environment has accepted changes since the recovery point. [Neon branch restore](https://neon.com/docs/introduction/branch-restore)
