# Phase 2 connection tests

These are bounded checks of existing OpenHands/Canvas capabilities, not the vAltteri task service or a new worker harness. See [results](../docs/phase-2-results.md) and the [sanitized evidence](../docs/phase-2-evidence.json).

## Prerequisites

- Node 24 or later; run commands from this repository root.
- The existing Canvas frontend at `http://127.0.0.1:8000` and Agent Server at `http://127.0.0.1:18000`.
- Existing native OpenHands model credentials and OpenCode Zen authentication. No purchases or account changes are performed by these scripts.
- `npm ci`. For the optional automated page check: `npx playwright install chromium`.

The API client reads the Canvas launcher's existing `~/.openhands/agent-canvas/api-key.txt` in memory. Override with `VALTTERI_AGENT_KEY_FILE` or `VALTTERI_AGENT_KEY` if the launcher uses another credential source. The client accepts loopback Agent Server addresses only. `VALTTERI_AGENT_URL` and `VALTTERI_CANVAS_URL` override the local addresses. Credentials are never printed or written to the repository.

The native probe uses the Agent Server's supported `X-Expose-Secrets: encrypted` response and `secrets_encrypted` request mechanism to round-trip only the current LLM configuration. A bare provider-connection identifier in a directly constructed agent did not supply a usable credential in the tested server. The original failed attempt is retained.

## Read the interfaces

```sh
npm run probe -- inventory
```

This stores a sanitized inventory and the live OpenAPI schema under ignored `runtime/phase-2/`. It reads active profile pointers and lists existing extensions without changing them. Run this once before a new probe session; retain the original inventory when comparing defaults after a session.

## Canvas extension and authenticated connection

```sh
npm run probe -- extension
npm run probe -- browser
```

The first command installs and enables only `valtteri-connection` from this repository. Rerunning updates this diagnostic extension only. The second opens an isolated headless Chromium browser against the real Canvas application. It skips the onboarding screen in that disposable browser, checks an authenticated Agent Server endpoint, verifies an incorrect service token gets HTTP 401, and verifies a valid request. It saves a screenshot and request evidence privately, then closes the browser and temporary server.

For a manual demonstration:

```sh
npm run probe -- server
```

Open the **vAltteri connection check** sidebar entry in Canvas, or visit `http://127.0.0.1:8000/extensions/valtteri-connection/check`. The diagnostic server runs on port 18080. Read the connection token from `runtime/phase-2/connection-token.txt` in your own terminal and enter it in the page. Click **Check Canvas backend**, then **Check service connection**. Stop the server with Ctrl-C when finished. The token changes on each server start.

The connection path is:

```text
Canvas extension -- Canvas's authenticated helper --> Agent Server
       |
       +-- separate bearer token + allowed Origin --> local TS test server
```

The separate service uses a random 256-bit token, exact Origin and Host checks, a GET-only endpoint, and loopback binding. The extension keeps the token only in the mounted form. It does not derive backend credentials from Canvas internals. Allowed browser origins are `http://127.0.0.1:8000` and `http://localhost:8000`; this is a laptop connection, not a phone-access solution. The Origin check supplements authentication; it is not itself authentication. Other trusted Canvas extensions share the page's browser authority.

## Worker tests — these may incur model charges

```sh
npm run probe -- native
npm run probe -- opencode
npm run probe -- native steer
npm run probe -- opencode steer
```

Default mode is `interrupt`. Each command creates one new conversation in its own ignored fixture directory, records the conversation ID, and uses eight fictional tickets. `gate.py` keeps a terminal action active for at most 60 seconds while commands are exercised. The script sends revised reporting instructions while work is active. The `interrupt` scenario requests interruption, observes the paused state and terminal heartbeat, releases the fixture, and resumes the same conversation. The `steer` scenario releases the fixture and waits for the revised report without manually interrupting or resuming the worker.

The final report must contain exactly the priority counts (high 3, medium 3, low 2), a random marker from the first message, and `steering_applied: true`. This checks both the changed instruction and retention of initial context. A completed task before the active-tool marker is not accepted as proof of active steering or stopping.

Native probes use the current native model with an output limit of 1,200 tokens per request and no automatic model retries. OpenCode probes select `opencode/claude-haiku-4-5` through process-local configuration, disable sharing and external plugins, and set the build agent's step limit to eight. This does not change the saved OpenCode configuration. OpenHands conversations also have an eight-iteration limit. Polling here reads state during a short test; it does not poll a coordinator model.

These are experiment limits, not a guaranteed dollar cutoff. The `$2` field in a run record is a planning allowance, not enforcement. All reruns count against Chris's **shared $10 runtime trial allowance**. Inspect cumulative usage before any further paid runs. Provider-enforced spending limits and an exact cancellation/billing boundary have not been verified. The fixture is a working-directory convention, not an OS security sandbox.

## Evidence and checks

```sh
npm run probe -- usage
npm run probe -- finalize
npm run check
npm run test:runtime
```

`usage` compares runtime metrics with OpenCode's own export for only the probe-owned sessions. It retains token/cost summaries rather than transcripts. `finalize` verifies the active profile pointers against the initial inventory, verifies that all probe conversations are inactive and all started fixtures recorded exit, adds descriptive titles to those conversations, and refreshes the sanitized evidence file. It does not delete the conversations.

`npm run probe -- inspect CONVERSATION_ID` reads errors only for a conversation recorded by these probes. Private run records include failed attempts and paused-state observations. Full conversations remain owned by their runtimes. No source file contains credentials, live databases, or logs.

The connection test checks real HTTP behavior: missing and incorrect tokens, valid authentication, allowed preflight, rejected foreign Origin and Host, unknown paths, and unsupported methods. TypeScript validation covers the probe code; the browser check exercises the actual extension bundle inside Canvas.

## Tested limitations

- Both interruption tests paused the conversation while the terminal heartbeat continued. Cleanup explicitly released the fixture. Do not present this API as proof that all subprocesses were killed.
- ACP cost estimates matched the OpenCode exports, but ACP token totals omitted many internal model calls. The usage comparison preserves both sources.
- The separate `/pause` endpoint, model-request billing cancellation, process restart recovery, worker permission gates, phone routing, and an exact spend cutoff were not tested.
- The current native credential method depends on Canvas's persisted active LLM configuration. Future profile-based launches should resolve credentials on the server; Phase 3 must choose the appropriate launch path before relying on it.

After the probes, the diagnostic extension remains installed and enabled. Browser-test servers have stopped; use the manual server command to repeat the page demonstration. Existing model defaults and automations are not reconfigured by these probes.
