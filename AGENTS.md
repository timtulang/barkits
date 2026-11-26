# AGENTS.md

## Mission

Deliver the requested outcome with the smallest correct, maintainable implementation. These rules apply in Codex Cloud and Codex CLI. Existing project requirements, architecture, and more specific repository instructions remain in force. Do not change scope simply because a skill recommends a different approach.

## Important rules — engineering and architecture

- Build modularly. Keep authored code files at or below 300 lines. Split growing modules by responsibility; do not truncate functionality to satisfy the limit. Documentation and plans may be as long as needed; untouched generated or machine-generated artifacts are exempt. Never bypass the limit by labeling authored code as generated.
- Think ahead: keep entrypoints and public contracts stable, and isolate logic with foreseeable changes from the start. Plan for concrete future requirements without building speculative frameworks or abstractions.
- Reuse existing functions, components, types, dependencies, and conventions before introducing new ones.
- During development, do not add default fallbacks that hide failures. Let unexpected failures surface so they can be fixed; never use dummy data or misleading success messages to mask them. Never leave empty try-catch blocks. Implement explicit, intentional error handling and user-facing error states without silently swallowing failures.
- Do not reinvent the wheel. Prefer free, open-source, self-hostable tools and libraries. Before adopting a new library, ask the user and help qualify the selection (fit, license, maintenance, security, compatibility, cost, and alternatives). Reuse approved dependencies without repeated approval. Avoid new paid services, subscriptions, or vendor lock-in without explicit approval. Respect licenses and existing project constraints.
- Preserve security, accessibility, input validation, data integrity, authorization, and meaningful tests. Simplicity must never remove necessary safeguards.
- Design UI for the end user, not for the database schema: clear hierarchy, consistent components, responsive layouts, keyboard access, and appropriate loading, empty, error, and success states. Preserve the project's branding.
- Do not overwrite unrelated work, perform destructive Git operations, expose secrets, or commit/push/deploy unless authorized.

## Continuity Ledger (compaction-safe)

Maintain a single continuity file at the workspace root: `CONTINUITY.md`. It is the canonical briefing designed to survive context compaction and interrupted Cloud or CLI sessions. Do not rely on earlier chat/tool output unless it is reflected there. Verify current code and tool evidence if the ledger is stale; explicitly supersede outdated facts. Do not create a separate `PROGRESS.md` or duplicate progress ledger.

### Operating rule

- At the start of every assistant turn, read `CONTINUITY.md` before acting. If absent, initialize it from confirmed project requirements and current evidence; use `UNCONFIRMED` for unknowns. Never overwrite an existing ledger during initialization.
- Update it only when there is a meaningful delta in Goal/success criteria, Invariants/constraints, Decisions, State (Done/Now/Next), Open questions, Working set, or important tool outcomes.
- For multi-phase work, record meaningful changes and verification results at each phase boundary, not just at the end of the task. Record blockers and exact next steps before handing off incomplete work. Do not assume a Cloud session has persisted files to Git.

### Keep it bounded (anti-bloat)

- `Snapshot`: at most 25 lines; include Goal/success criteria, Invariants/constraints, Now, Next, and Open questions.
- `Done (recent)`: at most 7 bullets.
- `Working set`: at most 12 paths.
- `Receipts`: retain the latest 10–20 entries (fewer if fewer exist).
- If sections exceed their caps, compress older entries into dated milestone bullets with pointers (commit, PR, log path, or doc path). Do not paste raw logs or transcripts.

### Anti-drift rules

- Record facts only, not transcripts or speculative conclusions. Clearly mark assumptions as such.
- Every entry must include a date or ISO timestamp (e.g., `2026-01-13` or `2026-01-13T09:42Z`) and a provenance tag: `[USER]`, `[CODE]`, `[TOOL]`, or `[ASSUMPTION]`.
- If unknown, write `UNCONFIRMED` rather than guessing. When a fact or decision changes, explicitly supersede it; do not silently rewrite history.
- Never put credentials, secrets, or sensitive raw tool output in the ledger.

### Decisions and incidents

- Record durable choices in `Decisions` as ADR-lite entries, e.g., `2026-01-13 [USER] D001 ACTIVE: …` with rationale and supersession when applicable.
- For recurring issues, maintain a small, stable incident capsule in the same ledger: Symptoms / Evidence pointers / Mitigation / Status.

### Plan tool vs ledger

- Use `update_plan` when available for short-term execution scaffolding (3–7 steps). If unavailable, use a brief in-session plan rather than a second persistent file.
- Use `CONTINUITY.md` for long-running continuity (what/why/current state), not micro task lists. Keep plan and ledger consistent at the intent/progress level.

### In replies

- Start with a brief **Ledger Snapshot** (Goal + Now + Next + Open Questions). Keep it concise and reflect the current ledger; do not invent status.
- Print the full ledger only when it materially changed or the user requests it. Avoid repeating it in routine replies.

## Mobile App Development Guidelines

### Tech stack

- Framework: React Native + Expo.
- Language: TypeScript (strict mode).
- Navigation: Expo Router.
- Styling: NativeWind.
- Backend: Supabase (if configured).
- These are the mobile project standards. Preserve existing configured versions and architecture; do not introduce or migrate dependencies merely to satisfy this list without approval.

### Architecture

- Use functional React components.
- Keep screens separate from business logic.
- Put API and database operations in `services/`, respecting existing project conventions.
- Reuse shared components before creating new ones.
- Follow existing folder and naming conventions.

### UI/UX rules

- Design mobile-first for Android and iOS.
- Respect safe areas and keyboard behavior.
- Support loading, empty, error, and success states without masking failures with development fallbacks.
- Maintain consistent spacing and typography.
- Use design tokens from `docs/DESIGN_SYSTEM.md`. If missing, inspect existing tokens and report the missing documentation rather than inventing an established design system.

### Development rules

- Read relevant `docs/` files before implementing features.
- Avoid introducing unnecessary dependencies; follow the library approval rules above.
- Never hardcode API keys or credentials.
- Do not alter database schemas without reviewing `docs/DATABASE.md`. If missing, report the blocker and obtain the necessary schema guidance before changing the schema.
- Update documentation when architecture changes.
- No unnecessary comments. Code should be self-explanatory. If a comment is needed, use all lowercase (small-caps style in plain source text) and keep it to one sentence. Preserve required license notices, directives, and generated annotations.

### Verification

- Run `npx tsc --noEmit` after TypeScript changes, using the project's installed TypeScript dependency.
- Run the project's lint and test commands.
- Verify affected Android/iOS behavior where the environment permits; distinguish actual device/emulator checks from static checks.
- Report what passed, failed, or was not run, including any environment limitations.

## Ponytail — simplicity-first implementation

Apply these principles even when the Ponytail plugin is unavailable:

1. Understand the actual code path, requirements, and constraints before choosing a solution.
2. Prefer deleting unnecessary code, using an existing implementation, or relying on platform/library features over writing custom machinery.
3. If a small direct change is sufficient, use it. Extract an abstraction only when it resolves demonstrated duplication, complexity, or a concrete requirement.
4. Avoid speculative extensibility, unnecessary wrappers, new dependencies, boilerplate, and broad rewrites. Do not defer required behavior or tests in the name of simplicity.
5. Review the diff for redundant code, regressions, security, and maintainability. Report meaningful tradeoffs or deliberately deferred work.

If the official Ponytail plugin or skill is present, use its relevant capabilities for implementation or review. Do not require plugin hooks or Claude-specific commands to follow these rules. Use review/audit skills only at the scope warranted by the task.

## Graphify — codebase context and discovery

For architecture, cross-module changes, unfamiliar code, and dependency investigations:

- If a current, relevant graph and Graphify CLI are available, start with a focused `graphify query "<question>"`. Use `graphify path` or `graphify explain` when relationship tracing is useful; check command help for arguments.
- If a graph exists but the CLI is missing, consult targeted sections of `graphify-out/GRAPH_REPORT.md` if useful. Avoid loading the entire graph/report into context by default.
- Verify relevant source files, tests, and configuration before changing code. The graph is an index, not the source of truth.
- For a small, known-file change, inspect the relevant source directly. If Graphify is missing, stale, or incomplete, use scoped searches and direct reads rather than blocking the task.
- Build or refresh the graph using the installed Graphify skill when explicitly requested or when the expected benefit warrants an authorized indexing task. Prefer incremental updates when supported. Do not rebuild the whole graph on every task.
- Exclude secrets, private data, credentials, dependencies, and irrelevant build artifacts from indexing. Do not send private repository content to an external indexing service without permission.

## Agent Skills — targeted expertise

- Discover skills already available in the environment and repository, especially `.agents/skills/`. Read the applicable `SKILL.md` and only the references necessary for the task.
- Choose the smallest useful set of skills. Typical triggers: frontend design for substantial UI changes; testing for complex flows; security for trust-boundary changes; database skills for schema work; mobile skills for mobile-specific tasks.
- Do not load every skill, install entire collections, duplicate existing skills, or add MCP services merely because they exist.
- Follow task-relevant skill guidance without overriding repository constraints, user requirements, or security boundaries.
- When a useful skill is absent, recommend the specific skill and reason. Install only with authorization or during an explicitly approved environment bootstrap. Review its source and bundled scripts before use. Pin reviewed versions where practical.
- Prefer repository-scoped skills for portability. Commit reviewed skill files and required references, not credentials or machine-specific absolute paths. If native skill discovery is unavailable, read the relevant repository skill directly.

## OmniRoute — optional local model routing

- OmniRoute is an optional Codex CLI infrastructure tool, not a project runtime dependency or a required skill.
- Use the model/provider/profile already selected by the user. If OmniRoute is configured externally, respect that configuration; do not try to change the current session's model from inside a coding task.
- Never install or start a gateway, change authentication/provider settings, switch profiles, or transmit source code to a new provider without explicit user authorization.
- Keep provider credentials, gateway URLs containing secrets, and local config outside the repository. Prefer user-approved free providers; do not assume routing removes Codex quotas or guarantees zero cost.
- In Codex Cloud, use the hosted model and available tools. Do not assume access to a local OmniRoute instance or support for custom model routing. Continue normally when OmniRoute is absent.

## Execution and context budget

- After reading or initializing `CONTINUITY.md`, run `git status --short` when Git is available, then inspect relevant project instructions, entrypoints, and existing implementation. Avoid repeated scans and unnecessary full-file reads.
- For nontrivial changes, use the plan tool when available to make a short 3–7 step plan with independently testable phases. Execute in small coherent batches; validate each phase before the next. Simple tasks do not need a formal plan.
- Use focused searches, short tool outputs, scoped diffs, and targeted tests first. Broaden investigation only when the evidence warrants it.
- Prefer one agent. Use parallel agents only for genuinely independent work with clear boundaries and a demonstrated benefit; avoid duplicate context loading.
- Run the repository's relevant lint, typecheck, tests, and build checks as appropriate. Never claim an unrun check passed or manufacture results. Fix regressions caused by the task.
- For long, multi-phase tasks, checkpoint meaningful progress in `CONTINUITY.md` at phase boundaries. Keep completed phases recoverable as coherent diffs. Do not create additional progress files or duplicate the ledger.
- Start replies with the Ledger Snapshot as specified above; finish with a concise summary of changes, verification results, and unresolved risks or blockers. Report unavailable tools only if they materially affected the work.

## Environment setup (manual / explicitly authorized only)

These are optional operator commands, not instructions to execute at the start of every task. Review upstream sources and pin trusted releases for repeatable setup. Do not install duplicate plugin and project-skill copies with the same purpose.

**Ponytail — CLI plugin (optional):**

```sh
codex plugin marketplace add DietrichGebert/ponytail
codex plugin add ponytail@ponytail
```

Review lifecycle hooks in `/hooks` before trusting them, then start a new thread. For a cloud-portable skill, copy the reviewed upstream `skills/ponytail/` directory (including any needed resources) into `.agents/skills/ponytail/`. The embedded rules above already provide an instruction-only alternative.

**Graphify — run from the repository root:**

```sh
uv tool install graphifyy
graphify install --project --platform codex
```

Requires a compatible Python version and `uv` (or use `pipx install graphifyy`). Ensure `graphify` is on PATH. Inspect installer-generated changes to AGENTS.md and hooks; preserve this file's rules and avoid duplicate sections. Start a new session if necessary, then invoke `$graphify .` in Codex. Review index contents before deciding whether to version them.

**AI Agent Skills — install only selected project skills:**

```sh
npx ai-agent-skills list
npx ai-agent-skills install frontend-design -p
```

Use the second command only for projects that need that skill. Review and commit the relevant `.agents/skills/` files. Other skills can be installed on demand.

**OmniRoute — local CLI only:**

After installing and configuring the official OmniRoute gateway with approved providers:

```sh
omniroute setup-codex --dry-run
omniroute setup-codex
```

Review generated profiles and select one when launching Codex CLI. Do not use these commands in Codex Cloud.

**Cloud:** Commit this file and the selected reviewed project skills to the repository branch used by Codex. Configure Graphify's CLI dependency in the cloud environment setup, where supported, and ensure it is accessible during tasks. Do not assume network access, plugin hooks, or user-global installations are available. Continue using the portable instructions if optional tooling is missing.

## Upstream references

- https://github.com/DietrichGebert/ponytail
- https://github.com/Graphify-Labs/graphify
- https://github.com/MoizIbnYousaf/ai-agent-skills
- https://github.com/cheaper-inference/OmniRoute
- https://developers.openai.com/codex/guides/agents-md
- https://developers.openai.com/codex/skills
