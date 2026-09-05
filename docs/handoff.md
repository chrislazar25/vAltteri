# Current handoff

Updated: 2026-09-05.

## Status and authorization

Phase 1: complete. The documentation repository has been copied and verified at `/home/chrislazar/projects/vAltteri`. The Git working tree is clean, no remote is configured, and nothing has been pushed.

Chris clarified the project name as `vAltteri` (capital `A`, lowercase `l`), inspired by Valtteri Bottas and the visual resemblance to `AI`. Use this spelling for the project. Keep the original draft's historical text and filename unchanged.

Chris approved Phase 1 after the seven-phase explanation. He explicitly wants each later phase explained and understood before authorizing its implementation. Phase 2 is not authorized yet.

No application code, dependency installation, runtime tests, provider purchases, Slack messages, Notion writes, or changes to existing automations have been performed in this foundation work.

## What is in the repository

- `README.md`: entry point and project status.
- `AGENTS.md`: phase approval workflow, build guidance, and model/delegation preferences.
- `docs/plan.md`: accepted design, metrics, budget, phases, and real-work acceptance scenarios.
- `docs/reference/vaitteri-v2-architecture.md`: unchanged original draft, retained as historical context.
- `.gitignore`: excludes secrets and runtime state.

## Validation

- All six intended project files are present and relative Markdown links resolve.
- The historical architecture draft is byte-for-byte identical to the original in Downloads.
- Git ignore checks cover credentials, runtime files, SQLite/WAL/SHM files, and generated output while allowing source, migrations, lockfiles, and environment examples.
- The local Git repository uses `main` with an initial documentation commit and no remote.
- No application tests were applicable to this documentation-only phase.

No application dependencies or integrations have been verified by this phase. Preserve the distinction between the observations below and future runtime evidence.

## Previously observed environment

These are observations from the design conversation, not proof of a working integration. Recheck the relevant items during Phase 2.

- Linux laptop; original working directory `/home/chrislazar/Downloads`.
- Original design document: `/home/chrislazar/Downloads/vaitteri-v2-architecture.md`.
- Agent Canvas package 1.16.0 at `/home/chrislazar/.nvm/versions/node/v24.16.0/lib/node_modules/@openhands/agent-canvas`.
- Canvas `--info` reported ingress 8000, agent server 18000, automations 18001. Its default server versions are not evidence of the actual running versions.
- Installed extension type definitions: `dist/types/canvas-extension.d.ts` inside that package. Custom pages and an authenticated agent-server HTTP helper were visible; that does not prove a route to our future service.
- OpenCode 1.15.13 at `/home/chrislazar/.opencode/bin/opencode`; its documented ACP entry point is `opencode acp`. Canvas integration has not been exercised.
- Codex is available on PATH. Claude Code was not on the inspected PATH; do not infer it is absent everywhere.
- Node 24.16.0, Python 3.12.3, and uv were available. TypeScript was selected as the project default.
- Existing OpenHands settings selected native `openhands` and model `openhands/claude-sonnet-4-6`. No credentials were recorded.
- Existing automation state was found at `/home/chrislazar/.openhands/automation/automations.db`. Do not confuse it with this project's future task ledger.
- The original draft describes eight Slack-oriented automations and broken ten-minute command polling. Their live behavior has not been audited in this repository.

## Next action

Explain Phase 2 to Chris before running probes. Cover the small task to use, the controls and usage signals to verify, the extension/service connection, and the evidence that would count as success. Answer questions and wait for his go-ahead.

Keep the test bounded. Do not build the full task service, board, or coordinator during the integration probe. Record unsupported capabilities explicitly and explain any change that affects the intended experience.

## Starting a new conversation

Open `/home/chrislazar/projects/vAltteri` as the workspace and use:

> Read AGENTS.md, docs/plan.md, and docs/handoff.md. Phase 1 is complete. Explain Phase 2 and answer my questions; do not run integration tests or start implementing it until I give the go-ahead.

The documents are the durable project context. This transcript is not required to resume work.
