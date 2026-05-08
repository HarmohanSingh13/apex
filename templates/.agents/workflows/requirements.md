---
description: "Requirements & Planning — Use when: gathering requirements, writing user stories, defining acceptance criteria (Gherkin), prioritising with MoSCoW, sizing with T-shirt estimates, performing gap analysis, or building a sprint backlog from a BRD, feature brief, spreadsheet, or existing codebase."
---

# Requirements & Planning Agent

This workflow analyzes a project's input sources (BRD, feature brief, spreadsheet, or existing codebase) and produces a complete set of Agile planning artifacts.

---

## Entry Gate Check

Run this before anything else.

### Infer app name
Derive `<app-name>` from the project root folder name, or find an existing `*-artifacts/` directory in the working tree.

### State file check
If `project_status.md` exists in `<app-name>-artifacts/orchestrator/`:
- Read it. Note the current sprint number (`N`) — use it when naming output files.
- If Requirements artifacts for sprint `N` already exist in `<app-name>-artifacts/requirements/`, warn the user before overwriting:
  > _"Requirements artifacts for Sprint [N] already exist. Proceeding will overwrite them. Confirm? (yes / no)"_
  - If no: stop. Do not proceed.

### Context load
If `app-context.md` exists in `<app-name>-artifacts/orchestrator/`:
- Read it. Section 1 (Business Domain) gives existing roles and business rules — use this to avoid duplicating known domain knowledge in new stories.

### No hard blocking gate
Requirements is the entry point of the SDLC — it has no upstream phase dependency. It can always run.

---

## Prerequisite: Load Security Guardrails

**Before starting**, load the security guardrails skill to ensure security and compliance requirements are elicited at this earliest stage of the SDLC — not retrofitted later.

### Instructions

1. Read `.agents/skills/security-guardrails/guardrails-core.md`.
2. During Step 2 (Requirements Extraction), use the guardrails to prompt for security NFRs — specifically: data classification, PII/sensitive data scope, applicable compliance regulations (DPDP Act 2023, RBI ITGRCA 2023), and authentication/authorisation requirements.
3. Any security requirement identified here becomes a first-class NFR with a `REQ-ID` and feeds directly into the Design agent's Step 6 (Security & Cross-Cutting Concerns).

---

## Step 1: Intake — Identify and Parse Input Sources

Determine the type of input provided and extract raw content accordingly.

### Supported Input Types

| Input Type | How to Process |
|---|---|
| **BRD Document** (`.docx`, `.pdf`) | Read or extract text from the document. Identify sections like Scope, Objectives, Functional Requirements, Non-Functional Requirements, Constraints, and Assumptions. |
| **Feature Brief** (plain text) | Accept the user's text description directly. Ask clarifying questions if the description is ambiguous or incomplete. |
| **Excel / Spreadsheet** (`.xlsx`, `.csv`) | Parse rows as individual requirements or feature entries. Map column headers to requirement fields (ID, Description, Priority, etc.). |
| **Existing Codebase** | Scan the project's directory structure, database schema (e.g., Prisma schema, SQL migrations), API routes, and UI pages to derive implied requirements from what's already built. |

### Instructions

1. Ask the user: *"What is your input source? (BRD document, feature brief, spreadsheet, or existing codebase)"*
2. If a file is provided, read and parse it using the appropriate method above.
3. If multiple sources are provided, merge and deduplicate content.
4. Store the extracted raw content for processing in subsequent steps.

---

## Step 2: Requirements Extraction

Categorize all extracted information into structured requirements.

### Requirement Categories

| Category | Description | Examples |
|---|---|---|
| **Functional Requirements (FR)** | What the system must do | "Users can submit permit applications", "Admins can approve/reject permits" |
| **Non-Functional Requirements (NFR)** | Quality attributes | Performance, security, scalability, availability, compliance |
| **Business Rules** | Domain-specific constraints | "Permits require 4-level approval", "Night work needs special authorization" |
| **Assumptions** | Conditions assumed to be true | "Users have internet access", "Single tenant deployment" |
| **Dependencies** | External systems or preconditions | "Requires Active Directory integration", "Depends on email service" |

### Output Format

For each requirement, assign:

| Field | Description |
|---|---|
| `REQ-ID` | Unique identifier (e.g., `FR-001`, `NFR-001`, `BR-001`) |
| `Category` | One of: FR, NFR, Business Rule, Assumption, Dependency |
| `Description` | Clear, concise statement of the requirement |
| `Priority` | Will be assigned in Step 5 |
| `Source` | Where this requirement was derived from (e.g., "BRD Section 3.2", "Codebase: schema.prisma") |
| `Status` | New, Reviewed, Approved |

### Instructions

1. Go through the raw content from Step 1 systematically.
2. Extract every requirement — explicit and implied.
3. Assign a unique `REQ-ID` to each.
4. If a requirement is ambiguous, flag it for the Gap Analysis in Step 6.
5. **Explicitly elicit security and compliance NFRs** — ask the user:
   - *"Does this system store or process personal data (names, IDs, contact details, financial records)? If yes, apply `DATA_CLASSIFICATION` tags (PUBLIC / INTERNAL / CONFIDENTIAL / RESTRICTED) to each data entity."*
   - *"Are there applicable regulatory requirements? (e.g., DPDP Act 2023, RBI ITGRCA 2023, ISO 27001)"*
   - *"What authentication method is required? (SSO/Azure AD, username+password, MFA)"*
   - *"Who are the user roles and what data/actions should each role be restricted from?"*
   Record each answer as one or more NFRs in the `NFR-` series with Source = "Security Elicitation".
6. Present the full requirements list to the user for review before proceeding.

---

## Step 3: User Story Generation

Convert each Functional Requirement into well-formed Agile user stories using the **enhanced format**.

### Enhanced User Story Format

```
**Story ID:** US-[number]
**Epic:** [Epic Name]
**Title:** [Short descriptive title]

As a [role],
I want [goal/action],
So that [benefit/value].

**Notes:** [Additional context, edge cases, or implementation hints]
**Dependencies:** [List of dependent stories: US-xxx, US-yyy]
**Linked Requirement(s):** [REQ-ID(s) this story addresses]
```

### Instructions

1. Group related stories under **Epics** (high-level feature areas).
2. Each Functional Requirement should produce one or more user stories.
3. Identify all relevant **user roles** from the requirements (e.g., Initiator, Approver, Admin, Safety Officer).
4. Ensure stories are:
   - **Independent** — can be developed in any order (minimize dependencies)
   - **Negotiable** — details can be discussed
   - **Valuable** — delivers user/business value
   - **Estimable** — small enough to estimate
   - **Small** — completable within a sprint
   - **Testable** — has clear acceptance criteria (Step 4)
5. Cross-reference each story back to its source requirement(s) via `Linked Requirement(s)`.

---

## Step 4: Acceptance Criteria

For each user story, generate testable acceptance criteria in **Gherkin (Given/When/Then)** format.

### Format

```gherkin
Feature: [Story Title]

  Scenario: [Scenario Name]
    Given [precondition]
    When [action]
    Then [expected result]
    And [additional expected result]

  Scenario: [Edge Case / Error Scenario]
    Given [precondition]
    When [invalid action]
    Then [error handling result]
```

### Instructions

1. Each user story must have **at least 2 scenarios**: one happy path and one error/edge case.
2. Criteria must be **testable** — avoid vague language like "should work well" or "must be fast."
3. Include scenarios for:
   - **Happy path** — normal expected behavior
   - **Validation errors** — invalid inputs, missing fields
   - **Authorization** — access control (who can/cannot do this?)
   - **Edge cases** — boundary conditions, concurrent access, empty states
4. These criteria will later serve as the basis for automated test cases.

---

## Step 5: Prioritization & Effort

Assign priority and size to each user story so the sprint backlog can be formed.

### Prioritization Framework — MoSCoW

| Priority | Label | Meaning |
|---|---|---|
| **Must Have** | M | Non-negotiable for this sprint/release; system fails without it |
| **Should Have** | S | High value; workarounds exist but delivery is expected |
| **Could Have** | C | Nice to have; dropped first if capacity is tight |
| **Won't Have** | W | Out of scope for this release; document for future sprints |

### Effort Sizing — T-Shirt

| Size | Story Points (approx.) | Description |
|---|---|---|
| XS | 1 | Trivial — a config change or single-field addition |
| S | 2–3 | Small — a focused feature with clear scope |
| M | 5 | Medium — a feature with moderate complexity |
| L | 8 | Large — significant complexity; consider splitting |
| XL | 13+ | Too large — **must be broken down** before sprint planning |

### Instructions

1. Go through each user story and assign a MoSCoW priority and T-shirt size.
2. **Elevate blockers:** If a lower-priority story is a dependency for a Must Have, elevate it to Must Have.
3. **Flag all XL stories** — present them to the user with a recommended breakdown before they enter a sprint.
4. **Security NFR stories** (generated from Step 2 security elicitation) default to **Must Have** — they cannot be deprioritised without explicit user sign-off.
5. Present the prioritized list to the user for review before sprint planning.

---

## Step 6: Gap Analysis

Identify everything missing, ambiguous, conflicting, or at risk before sprint planning commits the team.

### Gap Categories

| Type | Description |
|---|---|
| **Missing Requirement** | A scenario or user role implied by the domain but not stated in the inputs |
| **Ambiguity** | A requirement that could be interpreted in more than one way |
| **Conflict** | Two requirements that contradict each other |
| **Dependency** | A story or system dependency not yet addressed |
| **Risk** | A technical, business, or timeline risk that could block delivery |
| **Tech Debt** | Existing code or design that must be addressed before new work is safe |
| **Security Gap** | A missing security/compliance requirement identified during elicitation |

### Output Format

```
| GAP-ID | Type | Description | Impact | Related Items | Recommendation |
|--------|------|-------------|--------|---------------|----------------|
| GAP-001 | Ambiguity | "Admin" role is referenced but not defined — is it a single superuser or a role group? | High | US-004, FR-007 | Define admin role permissions table before design phase |
| GAP-002 | Missing Requirement | No requirement covers session timeout behaviour | Medium | NFR-003 | Add NFR for 30-minute idle session expiry |
```

### Instructions

1. Review all extracted requirements and user stories against the original input sources.
2. For each gap, assign a `GAP-ID` and one of the types above.
3. Rate impact: **High** (blocks a sprint), **Medium** (causes rework), **Low** (cosmetic or minor).
4. Group gaps by type in the output.
5. Present to the user — for each **High** impact gap, ask for a resolution direction before proceeding to sprint planning. **High** gaps must be resolved or formally deferred before Step 7.

---

## Step 7: Sprint Backlog

Organize all **Must Have** and **Should Have** stories into sprint-sized batches.

### Sprint Parameters

| Parameter | Default | Override |
|---|---|---|
| Sprint length | 2 weeks | User can specify |
| Stories per sprint | 8–12 | Adjust based on team size |
| Capacity unit | T-shirt size sum ≤ 34 points per sprint | Adjust based on team velocity |

### Sprint Output Format

```markdown
## Sprint [N] — Theme: [Sprint Goal]
**Duration:** [Start Date] — [End Date]
**Capacity:** [X points]

| Story ID | Title | Priority | Size | Story Points | Dependencies |
|----------|-------|----------|------|--------------|--------------|
| US-001 | ... | Must Have | M | 5 | — |
| US-003 | ... | Must Have | S | 3 | US-001 |
```

### Instructions

1. Start Sprint 1 with **Must Have** stories that have no unresolved dependencies.
2. If a Must Have story depends on another Must Have, place the dependency in an earlier sprint.
3. Fill remaining sprint capacity with **Should Have** items.
4. **Never mix XL stories into a sprint** — they must be broken down first (see Step 5).
5. **Could Have** stories go into the backlog, not an active sprint, unless capacity allows.
6. If a sprint exceeds capacity, move the lowest-priority stories to the next sprint.
7. Add a **Sprint Goal** (one-sentence theme) to each sprint so the team has a clear focus.
8. Present the full sprint plan to the user for review and adjustment before finalizing.

---

## Step 8: Output Artifacts

Generate and save all artifacts in the formats specified below.

### Artifact Outputs

| Artifact | Primary Format | Additional Format |
|---|---|---|
| **Requirements Document** | Markdown (`.md`) | PDF (`.pdf`) |
| **User Stories** | CSV spreadsheet (`.csv`) | — |
| **Acceptance Criteria** | CSV spreadsheet (`.csv`) | — |
| **Sprint Backlog** | CSV spreadsheet (`.csv`) | — |
| **Gap Analysis Report** | Integrated into Section 15 of BRD | — |

### Markdown & PDF Document — Requirements Document

Generate the primary `.md` file using the comprehensive enterprise template structure. **CRITICAL: You must provide a high level of detail for every section, matching professional enterprise documentation. Do NOT just output short bullet points.**

- **Title Page (page 1 — mandatory):** Use the `mahindra-cover` HTML div block from the Mahindra Theme section below. Place it immediately after the YAML front matter. Add `<div class="page-break"></div>` immediately after the closing `</div>` of the cover to force it onto its own page.
- **Document Info & Table of Contents (page 2 — mandatory):** Document metadata table (title, version, date, author, status, confidentiality), followed by the Table of Contents. Add `<div class="page-break"></div>` on its own line immediately after the `---` separator that closes the TOC, before Section 1 begins.
- **1. Executive Summary:** Detailed high-level project summary explaining the "Why" and "What".
- **2. Project Overview:** Deep dive into Background, Project Vision, and Technology Stack (in a tabular format: Layer, Technology, Version, Purpose).
- **3. Business Objectives:** Detailed target outcomes with measurable metrics.
- **4. Scope of the Project:** Detailed lists of In Scope and Out of Scope items.
- **5. Stakeholders:** Roles, Interest/Responsibility tabular mapping.
- **6. Functional Requirements:** **Group FRs by Logical Modules (e.g., 6.1 Authentication, 6.2 Admin Module).** Use a table format (`Req. ID | Requirement Description | User Story Narrative | Priority`) within each module. The User Story Narrative MUST be in the exact format: *"As a [role], I want [goal/action], So that [benefit/value]."*
- **7. Non-Functional Requirements:** Group into 7.1 Performance, 7.2 Security, 7.3 Availability & Reliability, 7.4 Usability with tables containing (`Req. ID | Requirement | Target`).
- **8. System Architecture:** Detail the Presentation Tier, Application Tier, and Data Tier explicitly. Provide an API Endpoint Reference table (`Endpoint | Method | Authorisation | Description`).
- **9. Data Requirements:** Include 9.1 Core Data Entities (table), 9.2 Data Retention Policy, 9.3 Development/UAT Seed Data.
- **10. Security Requirements:** Include 10.1 Authentication Security, 10.2 Authorisation Security, 10.3 Data Security.
- **11. Integrations:** Current State and Future Integration Roadmap with Prioritised descriptions.
- **12. Assumptions & Constraints:** Explicitly separate Assumptions and Constraints.
- **13. Risks & Mitigation:** Risk impact matrix (`Risk | Likelihood | Impact | Mitigation Strategy`).
- **14. Glossary:** Definitions of key terms and acronyms used.
- **15. Gap Analysis:** Detailed summary of missing requirements, ambiguities, conflicts, and risks.
- **Document Approval:** Sign-off block with Name, Role, Signature, and Date columns.

### Mahindra Theme Requirement for BRD Markdown

> ⚠️ **CRITICAL — NON-NEGOTIABLE:** The three elements below (YAML front matter, cover block, page-break div) MUST appear in every generated BRD markdown file. Omitting any one of them will cause the PDF to render incorrectly. You MUST NOT skip or omit them regardless of context or brevity.

**Element 1 of 3 — YAML Front Matter** (must be the absolute first bytes in the file, before any HTML or markdown).

This sets the PDF document title so Acrobat Reader shows the project name in its tab instead of `localhost:<port>`:

```yaml
---
title: "[PROJECT-NAME] — Business Requirements Document"
---
```

**Element 2 of 3 — Cover Block** (place immediately after the YAML front matter closing `---`).

Replace `[PROJECT-NAME]`, `[VERSION]`, and `[DATE]` with actual values. Copy this block verbatim:

```html
<div class="mahindra-cover">
   <div class="mahindra-cover-top">
      <span class="mahindra-header-redline" aria-hidden="true"></span>
      <span class="mahindra-wordmark">mahindra</span>
      <span class="mahindra-logo" aria-label="Mahindra Rise"></span>
   </div>
   <p class="mahindra-cover-kicker">A Secure Requirements Baseline <span class="accent">Starts With Clarity</span></p>
   <div class="mahindra-cover-panel">
      <h2>[PROJECT-NAME] BRD</h2>
      <p>Business Requirements Document</p>
   </div>
   <p class="mahindra-cover-meta">Version: [VERSION] | Date: [DATE] | Prepared by: Requirements Agent</p>
</div>
```

**Element 3 of 3 — Page Break After TOC** (place immediately after the `---` separator that closes the Table of Contents, before Section 1 begins).

This pushes the document body to start on page 3, leaving page 2 as the TOC-only page:

```html
<div class="page-break"></div>
```

Theme intent to preserve:
- Mahindra header treatment with logo and top-left red line
- Body copy in Calibri 11pt
- Headings in Arial 14pt
- Mahindra red accents for emphasis and key labels

Once the Markdown is generated, compile it into a beautifully styled PDF by explicitly executing this node command:
```bash
npx -y md-to-pdf --config-file .agents/assets/mahindra-brd.config.js --stylesheet .agents/assets/mahindra-brd.css [path_to_generated_md_file]
```

> **Note:** `--config` sets the running page header (red accent + Mahindra logo) and footer (page numbers) via `mahindra-brd.config.js`. `--stylesheet` applies body/heading typography.

Theme validation is informational (non-blocking):
- Confirm running page header shows red vertical bar, "mahindra" wordmark on the left, and the Mahindra Rise logo on the right
- Confirm all section headings use Cambria red 14pt (not Arial or navy)
- Confirm body text uses Calibri 11pt
- Confirm footer shows page n / total on every page
- Confirm the cover block renders on page 1 as the title page (page 1 only — no body content on this page)
- Confirm the Table of Contents is on page 2 alone (no body content starts on the TOC page)
- Confirm body content starts on page 3 (Executive Summary is the first section)
- Confirm the PDF tab/title in Acrobat Reader shows the project name (from YAML front matter `title:`)
- If any of the 3 mandatory elements (YAML front matter, cover block, page-break div) are missing, this is a **blocking error** — do not present the artifacts to the user until corrected

### CSV Spreadsheets — User Stories, Acceptance Criteria, Sprint Backlog

Generate `.csv` files natively.

**User Stories CSV** — Columns:
`Story ID,Epic,Title,Narrative,Role,Goal,Benefit,Priority,Size,Story Points`

**Acceptance Criteria CSV** — Columns:
`Story ID,Scenario Name,Given,When,Then,Type (Happy/Edge/Error)`

**Sprint Backlog CSV** — Columns:
`Sprint,Story ID,Title,Priority,Size,Story Points,Dependencies,Status`

### Instructions

1. Determine the **output directory** as follows:
   - Infer `<app-name>` from the project root folder name (e.g., if the root is `es-portal/`, the app name is `es-portal`).
   - Default output path: `./<app-name>-artifacts/requirements/`
   - Create the directory if it does not exist.
   - If the user explicitly provides a different path, use that instead.
2. Generate all the `.md` and `.csv` files natively into the directory.
3. Automatically execute the `md-to-pdf` compilation script to lock the markdown into the branded PDF.
4. Present file paths to the user and confirm all artifacts are generated.

### Output File Naming Convention

```
[project-name]_requirements_[YYYY-MM-DD].md
[project-name]_requirements_[YYYY-MM-DD].pdf
[project-name]_user_stories_[YYYY-MM-DD].csv
[project-name]_acceptance_criteria_[YYYY-MM-DD].csv
[project-name]_sprint_backlog_[YYYY-MM-DD].csv
```

> **⚠️ Downstream requirement:** The Acceptance Criteria CSV must contain Gherkin-format scenarios (Given/When/Then columns populated). The Testing Agent uses this file directly to derive Cypress E2E test cases — plain-English descriptions cannot be mapped to test code. Verify all rows have complete Given, When, Then fields before saving.

---

## Orchestrator Write-Back

> **If invoked via the Orchestrator:** Skip this section — the orchestrator handles all state updates itself.
> **If invoked directly:** Run this section after all other steps are complete to keep shared state current.

### 1. Locate State Files

Search for:
- `./<app-name>-artifacts/orchestrator/project_status.md`
- Any `*-artifacts/orchestrator/project_status.md` in the working tree

If not found, skip — the orchestrator has not been initialised for this project.

### 2. Write handoff file

Write `<app-name>-artifacts/orchestrator/handoffs/requirements-S{N}.md` using this schema:

```markdown
# Handoff: Requirements → Design — S[N] — [YYYY-MM-DD]
Sprint: [N] | Stories: [total] (Must: [N], Should: [N], Could: [N])
AC coverage: [N]/[N] stories have ≥2 Gherkin scenarios
Security NFRs: [N] identified — data classification required: [yes/no]
High-impact gaps resolved: [N] | Deferred: [N]
Artifacts: requirements/[list key files]
```

### 3. Update `project_status.md`

- Set **Requirements** row Phase Status to `⏸️ Awaiting Review`; set Handoff File column to `handoffs/requirements-S{N}.md`
- Append new stories to Sprint Backlog table (Dev/Test/SOC columns all `⬜`)
- Set `Active Sub-Workflow` to `none`
- Update `Last Updated` timestamp

### 4. Update `app-context.md` → Section 1: Business Domain only

- Add any new user roles discovered to the Roles table
- Add new business rules — prefix with sprint number: `BR-S{N}-XXX`
- Update Scope Boundaries if the sprint changed what is in/out of scope
- Do **not** touch Sections 2, 3, or 4

> **Note:** `app-context.md` is read-only for the next phase (Design). Do not pass the full ACD to Design — pass only the handoff file. The orchestrator will load `app-context.md` Sections 2 and 4 for the Design phase separately.
