# Phase 2 — agent connections

Completed September 5, 2026 (America/Chicago; evidence timestamps are September 6 UTC). Phase 3 is not authorized.

## Outcome

Canvas can host the custom page, and the page can reach a separate authenticated TypeScript service on this laptop. Both the native OpenHands worker and OpenCode through the existing ACP implementation completed the assignment, followed revised instructions sent during execution, and resumed the same conversation after interruption. No new agent harness was needed.

The two consequential findings are that interrupting a conversation did not stop its already-running terminal process, and ACP token accounting was incomplete even though its cost estimates matched OpenCode's own records. These constraints require discussion before implementing the Phase 3 control and metrics behavior.

## Evidence

- [Sanitized machine-readable results](phase-2-evidence.json) contain the versions, run IDs, conversation IDs, terminal-state observations, and usage comparisons.
- [Reproduction commands](../probes/README.md) use the current source and actual Agent Server APIs.
- Ignored `runtime/phase-2/` holds private snapshots, fixture reports, event identifiers, and the browser screenshot. Full conversations remain in OpenHands/OpenCode.
- Five worker conversations were created: four successful tests and one immediate credential-resolution failure. Final checks found all five inactive and every started fixture finished.

## Actual versions

| Component | Observed |
|---|---|
| Canvas package | 1.16.0; running frontend asset names matched the installed build |
| Running Agent Server / SDK / tools / workspace | 1.44.0 from `/server_info` |
| OpenCode | 1.15.13 from the executable |
| Node | 24.16.0 |
| Browser verification | Playwright Chromium 153.0.8010.12, isolated headless session |

The live 1.44.0 schema accepts native and ACP agents through the same `/api/conversations` creation route. Older documentation describing a separate `/api/acp/conversations` route was not used as a substitute for this live contract.

## Capability matrix

| Capability | Native OpenHands | OpenCode through ACP |
|---|---|---|
| Create and start through API | Verified | Verified with a custom ACP command |
| Observe progress | Status, action/observation events, real file output | Status, ACP tool events, real file output |
| Steer while active, without manual stop/resume | Verified revised report | Verified revised report |
| Interrupt conversation | Reached `paused`; request returned in 13 ms in this sample | Reached `paused`; request returned in 2,037 ms in this sample |
| Stop an already-running terminal command | **Not achieved**; heartbeat continued during paused window | **Not achieved**; heartbeat continued during paused window |
| Resume same conversation | Verified, original marker retained | Verified, original marker retained |
| Read model identity | Native LLM model field | Conversation `current_model_id`; metric label alone was `acp-managed` |
| Read tokens | Per-model-call usage and cache counts exposed | **Incomplete through ACP**; fuller records available in OpenCode export |
| Read cost | SDK estimate available | ACP estimate matched OpenCode's session estimate |
| Resume after server/process restart | Not tested in Phase 2 | Not tested in Phase 2 |
| Exact paid-spend cutoff | Not verified | Not verified |

Timing numbers describe individual observations, not latency guarantees. Active steering means the revised instruction affected the eventual result; it does not mean an already-executing terminal command was rewritten. Stop/resume observations concern `/interrupt` followed by `/run`; the distinct `/pause` endpoint was not tested.

## Canvas page and authentication

The `valtteri-connection` extension was installed and enabled through the existing Canvas extension API. A real browser loaded its sidebar page. The page successfully called `/api/canvas-extensions/installed` through `host.agentServer.request`, which uses Canvas's existing authentication.

Separately, the page used a bearer token to call the TypeScript test service. A wrong token returned HTTP 401; a valid token returned a request UUID and UTC timestamp. The test service recorded that response. Real HTTP tests also rejected an unrelated Origin, a foreign Host, unsupported methods, and unknown paths, while permitting the required browser preflight.

The local route is explicitly implemented: browser request to a loopback service, random 256-bit service token, and exact Origin/Host checks. Canvas's helper is used only for the active Agent Server; it does not connect directly to the separate service. No Canvas source changes or proxy changes were needed.

This route was verified only with a browser on the laptop. A phone's `127.0.0.1` identifies the phone, so the planned phone workflow needs a reachable authenticated service route. Do not copy this diagnostic address into the later phone design. The test token is held only in the form while the page is mounted, and all enabled Canvas extensions share that browser authority.

## Usage and trial allowance

These are **runtime estimates**, not independently reconciled provider bills. Their available sum is **$0.14665005**, about $0.147, charged against the shared $10 experiment allowance for planning purposes. No subscription quota was counted as API spend. The initial failed attempt has unavailable cost and remains explicitly recorded rather than being counted as measured zero.

| Run | Model/provider | Estimated USD |
|---|---|---:|
| Initial native attempt | OpenHands / Sonnet 4.6 | Unavailable; failed locally for missing resolved credentials |
| Native interrupt/resume | OpenHands / Sonnet 4.6 | 0.05001600 |
| Native active steering | OpenHands / Sonnet 4.6 | 0.05207070 |
| ACP interrupt/resume | OpenCode Zen / Haiku 4.5 | 0.02356105 |
| ACP active steering | OpenCode Zen / Haiku 4.5 | 0.02100230 |

The ACP interrupt/resume record exposed 61 output tokens, while OpenCode's own session export recorded 1,419. The steering record exposed 49 output tokens through ACP versus 1,163 in OpenCode. In both cases the accumulated cost estimates matched exactly. Cache/input fields also differed; do not add or compare them as though both runtimes use identical accounting semantics. Preserve the sources and make completeness visible in Phase 3.

Model limits, short timeouts, eight-step/iteration caps, and no automatic native model retries kept probes bounded. They do not establish a hard dollar limit or prove cancellation of in-flight charges. Provider account settings, credit reload settings, and existing automation definitions were not changed.

## Failure and resolution

The first native launch supplied a provider-connection identifier in a directly constructed agent. Conversation creation succeeded, but the first model call failed with `LLMServiceUnavailableError`: the underlying provider client had no resolved API credential. No token usage was recorded. This was a probe integration mistake, not evidence that native OpenHands cannot run.

The successful probe reused the active LLM's encrypted credential through the supported settings API and set `secrets_encrypted: true` on creation. Only the model configuration was reused; MCP configuration, personal skills, and memory were not copied into the native probe. The saved profile and account were not modified.

## Decisions to resolve before building on these connections

1. **Stopping work:** choose what the future control promises when a terminal process survives agent interruption. The evidence supports “pause agent”; a stronger “stop all work” promise needs process supervision or further runtime support. Do not implement a misleading stop control.
2. **ACP accounting:** choose whether Phase 3 collects OpenCode session-level usage as an additional source or initially displays incomplete/unavailable token totals. Exact attribution needs coverage of interrupted and failed calls as well as final responses.
3. **Service access:** the laptop test proves a direct authenticated connection. The later phone route must make the service reachable securely; that remains in Phase 6, with this constraint carried forward.

Recommendations are to retain both existing workers, reuse the verified APIs, expose the observed stop limitation until stronger stopping is proven, and use OpenCode's own records to supplement ACP metrics. These are recommendations for Chris's next phase discussion, not newly accepted design changes.

## Sources consulted

- Installed Canvas extension types and bundle, and cached SDK 1.44.0 source were read alongside the live OpenAPI schema.
- [Canvas extension documentation](https://docs.openhands.dev/openhands/usage/agent-canvas/canvas-extensions) explains registration and authenticated Agent Server access.
- [OpenHands ACP documentation](https://docs.openhands.dev/sdk/guides/agent-acp) explains delegation and lifecycle behavior; live route differences are noted above.
- [OpenCode configuration](https://opencode.ai/docs/config/) and [agent step limits](https://opencode.ai/docs/agents/#max-steps) informed process-local overrides.
- [Zen pricing and privacy](https://opencode.ai/docs/zen/) were checked before the Haiku probe. Only synthetic task input was used; the runtime's cost estimate remains the recorded basis.
