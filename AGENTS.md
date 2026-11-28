# AGENTS.md

## Mission and engineering rules

Deliver the smallest correct, maintainable solution. These instructions apply to Codex Cloud and CLI; preserve existing project requirements and more specific repository instructions.

- Build modularly: no authored code file may exceed 300 lines. Split by responsibility rather than omitting functionality. Documentation, plans, and untouched generated artifacts are exempt.
- Keep entrypoints and public contracts stable. Isolate logic likely to change for known requirements; avoid speculative abstractions.
- Reuse existing components, functions, types, and dependencies before creating new ones. Prefer simple solutions over custom infrastructure (Ponytail).
- During development, let unexpected failures surface. No silent/default fallbacks, dummy data that masks failures, misleading success messages, or empty try-catch blocks. Explicit error handling and user-facing error states are required where appropriate.
- Prefer free, open-source, self-hostable libraries. Before adopting a new library, ask the user and briefly assess fit, alternatives, license, maintenance, security, and cost. Reuse approved dependencies without repeated approval. No new paid services without approval.
- Design UI for end users, not database schemas. Preserve branding, accessibility, security, validation, authorization, data integrity, and required functionality.
- Do not overwrite unrelated work, expose secrets, perform destructive Git operations, or commit/push/deploy without authorization.
- No unnecessary comments. Necessary comments must be lowercase and one sentence; preserve required licenses and directives.

## Execution and usage efficiency

Minimize total model usage, not just reply length. Scale effort to the task.

- Simple, localized tasks: inspect the relevant files, make the change, and run focused verification. No formal plan, skill audit, graph lookup, or broad repository scan by default.
- Complex or cross-module tasks: use a short 3–7 step plan (`update_plan` if available), implement in coherent phases, and verify meaningful checkpoints. Do not pause for approval between phases unless needed.
- Use targeted searches, bounded tool outputs, scoped diffs, and relevant documentation. Avoid rereading unchanged files, loading large reports, or repeating analysis without new evidence.
- Prefer one agent. Use parallel agents only for independent work whose benefit justifies duplicated context.
- Avoid separate review passes for every routine edit. Review the affected diff and expand checks when risk or evidence warrants it.
- Stop when acceptance criteria are met. Report changes, verification, and actionable blockers concisely; do not repeat instructions or tool logs.

## Optional tools (Cloud and CLI)

Tools are aids, not mandatory workflow stages. Do not discover, install, initialize, or audit every integration at session start. Missing optional tools must not block ordinary work.

- **Ponytail:** follow the simplicity rules above without invoking the plugin or a separate audit. Use its skill only for substantial refactoring or explicit requests. Avoid duplicate hooks and skills.
- **Graphify:** for complex dependency tracing, architecture, or unfamiliar cross-module changes, use focused queries against an existing relevant graph when available. Verify against source. Otherwise use direct searches; never load the full graph/report by default. Build or refresh only when requested or authorized and worthwhile; prefer incremental updates. Exclude secrets and private data from external indexing.
- **Agent Skills:** use the smallest useful set of installed or repository-scoped skills (`.agents/skills/`). Read only relevant `SKILL.md` files and necessary references. Routine edits need no skill invocation. Install specific reviewed skills only with authorization; never install entire collections by default.
- **OmniRoute:** optional, externally configured CLI infrastructure. Respect the selected model/provider; never configure routing, start a gateway, or transmit source to a new provider without approval. Keep credentials and machine-specific configuration outside the repo. Cloud uses its available hosted models; no routing setup required.
- Keep reviewed project skills in the repo for portability; install their executable dependencies separately in CLI and Cloud setup environments. Do not assume network access, global tools, or hooks are shared. Report missing tools only when they affect the task.

## Continuity Ledger (compaction-safe)

Use one canonical workspace ledger, `CONTINUITY.md`, for durable project context. Do not create `PROGRESS.md` or duplicate ledgers.

- Read the ledger at session start, after compaction/resumption, or when its state may have changed. Do not reread it on every turn if its current contents remain in context. If absent, initialize it when beginning substantive project work using confirmed facts.
- Update only meaningful changes to goals, constraints, decisions, Done/Now/Next, open questions, working set, or important outcomes. For long work, checkpoint completed phases and precise next steps; do not assume Cloud changes have been pushed to Git.
- Caps: `Snapshot` ≤ 25 lines; `Done (recent)` ≤ 7 bullets; `Working set` ≤ 12 paths; `Receipts` retain the latest 10–20 entries at most. Compress older information into milestones with evidence pointers. No raw logs, transcripts, or secrets.
- Every entry must include a date/ISO timestamp and `[USER]`, `[CODE]`, `[TOOL]`, or `[ASSUMPTION]`. Mark unknowns `UNCONFIRMED`; label assumptions and explicitly supersede outdated facts. Verify stale information against source.
- Record durable decisions as ADR-lite entries (`D001 ACTIVE: …`); recurring incidents use Symptoms / Evidence / Mitigation / Status. Keep these compact.
- Plans cover short-term execution; the ledger covers durable what/why/state. Keep them consistent without duplicating steps.
- For substantive work, start replies with a compact Ledger Snapshot (Goal / Now / Next / Open Questions). Skip it for routine edits and simple questions with no meaningful ledger change. Print the full ledger only on request.

## Mobile app development

Apply to mobile projects only. Preserve the configured stack and versions; do not migrate dependencies just to match these guidelines.

- React Native + Expo, strict TypeScript, Expo Router, NativeWind, and Supabase if configured.
- Use functional components. Separate screens from business logic; put API/database operations in `services/` or the established equivalent. Reuse shared components and follow existing naming/folder conventions.
- Design mobile-first for Android and iOS. Respect safe areas, keyboard behavior, consistent typography and spacing, and appropriate loading, empty, error, and success states.
- Use existing design tokens and consult `docs/DESIGN_SYSTEM.md` for relevant UI changes. If absent, use established project tokens and flag the missing documentation when material.
- Read only relevant `docs/` sections before feature work. Review `docs/DATABASE.md` before schema changes; if missing, obtain necessary schema guidance before altering the schema.
- Never hardcode credentials. Update documentation when architectural decisions change.

## Verification

- Run `npx tsc --noEmit` after TypeScript changes, using installed project dependencies.
- Run the project's relevant lint and tests; start with affected checks. Run broader suites/builds for cross-cutting, high-risk, or release-ready changes.
- Verify affected Android/iOS behavior where supported. Distinguish static checks from actual device/emulator tests.
- Fix regressions introduced by the task. State what passed, failed, or was not run; never claim unperformed verification.

