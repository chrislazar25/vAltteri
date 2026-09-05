# vAItteri

A personal command center for concurrent agent work: research, company investigations, OSS contributions, and side projects. Chris sets direction and makes consequential decisions; workers and a strong coordinator handle execution and routine steering.

## Current state

Phase 1 is the project foundation: this repository and its written context. No application code, dependencies, running services, or live integrations have been created here.

Read these files in order when starting a new conversation:

1. [AGENTS.md](AGENTS.md) — how to work with Chris and this repository.
2. [docs/plan.md](docs/plan.md) — agreed design, phases, and acceptance criteria.
3. [docs/handoff.md](docs/handoff.md) — current progress, evidence, and next action.

The next action is to explain Phase 2 and wait for Chris's go-ahead before testing integrations.

## Planned components

- A small TypeScript task service with SQLite persistence and metrics.
- A Tasks extension inside OpenHands Agent Canvas.
- Integrations with agent runtimes, Slack, and the Notion strategy KB.
- Coordinator instructions, result checks, and budget handling.

All custom code will live in this one repository. Canvas and existing agent runtimes remain external dependencies. Their conversations and configuration are not copied into the task database.

The initial host is Chris's Linux laptop. The service and database can move together to a VM later; laptop sleep remains an operating constraint until then.

## Project history

[The original architecture draft](docs/reference/vaitteri-v2-architecture.md) is preserved unchanged as historical context. Later conversation decisions are captured in `docs/plan.md` and supersede that draft where they differ. In particular, the coordinator is ongoing, the task ledger lives in SQLite, and the board is a custom Canvas extension.

No Git hosting remote is configured. Credentials, live databases, logs, and runtime artifacts must remain outside version control. There is no install or run command yet.
