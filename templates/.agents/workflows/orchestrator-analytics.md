# Orchestrator Reference — Analytics, Tracking & Dashboard

> **When to load:** Read this file when the user asks for a status report, dashboard, quality summary, sprint progress, or efficiency analysis. Do NOT load on every invocation.

---

## Step 2: Phase Coordination

After initialization or on resume, coordinate work using the delegation protocol and phase transition logic defined in `orchestrator.md`.

On every user interaction:
1. Read the current phase and active story from the state file.
2. Route the user's request via the Intent Router.
3. If the next natural step is clear and the user has not directed otherwise, recommend it proactively:
   > _"Requirements are complete (7 stories, all with acceptance criteria). Ready to enter Design phase — shall I proceed?"_

---

## Step 3: Progress Tracking

After each phase delegation completes, update and report sprint progress.

```markdown
## Sprint [N] Progress

**Sprint Goal:** [description]
**Duration:** [YYYY-MM-DD] — [YYYY-MM-DD]
**Stories Committed:** [N]  |  **Completed:** [N]  |  **In Progress:** [N]  |  **Blocked:** [N]

| Story ID | Title | Current Phase | Status | Blocker |
|---|---|---|---|---|
| US-001 | ... | Development | 🔄 In Progress | — |
| US-002 | ... | SOC Review | 🔁 Needs Rework | Critical security finding |
| US-003 | ... | DevOps | ✅ Done | — |
```

---

## Step 4: Quality Monitoring

Track quality across all phases. Flag any metric below target immediately — do not wait for the user to ask.

| Metric | Source | Target | Action if Below Target |
|---|---|---|---|
| Requirements Coverage | Requirements artifacts | 100% BRD items → stories | Loop back to Requirements |
| Acceptance Criteria Coverage | Requirements artifacts | ≥2 scenarios per story | Loop back before Design entry |
| Design Coverage | Design artifacts | Every story has DB + API + UI design | Block Development entry |
| Test Coverage | Testing artifacts (test summary) | ≥80% statements + branches (unit); 100% AC happy paths (E2E) | Block SOC Review entry — Testing exit gate must pass |
| Security Issues | SOC Review report | 0 Critical, 0 Major | Mandatory loop back to Development |
| Security Guardrails | SOC Review report | ✅ Pass | Block DevOps entry |
| CI/CD Pipeline | DevOps artifacts | Active, no PLACEHOLDERs | Block sprint close |
| Code Quality | SOC Review report | <3 Major issues per review | Flag, recommend rework |

---

## Step 5: Efficiency Analysis

After each sprint, compute and report:

| Metric | How to Compute |
|---|---|
| **Rework Rate** | Stories with ≥1 loop-back entry ÷ total stories |
| **Phase Bottleneck** | Phase with most 🔁 Needs Rework entries |
| **Cycle Time** | Date of DevOps completion − Date of Requirements start, per story |
| **Sprint Completion Rate** | Stories completed ÷ stories committed |
| **Defect Escape Rate** | Issues found post-SOC Review ÷ total issues found |
| **Test Coverage — Angular** | % statements + branches from Jest coverage report (target ≥80%) |
| **Test Coverage — .NET** | % line coverage from coverlet report, excl. migrations + DTOs (target ≥80%) |
| **E2E Scenario Coverage** | Cypress AC scenarios passing ÷ total AC scenarios in requirements CSV (target 100%) |
| **Testing Loop-Back Rate** | Stories that looped back from Testing to Development ÷ total stories tested |

Surface patterns: _"3 of 5 stories looped back from SOC Review to Development — consider tightening acceptance criteria in Requirements."_

---

## Step 6: Cross-Agent Traceability

Maintain a live traceability matrix. Update it after each phase completes.

| Requirement | User Story | Design Artifact | Code Files | Test Stubs | Tests Verified | Review Status |
|---|---|---|---|---|---|---|
| FR-001 | US-001 | ADR-01, schema.md | `src/...` | `*.spec.ts` (stubs) | `*.spec.ts` ✅ | ✅ Approved |
| FR-002 | US-003 | API Contract #2 | `src/...` | `*.spec.ts` (stubs) | ⬜ Pending | 🔁 Rework |

_Test Stubs: created by Development phase (compilable empty skeletons). Tests Verified: full AAA implementations created and passing from Testing phase._

Flag orphans immediately:
- Requirement without a story → gap in Requirements phase
- Story without design → blocked from Development
- Code without test stubs → blocked from Testing phase
- Code with stubs but without Tests Verified → blocked from SOC Review
- Code without review → blocked from DevOps

---

## Step 7: Output — Project Dashboard

Generate and save the dashboard after any significant state change (phase completion, sprint end, loop-back).

Save to: `<app-name>-artifacts/orchestrator/[name]-dashboard-[YYYY-MM-DD].md`

```markdown
# Project Dashboard — [Project Name]
**Generated:** [YYYY-MM-DD HH:MM]  |  **Sprint:** [N]  |  **Phase:** [current]

## Executive Summary
[1–3 sentences: overall health, what's in flight, what's next]

## Overall Health: 🟢 Good | 🟡 Needs Attention | 🔴 At Risk

## Phase Progress
| Phase | Status | Artifacts | Notes |
|---|---|---|---|

## Sprint Status
[Sprint tracking table from Step 3]

## Quality Dashboard
[Quality metrics table from Step 4]

## Open Decisions
[From state file — any ⏳ Pending items]

## Loop-Back Log
[From state file — any unresolved rework]

## Risks & Blockers
| # | Risk/Blocker | Impact | Mitigation |
|---|---|---|---|

## Recommended Next Action
[One clear, specific next step for the user]
```
