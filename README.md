# vAltteri

A personal command center for concurrent agent work: research, company investigations, OSS contributions, and side projects. Chris sets direction and makes consequential decisions; workers and a strong coordinator handle execution and routine steering.

## Current state

Phases 1 and 2 are complete. The repository is at `/home/chrislazar/projects/vAltteri`. Phase 2 verified a Canvas extension's authenticated connection to a local TypeScript test service and exercised native OpenHands and OpenCode ACP workers. The full task service, task board, and coordinator have not been built.

Both workers followed live steering and resumed after interruption. Two constraints need review before Phase 3: agent interruption left an already-running terminal command active, and ACP token metrics were incomplete. Available runtime cost estimates total about **$0.147**; the first failed attempt has unavailable cost.

The name is `vAltteri`: capital `A`, lowercase `l`, inspired by Valtteri Bottas and the visual resemblance of `Al` to `AI` in a suitable typeface.

Read these files in order when starting a new conversation:

1. [AGENTS.md](AGENTS.md) — how to work with Chris and this repository.
2. [docs/plan.md](docs/plan.md) — agreed design, phases, and acceptance criteria.
3. [docs/handoff.md](docs/handoff.md) — current progress, evidence, and next action.

Read the [Phase 2 results and capability matrix](docs/phase-2-results.md), [sanitized evidence](docs/phase-2-evidence.json), and [probe commands](probes/README.md). The next action is to discuss the tested constraints and explain Phase 3. Phase 3 requires a new explicit go-ahead.

## Planned components

- A small TypeScript task service with SQLite persistence and metrics.
- A Tasks extension inside OpenHands Agent Canvas.
- Integrations with agent runtimes, Slack, and the Notion strategy KB.
- Coordinator instructions, result checks, and budget handling.

All custom code will live in this one repository. Canvas and existing agent runtimes remain external dependencies. Their conversations and configuration are not copied into the task database.

The initial host is Chris's Linux laptop. The service and database can move together to a VM later; laptop sleep remains an operating constraint until then.

## Project history

[The original architecture draft](docs/reference/vaitteri-v2-architecture.md) is preserved unchanged as historical context. Later conversation decisions are captured in `docs/plan.md` and supersede that draft where they differ. In particular, the coordinator is ongoing, the task ledger lives in SQLite, and the board is a custom Canvas extension.

No Git hosting remote is configured. Credentials, live databases, logs, and runtime artifacts remain outside version control. For the Phase 2 test kit, install with `npm ci`, check with `npm run check` and `npm run test:runtime`, and follow the [probe instructions](probes/README.md). Worker probes may incur model charges against the shared trial allowance.
