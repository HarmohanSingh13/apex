# Orchestrator Reference — State File & Handoff Schemas

> **When to load:** Read this file during project initialization, when creating or verifying state files, or when a sub-workflow needs a schema reference. Do NOT load on every invocation.

---

## State File Schema: `project_status.md`

**Purpose:** Current sprint state only. Stays small (<60 lines) forever. Completed sprints are archived — never accumulate here.

> **Companion files:** `app-context.md` holds technical knowledge (read selectively). `orchestrator/handoffs/` holds phase completion envelopes (read one at a time). `orchestrator/archive/` holds completed sprint history (never read during active work).

```markdown
# Project Status — [Project Name]

## Identity
- **Project:** [name]
- **App Name:** [inferred from root folder]
- **Root Directory:** [absolute path]
- **Artifacts Path:** [<app-name>-artifacts/]
- **Created:** [YYYY-MM-DD]
- **Last Updated:** [YYYY-MM-DD HH:MM]

## Current Sprint
- **Sprint:** [N]
- **Goal:** [one-sentence sprint goal]
- **Change Type:** [new-feature | enhancement | bug-fix | integration | config]
- **Phases Required:** [e.g. Design, Development, Testing, SOC Review]
- **Active Phase:** [requirements | design | development | testing | soc-review | devops | none]
- **Active Story:** [US-XXX — title | none]
- **Active Sub-Workflow:** [none | requirements | design | development | testing | soc-review | devops]
- **Blocked:** [no | yes — reason]

## Phase Status (Sprint [N])
| Phase | Status | Handoff File |
|---|---|---|
| Requirements | ⬜ Not Started | — |
| Design | ⬜ Not Started | — |
| Development | ⬜ Not Started | — |
| Testing | ⬜ Not Started | — |
| SOC Review | ⬜ Not Started | — |
| DevOps | ⬜ Not Started | — |

_Status values: ⬜ Not Started · 🔄 In Progress · ⏸️ Awaiting Review · ✅ Done · 🔁 Needs Rework_

## Sprint Backlog
| Story ID | Title | Dev | Test | SOC | Blocker |
|---|---|---|---|---|---|
| US-001 | — | ⬜ | ⬜ | ⬜ | — |

_Status: ⬜ Not Started · 🔄 In Progress · ⏸️ Awaiting Review · ✅ Done · 🔁 Needs Rework · ⛔ Blocked_

## Open Decisions
| # | Decision Needed | Context | Raised | Status |
|---|---|---|---|---|
| 1 | — | — | YYYY-MM-DD | ⏳ Pending |

## Loop-Back Log (Sprint [N])
| Date | From | To | Reason | Resolved |
|---|---|---|---|---|
| — | — | — | — | — |

## Azure DevOps Config
- **Organisation:** [org name]
- **Project:** [project name]
- **Frontend Repo:** [repo name]
- **Backend Repo:** [repo name]
- **PAT stored in:** [local env var name or Key Vault reference]
```

---

## Application Context Schema: `app-context.md`

This file is the orchestrator's **application knowledge base**. It enables technical impact recommendations without re-reading the codebase, and gives sub-workflows full context without redundant discovery work.

**Location:** `<app-name>-artifacts/orchestrator/app-context.md`
> ⚠️ This file lives in the `orchestrator/` folder alongside `project_status.md` — **not** inside `development/<app-name>-ai/` or any source code directory. It is an orchestrator state file, not part of the application codebase.

**Update discipline:** Each section has exactly one or two owning phases. Only those phases write to their section. The Decision Log is append-only — never delete or modify existing rows.

```markdown
# Application Context — [App Name]
**Last Updated:** [YYYY-MM-DD HH:MM]
**Last Updated By:** [requirements | design | development | soc-review]
**Sprint:** [N]

---

## Section 1: Business Domain
> Updated by: Requirements workflow (each sprint if scope changes). Read by: all phases.

### Application Purpose
[1–2 sentences: what the app does and who it serves]

### User Roles
| Role | Description | Key Permissions |
|---|---|---|
| — | — | — |

### Key Business Rules
| ID | Rule | Sprint Added |
|---|---|---|
| BR-S1-001 | — | 1 |

### Scope Boundaries
- **In scope:** [what the app handles]
- **Out of scope:** [what it explicitly does not handle]

---

## Section 2: Technical Inventory
> Updated by: Design workflow (new schema/APIs/components), Development workflow (confirm implementation, note deviations).
> Read by: all phases for impact assessment and pattern reuse.

### Database Schema
| Table | Key Columns | Relationships | Status | Sprint |
|---|---|---|---|---|
| — | — | — | — | — |

_Status: [designed S{N}] · [implemented S{N}] · [updated S{N}] · [schema gap — looping back]_

### API Endpoints
| Method | Path | Purpose | Auth / Roles | Request | Response | Status | Sprint |
|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — |

### Component / Page Map
| Page or Component | Route | Purpose | Data Sources | Roles | Status | Sprint |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — |

### External Integrations
| System | Protocol | Direction | Purpose | Status |
|---|---|---|---|---|
| — | — | — | — | — |

---

## Section 3: Security Posture
> Updated by: Design workflow (data classification, threat model). SOC Review workflow (compliance state, findings).
> Read by: Design (before THREAT_MODEL.md update decisions), SOC Review (for classification-aware review).

### Data Classification
| Entity / Field | Classification | Reason |
|---|---|---|
| — | — | — |

_Classifications: PUBLIC · INTERNAL · CONFIDENTIAL · RESTRICTED_

### Threat Model Summary
| Attack Surface | Trust Boundary | Key Mitigation |
|---|---|---|
| — | — | — |

### Guardrails Compliance
| Check | Status | Last Reviewed |
|---|---|---|
| SECURITY.md present | ⬜ | — |
| THREAT_MODEL.md present | ⬜ | — |
| assets.md present | ⬜ | — |
| 0 Critical findings | ⬜ | — |
| 0 Major findings | ⬜ | — |
| Forbidden patterns absent | ⬜ | — |

### Open Security Findings
| ID | Severity | Description | Status |
|---|---|---|---|
| — | — | — | — |

_Statuses: 🔴 Open · ⚠️ Acknowledged — [rationale] · ✅ Resolved_

---

## Section 4: Decision Log
> Updated by: Design workflow (ADRs). Any phase can append for gate overrides or key choices.
> Append-only — never delete or modify existing rows.

| ID | Decision | Rationale | Date | Sprint |
|---|---|---|---|---|
| ADR-001 | — | — | YYYY-MM-DD | 1 |
```

---

## Handoff File Schema

Handoff files are **compact, structured phase outputs** written by the orchestrator after each phase completes. They are the only context passed to the next sub-agent — not the full artifact files, and not `app-context.md` (unless the receiving phase specifically needs technical knowledge).

**Location:** `<app-name>-artifacts/orchestrator/handoffs/`
**Naming:** `[phase]-S[N].md` for sprint-scoped phases, `[phase]-S[N]-[US-XXX].md` for story-scoped phases.

### Requirements → Design

```markdown
# Handoff: Requirements → Design — S[N] — [YYYY-MM-DD]
Sprint: [N] | Stories: [total] (Must: [N], Should: [N], Could: [N])
AC coverage: [N]/[N] stories have ≥2 Gherkin scenarios
Security NFRs: [N] identified — data classification required: [yes/no]
High-impact gaps resolved: [N] | Deferred: [N]
Artifacts: requirements/[files]
```

### Design → Development

```markdown
# Handoff: Design → Development — S[N] — [YYYY-MM-DD]
Sprint: [N]
Schema: [N] tables, [N] relationships
API: [N] endpoints across [N] controllers
Components: [N] pages, [N] shared components
Security docs: SECURITY.md [✅/❌] · THREAT_MODEL.md [✅/❌] · assets.md [✅/❌]
ADRs written: [N]
CONFIDENTIAL/RESTRICTED entities: [list or 'none'] — negative security tests required: [yes/no]
Artifacts: design/[files]
```

### Development → Testing

```markdown
# Handoff: Development → Testing — S[N] · [US-XXX] — [YYYY-MM-DD]
Story: [US-XXX] — [title]
AC criteria implemented: [N]/[N]
Test stubs: [N] files created | data-testid: [complete / N missing — list]
Design deviations: [N — brief description | none]
Files implemented: [comma-separated list of key files]
Artifacts: development/[implementation summary file]
```

### Testing → SOC Review

```markdown
# Handoff: Testing → SOC Review — S[N] · [US-XXX] — [YYYY-MM-DD]
Story: [US-XXX] — [title]
Jest: [X]% stmts / [X]% branches | xUnit: [X]% line
E2E: [N]/[N] AC scenarios passing
Known gaps: [N — brief description | none]
Negative security tests: [ran / not needed]
Loop-backs triggered: [N | none]
Artifacts: testing/[test summary file]
```

### SOC Review → DevOps

```markdown
# Handoff: SOC Review → DevOps — S[N] · [US-XXX] — [YYYY-MM-DD]
Story: [US-XXX] — [title]
Critical: [N] · Major: [N] · Minor: [N]
Security Guardrails: [✅ Pass / ⚠️ Fail]
Verdict: [Approved | Approved with comments | Changes Requested]
Acknowledged findings: [N — brief description | none]
Artifacts: soc-review/[review file]
```

### DevOps → Sprint Close

```markdown
# Handoff: DevOps → Sprint Close — S[N] — [YYYY-MM-DD]
Sprint: [N] | Stories completed: [N]
Repos: frontend [✅/❌] · backend [✅/❌]
Pipeline: [active ✅ / failed ❌]
Variable groups: [configured ✅ / missing ❌]
Branch policies: [active ✅ / not set ❌]
Artifacts: devops/[files]
Sprint status: COMPLETE
```
