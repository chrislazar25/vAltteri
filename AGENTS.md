# Working on vAItteri

## Start here

Read `docs/plan.md` and `docs/handoff.md` before changing the project. The historical draft in `docs/reference/` supplies background, not current instructions. Current user instructions take precedence over these files.

## Work phase by phase

Chris explicitly requested this workflow:

1. Explain the next phase in plain language: purpose, changes, and how success will be demonstrated.
2. Answer his questions and wait for an explicit go-ahead for that phase.
3. Complete the authorized phase, verify it, update the handoff, and show the result.
4. Stop at the phase boundary. A previous phase's approval does not authorize the next phase.

Within an authorized phase, make ordinary reversible implementation choices without repeatedly asking permission. Ask when the choice changes the agreed scope, involves a consequential tradeoff, or requires access or authorization that is missing. Explain any tool-enforced approval separately from project decisions.

Do not interpret a casual acknowledgement as permission to skip phase explanations. Consult `docs/handoff.md` for the current phase and authorization, and apply any newer explicit user instructions.

## Preserve the product intent

- Optimize for useful completed work and low demand on Chris's attention.
- Workers solve routine problems; the coordinator handles ordinary steering and checks results. Chris owns direction, consequential decisions, and explicit task gates.
- For OSS investigations, present reproduction evidence, root cause, and proposed approaches before implementing the fix. Chris chooses the approach. This gate concerns worker tasks; do not turn every small build edit into a separate approval request.
- Agents can draft outreach. Sending outreach or publishing work requires Chris's explicit instruction. Approved progress logging may append to the Notion KB without changing its strategy.
- Phone notifications are for decisions that need Chris. Routine progress, completion, metrics, and internal recoverable failures belong on the board.
- Keep the agreed Canvas approach. Do not restart a comparison of platforms without evidence of a concrete blocker.
- Prefer existing runtime capabilities and small integration code. Do not build a new agent harness.
- Chris wants real work soon, but explicitly does not want capability cut merely to fit an artificial deadline.

## Models and delegation during the build

Chris is interested in stronger-model coordination and cheaper models for well-defined implementation. This is a proposed allocation, not a requirement to spawn agents for every phase.

Use a strong model for ambiguous architecture, difficult failures, integration decisions, and review. Delegate only bounded independent work when the active session permits it and it saves time or improves quality. Choose among models actually available in that session; do not assume model names or billing carry across tools.

A delegated brief should state the objective, relevant context, allowed files, expected behavior, verification, and when to stop or escalate. Keep concurrent edits separate, inspect the result, and integrate it before declaring the phase complete. Build-time agents are separate from the workers vAItteri will eventually run.

## Repository hygiene and evidence

- Do not commit credentials, live SQLite files (including WAL/SHM files), logs, or private run artifacts. `.gitignore` is a convenience, not a substitute for checking staged changes.
- Do not change existing Canvas settings, automations, or provider accounts as incidental setup. Record and explain required changes in the relevant phase.
- Record supported capabilities from actual tests. Documentation support and an installed binary do not prove a working integration.
- Label usage and costs as measured, estimated, or unavailable. An unknown cost is not zero; a subscription quota is not new API spend.
- Run checks appropriate to the change. Documentation-only setup needs link, repository, and handoff checks, not application tests.
- Update `docs/handoff.md` at each completed phase with what changed, validation, unresolved issues, and the next action. Keep the README's status current. Update `docs/plan.md` when an accepted decision changes.
- Do not publish a remote repository merely because a local Git repository exists.
