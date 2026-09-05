# vAItteri v2 — Architecture for Critique

Status: design only, nothing built. Written 2026-09-04. Built for a single user (Chris) on his own laptop, moving to a VM later. Please critique the design against the goal in section 1, not against a generic "agent platform" goal.

---

## 1. What I'm going for (Chris, own words)

> im going for crazy workrate while still having great work quality, trying to build a system with me at driver seat but driving full speed with a rocket ship attached.

> i want to be able to spawn an agent with a task, have it work and get back to me. it should also be able to code and stuff.

> instead of me just doing cold outreach and saying hey saw u were hiring here is why im good for the job, i wanna try going thru either their oss code, or their product blog, research whatever they have out there, find something thats in my line / relevant to me / i could work on / have expertise in, and then deep dive into it and either find a problem, or an enhancement, or fix an issue or suggestion, and then work on it and reach out to them with something clickable.

> wherever thinking is required i wanna be doing it, so this system will only gimme suggestions. the final message to send is always up to me — i will read it, make my changes, and then send. for PRs, anything to do with how to actually fix the bug i will have a say in; the agent just does what i tell it to do.

> the whole concept of gastown is kinda what im going after. i dont wanna use gastown itself but if i can make my openhands act like that — so i can monitor my agents' work, my agents come back to me when they need me to pay attention to something, i can spawn an agent and give it a task from my phone, and i can monitor from my phone.

> job scout finds me companies and people, then i decide which ones i wanna pursue and make an agent start the legwork on it, while im working with claude code or codex on my oss contributions, and if i get a side idea i can start a side track.

> i need to be able to critique it and modify it as time goes by — strict criteria of mine.

> im not trying to build the perfect overengineered system today. speed. something running over the next few hours, worst case by EOD, and start finding value asap.

### Context the critic needs

- Chris is a senior AI/ML engineer at Dell, employed, running a job search toward SF applied-AI / founding-engineer / FDE roles. Target: first offer by end of Dec 2026.
- Source of truth for the plan is a single Notion page, "vAItteri — Career Plan KB". It contains the reasoning, weekly floors (3 hrs depth work, 3 conversations started, 1 post), screening criteria for roles, an OSS contribution track (OpenHands first), and a progress log the system appends to.
- Prior pipeline: high-volume cold applications, zero responses. Diagnosis in the KB: volume down, specificity up — every approach should lead with something concrete built.
- Prior OSS lesson: 11 cold PRs unmerged. Fix: engage in issues first, explain root cause before code.
- His existing personal project Loopr already has a "comprehension gate" — the agent must pitch the fix before writing code. This design reuses that pattern.

---

## 2. Problems with the current system (v1)

Current stack: OpenHands Agent Canvas on a Linux laptop, 8 cron automations pushing to Slack channels, a `#control` Slack channel polled every 10 min for commands.

1. **Frozen prompts.** Each automation has the plan pasted into its prompt with tight output formats. The plan changed on Sep 3; the automations didn't. Output feels templated and stale.
2. **No task spawning.** Everything is scheduled and proactive. There is no way to say "go do X" and get a result back.
3. **`#control` is broken.** The polling automation fires on schedule but never picks up messages. Chris will only fix it if polling is the recommended approach (this design says it isn't).
4. **Job scout adds little.** It surfaces companies findable on LinkedIn/YC in one place, possibly stale postings. Useful as aggregation, not as intelligence.
5. **No visibility.** No way to see which agents are doing what, or to redirect one mid-flight.
6. **No cost visibility.** No idea what any of this costs.

---

## 3. Design principles

1. **Thinking stays with Chris.** Agents gather, draft, prototype, and propose. They never send messages, never decide how to fix a bug, never edit the plan. Every deliverable is a draft with proof, reviewed by a human.
2. **Context is read at runtime, not baked into prompts.** Every agent run opens by reading the KB (a short "current focus" block plus the relevant section) and a per-task brief. Editing the KB changes behavior. This is also how the system gets critiqued and modified over time: a "things that went wrong last run — don't repeat" section in the KB, read by every agent.
3. **Errors that are visible go to cheap models; errors that are invisible go to strong models.** See section 6.
4. **Notify only when a decision is waiting.** Routine status is silent. "Needs Chris" is the only thing that pings a phone.
5. **WIP limit on Chris's attention, not on agents.** 3–5 tracks needing his review at a time. Scouts, monitors, and subagent fan-out don't count.
6. **Off-the-shelf first.** Build small glue only where nothing exists. No hand-rolled harness.

---

## 4. Components

Gastown's shape (Mayor / Polecats / Witness / Beads) mapped onto tools Chris already has.

| Role | What it is here | Tool |
|---|---|---|
| Town / control plane | Spawns and displays agent conversations; hosts automations | OpenHands Agent Canvas (local today, VM later) |
| Workers | One Canvas conversation per task. Backend chosen by task type | OpenHands agent (cheap provider) for research; Claude Code via ACP (subscription) for code; Codex via ACP as second opinion |
| Planner / Mayor | Strong-model step at the start of a task that reads KB + brief, decides whether to do it or split it, picks models for subtasks | Same conversation, first turn |
| Subagents | Bounded fetch/extract work inside a task, cheaper model | Claude Code subagents or OpenHands delegation |
| Work tracker (Beads) | One Slack message per task, edited in place; thread holds updates and Chris's replies | Slack `#tracker` channel |
| Witness | Cron that scans `#tracker` for stuck/stale tasks and pings Chris | Canvas cron automation, cheap model |
| Spawn from phone | Message → webhook → new Canvas conversation with the message as the brief | Canvas event-triggered automation + tunnel (Cloudflare/ngrok/Tailscale) |
| Phone monitoring | `#tracker` for status; Canvas over Tailscale for the deep view | Slack app, Tailscale |
| Source of truth | Plan, screening criteria, floors, weekly log | Notion KB (existing) |
| Cost log | Every worker appends task, backend, model, rough tokens to a `#runs` message or file | Slack / flat file; provider dashboards for real numbers |

---

## 5. Conventions (the glue)

**Task brief** (what a worker receives):
- Goal — one sentence
- Why — link to KB section it serves
- Track — pipeline / oss / depth / side
- Inputs — URLs, repo, names
- Deliverable — exactly what "done" looks like (e.g. "draft DM + link to proof")
- Not yours to decide — explicit list (e.g. "which fix approach", "whether to send")
- Model tier — planner picks if unset

**Tracker card** (one Slack message per task, agent edits in place):
`[track] title — status — model — last update — link to conversation`
Statuses: queued · running · needs-chris · blocked · done · killed

**Needs-Chris post** (the only thing that @-mentions him): what's being asked, the options, the agent's recommendation, link to the artifact.

**Reactions as controls:** ✅ approve · 🛑 stop · ▶️ deep-dive this · 👀 acknowledged.

**Thread reply = redirect.** A reply in a task's thread hits the webhook and resumes that conversation with the reply as the next instruction.

**Write-back:** on done, worker appends an outcome line to the KB progress log (§10) or contacts table. Agents may log; they may not plan.

**Comprehension gate (OSS):** agent posts repro + root-cause explanation + proposed approaches. Chris picks the approach. Only then does a code-capable worker implement.

---

## 6. Model routing

| Work | Tier | Why |
|---|---|---|
| Gathering candidates, extracting from pages, filtering against hard criteria, formatting | Cheap / free | Errors are visible in a list Chris scans |
| Ranking, explaining "why this one", planning, code, anything that could be silently wrong | Strong | Errors are invisible |
| Choosing which company to pursue, which fix, what to send | Chris | Thinking |

Pattern for scouting: cheap tier gathers wide (~40 candidates with sources, held to recall); strong tier ranks and explains top ~8 (held to precision); Chris picks which get a deep dive. Planner spot-checks subagent output before relying on it. Every couple of weeks, rerun a gather with the strong model and diff — if the cheap tier drops things, upgrade it. Expensive runs only start after Chris approves a candidate.

---

## 7. What happens to the existing automations

- **Job Scout (4×/day):** killed. Replaced by weekly candidate list (cheap) → Chris reacts ▶️ → deep-dive worker spawns (strong).
- **Daily Dashboard (7am):** kept; rewritten to read KB roadmap/floors/log + Todoist/calendar and end with 2–3 proposed task briefs Chris can approve by reaction.
- **EOD check-in:** kept; it's the KB write-back.
- **Company Intel, Event Scout, Post Ideas, Growth Nudge:** folded into the weekly candidate run.
- **Slack Control (polling):** deleted. Webhook replaces it.

---

## 8. Tonight's test (v1 acceptance)

Four tracks at once, Chris in the OSS seat:
1. **Pipeline:** deep dive on one named company → research → find the thing → build proof → draft DM → needs-chris.
2. **OSS (Chris driving):** agent pulls fresh OpenHands issues (<10 days, unassigned, few comments), repros one, posts comprehension brief. Chris picks approach; Claude Code implements.
3. **Background:** research the 10 companies at an SF founder showcase Chris attends Sep 16 — what they build, whether their agents touch real stakes, one observation each.
4. **Side idea from phone:** message the channel mid-evening, watch it spawn, run, report.

Pass criteria: all four appear as cards in `#tracker`; only 1 and 2 ping; 3 finishes unattended; a thread reply on 1 visibly redirects it; cost log has four rows.

---

## 9. Known risks and open questions

- **Review becomes a rubber stamp.** Agents can produce drafts faster than Chris can genuinely read them. This is the main way quality degrades while volume looks great. Mitigation: WIP limit, small visible needs-chris queue. Is a hard cap enough?
- **Laptop as host.** Sleep kills processes (already hurt a prior project). Acceptable for tonight; VM within a week if the spine works.
- **Tunnel security.** Exposing a webhook from a laptop. Needs at least a shared-secret check on inbound payloads.
- **Slack capabilities unverified.** Whether OpenHands' Slack integration can edit messages and add reactions, or whether a Slack MCP server is needed. Whether Slack Lists is worth using over edited messages.
- **Cheap-tier false negatives.** The diff-audit mitigation is periodic, not continuous. Is there a cheaper continuous check?
- **KB as single source of truth in Notion** while the tracker is Slack — two places state lives. Acceptable for v1?
- **Competes for hours** with the job search itself. The KB already flags the personal agent system as a contested time sink. This design is glue, not a harness — but is the build still too big for "tonight"?
- **What's missing?** Anything a Gastown-style system has that this drops and would regret.
