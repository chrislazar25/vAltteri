# vAltteri — agreed design and build plan

Updated: 2026-09-05. Status: Phases 1 and 2 complete; Phase 3 awaits explanation and authorization.

Project name: `vAltteri`, with a capital `A` and lowercase `l`. The original draft uses an earlier spelling and is preserved unchanged.

## Intended outcome

Chris wants to direct several useful workstreams at once: investigate companies, identify and understand OSS opportunities, create concrete artifacts, and explore side ideas. The system should keep working with little supervision, expose evidence and progress, and involve Chris when his judgment is actually needed.

Useful output and the effort required to review it matter more than task count. Chris should be able to critique and adjust the system from real experience. His preference is a focused setup followed by real work; do not compromise capability solely to meet a time estimate.

## Decisions already made

| Area | Decision and reason |
|---|---|
| Workspace | Keep OpenHands Agent Canvas for conversations and deep inspection. Build a Tasks extension there to place oversight beside agent work. A shipped task board has not been verified; this is real implementation work. |
| Coordination service | A small TypeScript service handles cross-task state, events, worker commands, and budgets while the UI is closed. Reuse Canvas execution capabilities. TypeScript is a shared-language convenience; Python would also be capable. |
| Persistence | SQLite alongside the service stores task/run metadata, decisions, events, and artifact references. Agents report through the service. Use short transactions, stable identifiers, and duplicate-event handling. |
| Strategy and context | Notion remains the source of career strategy, current focus, criteria, and progress. Read relevant context at task time and record which context informed the task; do not paste an entire frozen KB into recurring prompts. |
| Conversation ownership | Canvas and the worker runtimes retain their conversations. The task ledger references them; it does not duplicate complete transcripts. A task can span several worker runs. |
| Coordinator | A strong, ongoing coordinator responds to meaningful events: task arrival, worker escalation, handoff, and result review. It handles ordinary uncertainty within the task's scope. Avoid continuous model polling and approval of every tiny step. |
| Workers | Use existing capable workers and add OpenCode through a verified integration. Zen is a model provider, separate from the OpenCode harness. Claude Code is optional if a real capability gap emerges. |
| Phone | Slack is the command and decision surface; task threads support steering. Use event delivery rather than the broken scheduled polling loop. Exact event transport is resolved in Phase 6. Canvas access over Tailscale is the planned deep view. |
| Hosting | Laptop first; move the service and database together to a VM later. SQLite persistence does not keep a sleeping laptop executing. |
| Repository | One dedicated local repository outside Downloads. Keep configuration secrets and live runtime state out of version control. |

The custom service must communicate with the extension through a deliberately implemented authenticated connection. The Canvas extension API does not by itself establish connectivity to an arbitrary local service. Verify this in Phase 2 before depending on an integration design.

## Autonomy and attention

Workers first try to resolve routine issues. The coordinator handles bounded retries, delegation, steering, and quality checks. Escalate to Chris for direction, important changes of approach, explicit task gates, and decisions to increase the agreed spend allowance.

For an OSS task, Chris receives a reproduction, root-cause explanation, and proposed approaches before choosing an implementation approach. Outreach remains a draft until Chris decides what to send. Agents may append approved progress records to Notion but may not rewrite strategy on their own.

Routine status and completed background work stay visible without phone pings. Decision requests state the issue, options, recommendation, and supporting artifact. Other tasks can continue while one waits for Chris. Limit pending review work; the original 3–5-track attention target is a starting point to tune, and background work counts when it creates review demand.

Cheap/free models suit bounded work whose output can be checked. Missing candidates are not visible merely because a returned list looks plausible: preserve sources and check coverage before relying on cheap filtering. Verify the chosen provider's current availability and data terms before passing private context.

## Budget and measurement

The agreed first runtime trial allowance is $10 of incremental paid usage. It is an experiment allowance, not a completion-cost forecast. Existing subscriptions, free quotas, and paid API charges must be distinguishable. Build-session model usage is separate from application runtime accounting.

Allocate within the trial allowance without asking Chris about every small spend. Avoid automatic credit reloads. Use provider spending controls where available and reserve allowance for concurrent work. Do not promise an exact cutoff until each worker's controls are verified: stopping new runs does not necessarily cancel in-flight charges.

Store task and worker-run records plus timestamped events, including failed and stopped attempts. Capture:

- Agent/harness, provider/model, task and parent-run identifiers.
- Input/output/cache usage where exposed; measured, estimated, or unavailable cost with its basis.
- Execution time and time waiting for Chris as separate quantities.
- Retries, failures, coordinator interventions, and requests for Chris's judgment.
- Deliverable references and approve/revise/reject outcomes.
- Optional short feedback and review-effort estimate through existing review actions, without additional notification prompts.

Waiting time is not a measure of Chris's active review effort. Parent totals and child costs must not be double-counted. An unavailable token count or cost is not zero. Allow board summaries and exportable records for later analysis.

Evaluate cost per accepted deliverable, usefulness, correction effort, reasons for failure, and unnecessary interruptions. Use those results to adjust routing and workflow. A free model can still be costly in time and rework.

## Build phases

Every phase follows: explanation and questions → Chris's go-ahead → implementation and demonstration → updated handoff. Proceed through one approved phase at a time.

### 1. Project home

Create the dedicated repository and preserve the accepted design, operating instructions, and current handoff. Keep the original draft as a clearly historical reference.

Done when the repository is separate from Downloads, contains no runtime secrets/state, and a new conversation can identify both the intended system and the next permitted action.

### 2. Prove agent connections

Inspect actual running versions and available APIs. Verify a minimal Canvas extension can connect through the intended authenticated route. Exercise a small worker task through the available runtime: launch, observe, redirect, stop/resume, and inspect usage. Test OpenCode's proposed ACP integration. Record differences between native and ACP workers rather than assuming identical controls.

Done when there is a concise capability matrix, reproducible evidence, and an explicit list of gaps. Resolve consequential integration constraints with Chris before building on them. Keep probe scope bounded and visible.

Completed: see [Phase 2 results](phase-2-results.md). Native OpenHands and OpenCode ACP passed active steering and same-conversation interruption/resumption, and the Canvas extension connected to the authenticated local test service. Terminal processes survived agent interruption, and ACP token counts were incomplete compared with OpenCode session records. Carry these constraints into the Phase 3 discussion; a stronger stop guarantee and the accounting approach have not been chosen. The tested loopback service route also needs reachable authenticated routing for the planned phone workflow.

### 3. Task service and metrics

Implement the TypeScript service and SQLite task/run/event records. Add stable identifiers, lifecycle transitions, worker mapping, decision tracking, and usage collection. Handle duplicate events and restart recovery. Implement budget handling to the degree the verified worker interfaces allow, documenting any limits.

Done when a task has a reliable inspectable history, survives service restart without accidental duplicate execution, and records usage honestly. Include failure and stopped-run records from the start.

### 4. Canvas task board

Implement the extension's task list and detail view: status, worker/conversation links, artifacts, decision requests, steering/stop/resume controls where supported, and metric summaries/export.

Done when Chris can oversee and steer real work from Canvas and see the resulting change. The board reads shared task state rather than inventing a separate lifecycle.

### 5. Coordinator and context

Connect relevant Notion context and implement ongoing coordination, delegation, result checks, bounded retries, attention limits, and escalation rules. Apply the trial budget across runs. Record relevant context and coordinator interventions for later evaluation.

Done when an ordinary worker issue is resolved without Chris, an explicit judgment gate stops the dependent work, and the request to Chris contains useful evidence and a recommendation.

### 6. Phone workflow

Connect Slack commands, task messages/threads, and selective notifications. Handle retries and duplicate events, map replies to the correct task, and reject stale decisions. Set up the agreed Canvas phone access. Plan the transition from the existing automations after the replacement path works.

Done when a phone command creates exactly one task, a thread reply visibly steers it, and only a real decision request pings Chris. Preserve existing automation settings until a deliberate cutover within this phase.

### 7. Real-work evaluation

Begin with a bounded company investigation and OSS investigation, then exercise the concurrent background and phone-created tracks. Analyze useful outcomes, costs, correction effort, and interruptions. Verify recovery and operating instructions and fix issues exposed by these tasks.

Done when the acceptance scenarios below are demonstrated and the records support a concrete decision about the next improvement or further trial spending. A VM deployment is a later hosting step to plan from the proven local setup.

## Real-work acceptance scenarios

1. Company investigation: select a company with Chris, research it, propose/build an authorized concrete artifact, and prepare outreach for his judgment. Preserve evidence for factual claims.
2. OSS: investigate an appropriate issue, reproduce it where feasible, explain the root cause, and present approaches. Wait for Chris's choice before implementation; retain relevant verification.
3. Background: research the companies for the September 16, 2026 founder showcase using an actual supplied roster. Finish unattended unless a real consequential blocker arises. The date and roster need rechecking if this scenario is run later.
4. Phone side task: create a task from Slack while other work is running, observe it on the board, and steer it through the task thread.

All tasks must have traceable runs, artifacts, outcomes, and cost status. Company/OSS judgment gates should request attention; ordinary background completion should not. Exercise a duplicate event, service restart, and stale reply to verify that they do not accidentally duplicate work or authorize an old proposal.

## Open items to resolve in their phases

- Phase 2: actual control and usage capabilities; extension/service authentication; OpenCode ACP behavior; Codex integration if needed.
- Phase 3: exact lifecycle/schema, restart reconciliation, usage sources, and enforceable budget boundaries.
- Phase 5: coordinator and worker model choices, actual Notion access, context refresh behavior, and attention thresholds.
- Phase 6: Slack transport/permissions, task control semantics, phone access, and replacement of existing automations.
- Phase 7: named trial company, OSS target, event roster, and outcome evaluation.

These are implementation questions, not reasons to reopen the agreed platform choice or block Phase 1.
