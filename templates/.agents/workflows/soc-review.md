---
description: "SOC Review — Use when: reviewing code for quality, security vulnerabilities (OWASP Top 10), performance issues, or best practices compliance; auditing a PR or file diff; checking for forbidden patterns; verifying security guardrails compliance (SECURITY.md, THREAT_MODEL.md, assets.md); or generating a structured code review report with severity ratings (Critical/Major/Minor)."
---

# SOC Review Agent

This workflow performs a structured code review on new or modified code, checking for quality, security vulnerabilities, performance issues, and adherence to best practices.

> **Expectation for code built by the `/development` agent:** The development agent implements OWASP standards as a first-class requirement during code construction. When reviewing code produced by `/development`, security and performance findings should be **minimal** — this review is a compliance verification pass, not a remediation exercise. A high number of findings on `/development` output indicates the development agent's OWASP checklist was not followed and should be treated as a process issue, not just a code issue.

---

## Step 0: MANUAL-MOD Detection (Priority Pre-Check)

Run BEFORE the Entry Gate. Cannot be skipped regardless of user-specified review scope.

### Instructions
1. Scan ALL source files in scope for the tag `[MANUAL-MOD]`
2. For each occurrence: read surrounding 10 lines and classify — **SAFE** | **RISKY** | **CRITICAL**
3. Auto-classify as **CRITICAL** if the manual edit touches any of:
   - Authentication / authorization code
   - Cryptography or token handling
   - Middleware pipeline registration order
   - Data access / query construction
   - Security headers configuration
4. Untagged manual edits found = **Major** finding (missing traceability convention)
5. Record all findings in the MANUAL-MOD table in the Step 6 report
6. Any CRITICAL manual mod → surface to user immediately before proceeding

> **Developer convention:** Tag every post-AI manual edit as:
> `// [MANUAL-MOD] <reason> — <YYYY-MM-DD> — <author>`

---

## Entry Gate Check

Run this before anything else. If any hard gate fails, halt and list what is missing. Do not proceed to the Prerequisite or any subsequent step.

### Infer app name and artifact path
Derive `<app-name>` from the project root folder name, or find an existing `*-artifacts/` directory in the working tree.

### Hard gates (all must pass)

| Check | How to verify | Failure message |
|---|---|---|
| Review scope specified | User has named a branch, PR, or list of files to review | "Specify what to review: branch name, PR number, or file paths." |
| Implementation summary exists | `<app-name>-artifacts/development/*_implementation_summary_*.md` exists for the active story | "No implementation summary found for [US-XXX]. Development workflow must complete before SOC Review." |
| Test summary exists | `<app-name>-artifacts/testing/*_test_summary_[US-XXX]_*.md` exists for the active story | "No test summary found for [US-XXX]. Testing workflow must complete and all coverage gates must pass before SOC Review." |
| Acceptance criteria available | `<app-name>-artifacts/requirements/*_acceptance_criteria_*.csv` contains rows for the active story | "Acceptance criteria for [US-XXX] not found — needed to verify implementation completeness." |
| Design reference available | `<app-name>-artifacts/design/` contains API contracts and schema | "Design artifacts missing — needed to cross-check implementation against intended design." |

### State file cross-check (if present)
If `project_status.md` exists:
- **Development** row must be `✅ Done`. If not `✅ Done`:
  > _"project_status.md shows Development as [status] for [US-XXX]. Development must be complete before SOC Review."_
- **Testing** row must be `✅ Done`. If not `✅ Done`:
  > _"project_status.md shows Testing as [status] for [US-XXX]. Testing must pass all coverage gates before SOC Review — tests are a prerequisite for a meaningful security review."_

### Context load
If `app-context.md` exists:
- Read Section 3 (Security Posture). Data classification tells you which entities require heightened scrutiny during security checks. Open Security Findings shows known issues to re-verify.
- Read Section 2 (Technical Inventory). Use it to cross-check that implemented API endpoints match the designed surface — deviations are a review finding.

### Override protocol
If the user explicitly instructs proceeding despite a failed gate:
> _"Type `confirm override: [your reason]` to bypass this gate. The override will be logged in project_status.md."_
Record the override in `project_status.md` → Open Decisions table before continuing.

---

## Prerequisite: Load Technology Skills

**Before starting the review**, detect the project's tech stack and load the corresponding skill files.

### Instructions

1. Detect the tech stack from the codebase:
   - `angular.json` or `@angular/core` in `package.json` → **Angular project**
   - `*.csproj` or `*.sln` → **.NET Core project**
   - Both → **Full-stack** (load both)
2. Load the matching skill file(s):
   - `.agents/skills/angular-frontend/SKILL.md` — Angular conventions to validate against
   - `.agents/skills/dotnet-backend/dotnet-core.md` — .NET Clean Architecture conventions to validate against
   - `.agents/skills/dotnet-backend/dotnet-infrastructure.md` — data access, DB, and deployment conventions to validate against
   - `.agents/skills/security-guardrails/guardrails-core.md` — mandatory rules, NIST CSF controls, forbidden patterns, data classification, dependency governance, and VAPT remediation SLA
   - `.agents/skills/security-guardrails/guardrails-owasp.md` — CIS Level 1 hardening standards and OWASP A01–A10 enforcement rules (the primary review checklist)
3. **Use the loaded skill(s) as the review baseline.** Code that violates skill standards should be flagged as **Major** issues. Specifically check:
   - Project structure matches skill-defined layout
   - Naming conventions follow skill rules (Angular selectors, .NET naming)
   - Architecture patterns are followed (Clean Architecture layers, standalone components)
   - State management uses the correct tier (Signals, not BehaviorSubject)
   - Testing follows skill standards (Jest for Angular, coverage targets)
   - Data access uses correct patterns (EF Core for writes, Dapper for reads)
   - Security posture satisfies `guardrails-core.md` + `guardrails-owasp.md` — these guardrails files define the security pass/fail threshold for this review (see Step 3)

---

## Step 1: Diff Analysis

Identify what changed and establish review scope.

### Instructions

1. Ask the user: *"What should I review? (File path, directory, git diff, or PR description)"*
2. Identify all files changed and categorize them:

| Category | Examples |
|---|---|
| **Schema/Models** | `schema.prisma`, migration files, type definitions |
| **API/Backend** | Route handlers, middleware, server utilities |
| **Frontend/UI** | Pages, components, hooks, styles |
| **Config** | `package.json`, env files, build config |
| **Tests** | Test files, test utilities, fixtures |

3. Determine review context:
   - Is this a new feature, bug fix, refactor, or dependency update?
   - What user story or issue does this relate to?
   - Are there related files NOT changed that should have been?
4. Generate a **change summary** before deep review.

### Change Summary Format

```markdown
### Change Summary
- **Type:** Feature | Bug Fix | Refactor | Config | Dependency Update
- **Files Changed:** [count]
- **Lines Added:** [+count] | **Lines Removed:** [-count]
- **Risk Level:** Low | Medium | High
- **Areas Affected:** [Backend, Frontend, Database, Auth, etc.]
```

---

## Step 2: Code Quality Review

Assess code for readability, maintainability, and adherence to project conventions.

### Checklist

| Area | What to Check |
|---|---|
| **Naming** | Variables, functions, files follow **skill-defined** naming conventions (Angular: company prefix selectors, kebab-case files; .NET: PascalCase classes, `_camelCase` fields, `I` prefix interfaces, `Async` suffix) |
| **Structure** | Functions are focused (single responsibility); files aren't too long; **folder structure matches skill** (Angular: `core/features/shared`; .NET: Clean Architecture layers) |
| **DRY** | No duplicated logic; shared code is extracted into utilities |
| **Types** | TypeScript types are explicit; no `any` types; interfaces are well-defined; .NET uses records for DTOs |
| **Comments** | Complex logic is documented; no commented-out code; JSDoc on public APIs |
| **Dead Code** | No unused imports, variables, or functions |
| **Consistency** | Code style matches **loaded skill standards** — flag deviations |
| **Error Handling** | All async operations have try/catch; errors are logged and handled gracefully; .NET uses global exception handler per skill |
| **Magic Values** | No hardcoded strings/numbers; use constants or enums |
| **Complexity** | No deeply nested logic (>3 levels); complex conditions are extracted |
| **Skill Compliance** | Angular: standalone components, Signals-first state, reactive forms only, SCSS. .NET: FluentValidation (not data annotations), MediatR CQRS, Serilog logging |

### Severity Levels

| Level | Icon | Meaning |
|---|---|---|
| **Critical** | 🔴 | Must fix before merge — bugs, security issues, data loss risk |
| **Major** | 🟠 | Should fix — significant quality/maintainability concern |
| **Minor** | 🟡 | Nice to fix — style, naming, minor improvement |
| **Suggestion** | 🔵 | Optional — alternative approach, optimization idea |
| **Positive** | 🟢 | Well done — good patterns to highlight and encourage |

### Output Format

```markdown
**[SEVERITY] [File:Line] — [Brief Title]**
> [Code snippet or reference]

**Issue:** [What's wrong]
**Suggestion:** [How to fix]
**Why:** [Impact if not fixed]
```

---

## Step 3: Security Review (OWASP Top 10 · 2025)

Check for common security vulnerabilities based on OWASP Top 10 (2025 taxonomy).

> **Review Baseline:** The loaded `guardrails-core.md` and `guardrails-owasp.md` are the authoritative security standard for this review. The OWASP checklist below maps directly to that skill's `OWASP TOP 10 — ENFORCEMENT RULES` section. For each finding, cross-reference the relevant guardrails section to confirm whether the violation is a deviation from the guardrails baseline (flag as **Critical**) or an unaddressed risk not covered by the baseline (flag as **Major** and recommend a guardrails update). Additionally check the `FORBIDDEN PATTERNS` section of the guardrails skill — any forbidden pattern present in the reviewed code is an automatic **Critical** finding.

### OWASP Checklist

> **Single source of truth:** The full A01–A10 enforcement rules, forbidden patterns, and remediation code examples live in `.agents/skills/security-guardrails/guardrails-owasp.md` → `## OWASP TOP 10 — ENFORCEMENT RULES`. Use that section as the review checklist. The table below is a quick-reference prompt; the guardrails skill is the binding pass/fail specification.

| # | Vulnerability | Review signal (see guardrails skill for full rule and remediation) |
|---|---|---|
| A01 | **Broken Access Control** | `[Authorize]` on every endpoint; role/policy checks present; no IDOR (sequential IDs on sensitive resources) |
| A02 | **Cryptographic Failures** | Passwords BCrypt-hashed; no secrets or keys in source; HTTPS enforced; sensitive fields not returned in responses |
| A03 | **Injection** | EF Core LINQ or parameterised Dapper only; no string concatenation into SQL/LDAP/shell; no `eval()` |
| A04 | **Insecure Design** | Rate-limiting present; account lockout configured; no mass-assignment vulnerabilities |
| A05 | **Security Misconfiguration** | Secure headers present (see DAST list); CORS not `AllowAnyOrigin`; Swagger/debug disabled in Production |
| A06 | **Vulnerable Components** | `dotnet list package --vulnerable` clean; `npm audit` clean; no outdated packages with known CVEs |
| A07 | **Auth Failures** | JWT `ValidateLifetime = true`; tokens short-lived; refresh rotation in place; no credential exposure in logs |
| A08 | **Data Integrity Failures** | FluentValidation enforced via pipeline; strict JSON deserialization; CSP header present |
| A09 | **Logging Failures** | Security events logged; no PII, passwords, tokens, or connection strings in log output |
| A10 | **SSRF** | No user-controlled URLs passed to `HttpClient`; outbound domain allowlist in config |

### Additional Security Checks

| Area | What to Check |
|---|---|
| **XSS Prevention** | User input escaped before rendering; no `dangerouslySetInnerHTML` with user data |
| **CSRF Protection** | Anti-CSRF tokens on state-changing requests |
| **File Upload** | File type validation; size limits; no executable uploads; secure storage |
| **Headers** | `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security` |
| **SQL/NoSQL Injection** | ORM used correctly; no raw query interpolation |

### Instructions

1. Scan every file for the OWASP checklist items above.
2. Flag any vulnerability found with **Critical** severity.
3. Provide specific remediation code for each vulnerability. Where the guardrails skill contains a ready-made secure alternative (e.g. the `HashPassword` pattern for A02, the SSRF allowlist pattern for A10), reference or quote that pattern directly in the remediation guidance.
4. If a security concern requires architectural changes, note it separately.
5. After completing the OWASP checklist, run a secondary pass using the `FORBIDDEN PATTERNS` section of `guardrails-core.md` as a checklist. Any match is a **Critical** finding regardless of OWASP category.
6. Check for the mandatory documentation artifacts: `SECURITY.md`, `THREAT_MODEL.md`, and `assets.md`. If any are absent, flag as a **Major** finding with remediation: "Generate using the templates in `guardrails-docs.md`."
7. In the Security Summary table in Step 6's report, add a `Security Guardrails Compliance` row with status `✅ Pass` (all forbidden patterns absent, all mandatory docs present) or `⚠️ Fail` (with count of violations).

### CWE Top 25 — Mandatory Weakness Checks

Second pass after OWASP. Each violation = automatic **Critical** finding. Add results as CWE rows in the Step 6 Security Summary.

| CWE | Weakness | What to Verify |
|---|---|---|
| CWE-79 | XSS | No `innerHTML = userInput`; no `bypassSecurityTrustHtml`; all dynamic content through Angular template binding |
| CWE-89 | SQL Injection | EF Core / parameterized Dapper only; no dynamic ORDER BY from user input; no string concat in any query |
| CWE-22 | Path Traversal | `Path.GetFullPath()` used and result verified against allowed base dir; no `../` traversal possible |
| CWE-434 | Unrestricted File Upload | Magic-number validation present; files stored outside web root; UUID rename applied; size limit enforced |
| CWE-502 | Insecure Deserialization | No `BinaryFormatter`; no `TypeNameHandling.All`; `System.Text.Json` strict settings; result validated before use |
| CWE-918 | SSRF | Outbound `HttpClient` calls validated against allowlist (verify `HashSet` exists in code, not just comments) |

### JWT / Token Lifecycle Audit

Verify token configuration matches `guardrails-core.md` Token Lifecycle standards. Any deviation = **Critical** finding.

| Check | Expected | How to Verify |
|---|---|---|
| Access token TTL | ≤ 15 minutes | `TokenValidationParameters`; `ClockSkew = TimeSpan.Zero` present |
| Refresh token TTL | ≤ 7 days | Refresh token issuance / expiry storage config |
| Single-use rotation | Refresh token invalidated on consumption | Token rotation logic in auth service |
| Reuse = family revocation | All session tokens for user revoked on reuse | Reuse detection branch — does it revoke entire family? |
| JWT secret source | Environment variable or Key Vault — never hardcoded | `IssuerSigningKey` initialization; no string literal keys |
| `ValidateIssuer` + `ValidateAudience` | Both `true` | `TokenValidationParameters` object |
| Refresh token storage | httpOnly cookie only — never localStorage | Angular auth service + .NET cookie config |

---

## Step 3b: ASVS Level 2 Compliance Verification

Evidence-based verification — PASS requires citing a specific file:line. FAIL = **Critical** finding. Add results as a separate ASVS table in Step 6.

| Chapter | Control | Verification |
|---|---|---|
| **V2 — Authentication** | Argon2id or bcrypt (work≥12); MFA present for admin roles; account lockout after 5 failures | Check `HashPassword` impl; check lockout config |
| **V3 — Session Management** | Tokens from cryptographically strong RNG; global logout invalidates ALL user sessions | Token generation; logout endpoint behaviour |
| **V4 — Access Control** | Least-privilege; every entity query has ownership check at service layer; no IDOR | `[Authorize(Policy/Roles)]` on every endpoint; service-layer ownership |
| **V5 — Input Validation** | Allow-list validation on all inputs; encoding before interpreter | Validators; Dapper/EF query construction |
| **V7 — Cryptography** | AES-256-GCM or RSA-4096; all secrets from Azure Key Vault — never inline | Crypto algorithm usage; `appsettings.json` inline secret scan |
| **V8 — Error Handling & Logging** | Security events logged (failed logins, auth failures) with timestamp + userId; zero PII in logs; no stack traces to API callers | Logger calls; exception middleware response body |
| **V12 — File/Resources** | Magic-number file type validation; files stored outside web root | Upload handler; storage path |

---

## Step 4: Performance Review

Identify performance bottlenecks and optimization opportunities.

### Checklist

| Area | What to Check |
|---|---|
| **Database Queries** | N+1 query problems; missing indexes; unoptimized joins; excessive data fetching |
| **API Response** | Pagination implemented for lists; unnecessary data not returned; proper caching headers |
| **Frontend Rendering** | Unnecessary re-renders; missing `useMemo`/`useCallback`; large bundle imports |
| **Async Operations** | Parallel execution where possible; proper loading states; cancellation on unmount |
| **Memory** | No memory leaks (event listeners cleaned up, subscriptions unsubscribed) |
| **Bundle Size** | Tree-shaking friendly imports; no full library imports for single function use |
| **Images/Assets** | Proper sizing; lazy loading; optimized formats (WebP) |
| **Caching** | Appropriate cache strategies; cache invalidation |

### Instructions

1. Look for the most impactful performance issues first.
2. Provide before/after code examples for suggested optimizations.
3. Estimate the impact (e.g., "reduces query count from N to 1", "saves ~200ms per page load").

---

## Step 5: Best Practices & Standards

Verify adherence to broader engineering standards.

### Checklist

| Area | What to Check |
|---|---|
| **Testing** | New code has corresponding tests; edge cases covered; test names are descriptive |
| **Accessibility** | Semantic HTML; ARIA labels on interactive elements; keyboard navigable; color contrast |
| **i18n Readiness** | No hardcoded user-facing strings (or flagged for future i18n) |
| **Responsive Design** | Works on mobile, tablet, desktop; no horizontal scrolling |
| **Git Hygiene** | Commits are logical and atomic; no unrelated changes mixed in |
| **License Compliance** | Scan new dependencies against `.agents/skills/security-guardrails/license-policy.json`; GPL-2.0, GPL-3.0, AGPL-3.0, SSPL-1.0 = **Critical** finding; LGPL / MPL = warning; unknown = warning + legal review required |
| **Dependency Freshness** | New dependencies justified; no duplicate functionality; `npm audit` / `dotnet list package --vulnerable` clean; no packages EOL per version table in `guardrails-core.md` |
| **Documentation** | New features documented; breaking changes noted; API docs updated |
| **Environment** | No hardcoded environment values; proper env var usage; no secrets committed |

---

## Step 6: Review Summary Report

Compile all findings into a structured report.

### Report Format

```markdown
# Code Review Report

**Date:** [YYYY-MM-DD]
**Reviewer:** AI Code Review Agent
**Change Type:** [Feature | Bug Fix | Refactor]
**Related Story:** [US-xxx or issue reference]
**Codebase State:** [git commit hash or last-modified timestamp]

## Summary
[1–2 sentence overview of the review findings]

## Statistics
| Metric | Count |
|--------|-------|
| Files Reviewed | [N] |
| Critical Issues | [N] |
| Major Issues | [N] |
| Minor Issues | [N] |
| Suggestions | [N] |
| Positive Notes | [N] |

## Critical & Major Issues (Must Fix)
[Detailed findings with code and remediation]

## Minor Issues & Suggestions
[Detailed findings]

## Positive Highlights
[Well-written code, good patterns, things to keep doing]

## MANUAL-MOD Analysis
| File | Line | Tag Present | Assessment | Severity |
|------|------|-------------|------------|----------|

## OWASP Top 10 (2025) Results
| ID  | Category | Status | Evidence (File:Line) |
|-----|----------|--------|----------------------|
| A01 | Broken Access Control | ✅ Pass / ❌ Fail | |
| A02 | Cryptographic Failures | ✅ Pass / ❌ Fail | |
| A03 | Injection | ✅ Pass / ❌ Fail | |
| A04 | Insecure Design | ✅ Pass / ❌ Fail | |
| A05 | Security Misconfiguration | ✅ Pass / ❌ Fail | |
| A06 | Vulnerable Components | ✅ Pass / ❌ Fail | |
| A07 | Auth Failures | ✅ Pass / ❌ Fail | |
| A08 | Data Integrity Failures | ✅ Pass / ❌ Fail | |
| A09 | Logging & Monitoring Failures | ✅ Pass / ❌ Fail | |
| A10 | SSRF | ✅ Pass / ❌ Fail | |

## CWE Top 25 Results
| CWE | Weakness | Status | Evidence (File:Line) |
|-----|----------|--------|----------------------|
| CWE-79 | XSS | ✅ Pass / ❌ Fail | |
| CWE-89 | SQL Injection | ✅ Pass / ❌ Fail | |
| CWE-22 | Path Traversal | ✅ Pass / ❌ Fail | |
| CWE-434 | Unrestricted File Upload | ✅ Pass / ❌ Fail / N/A | |
| CWE-502 | Insecure Deserialization | ✅ Pass / ❌ Fail | |
| CWE-918 | SSRF | ✅ Pass / ❌ Fail | |

## ASVS Level 2 Results
| Chapter | Control | Status | Evidence (File:Line) |
|---------|---------|--------|----------------------|
| V2 | Authentication | ✅ Pass / ❌ Fail | |
| V3 | Session Management | ✅ Pass / ❌ Fail | |
| V4 | Access Control | ✅ Pass / ❌ Fail | |
| V5 | Input Validation | ✅ Pass / ❌ Fail | |
| V7 | Cryptography | ✅ Pass / ❌ Fail | |
| V8 | Error Handling & Logging | ✅ Pass / ❌ Fail | |
| V12 | File/Resources | ✅ Pass / ❌ Fail / N/A | |

## JWT / Token Lifecycle Results
| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Access token TTL | ≤ 15 min | | |
| Refresh token TTL | ≤ 7 days | | |
| Single-use rotation | Yes | | |
| Reuse = family revocation | Yes | | |
| JWT secret source | Key Vault / env var | | |
| ValidateIssuer + ValidateAudience | Both true | | |
| Refresh token storage | httpOnly cookie only | | |

## Security Guardrails Compliance
| Check | Status |
|-------|--------|
| Forbidden patterns absent | ✅ / ❌ |
| SECURITY.md present | ✅ / ❌ |
| THREAT_MODEL.md present | ✅ / ❌ |
| assets.md present | ✅ / ❌ |
| License compliance (no denied SPDX IDs) | ✅ / ❌ |

## Findings Register
| ID | Severity | Category | File | Line | Description | Remediation |
|----|----------|----------|------|------|-------------|-------------|

## Stage Gate Decision
- [ ] ✅ **APPROVED** — Zero Critical findings; all ASVS chapters pass
- [ ] ⚠️ **CONDITIONAL APPROVAL** — No Critical; High findings have documented remediation plan in tracker
- [ ] 🔴 **BLOCKED** — One or more Critical findings; deployment halted until resolved and re-reviewed
```

### Instructions

1. Compile findings from Steps 2–5.
2. Order by severity (Critical first).
3. Provide the verdict and overall assessment.
4. If **Changes Requested**, clearly list what must be fixed before re-review.
5. Determine the **output directory**:
   - Infer `<app-name>` from the project root folder name (e.g., if the root is `es-portal/`, the app name is `es-portal`).
   - Default output path: `./<app-name>-artifacts/soc-review/`
   - Create the directory if it does not exist.
   - If the user explicitly provides a different path, use that instead.
6. Save the report as markdown to the output directory and present to the user.

### Output File Naming Convention

```
[project-name]_code_review_[YYYY-MM-DD].md
```

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

Write `<app-name>-artifacts/orchestrator/handoffs/soc-review-S{N}-{US-XXX}.md` using this schema:

```markdown
# Handoff: SOC Review → DevOps — S[N] · [US-XXX] — [YYYY-MM-DD]
Story: [US-XXX] — [title]
Critical: [N] · Major: [N] · Minor: [N]
Security Guardrails: [✅ Pass / ⚠️ Fail]
Verdict: [Approved | Approved with comments | Changes Requested]
Acknowledged findings: [N — brief description | none]
Artifacts: soc-review/[review filename]
```

### 3. Update `project_status.md`

- Set the active story's **SOC** column in Sprint Backlog to `⏸️ Awaiting Review` (or `🔁 Needs Rework`)
- Set **SOC Review** row Phase Status to `⏸️ Awaiting Review` (or `🔁 Needs Rework`); set Handoff File to `handoffs/soc-review-S{N}-{US-XXX}.md`
- If Changes Requested: set **Development** row back to `🔁 Needs Rework`, add entry to Loop-Back Log with findings summary
- Set `Active Sub-Workflow` to `none`
- Update `Last Updated` timestamp

### 3. Update `app-context.md` → Section 3: Security Posture only

- **Guardrails Compliance table:** for each check that passed, set status to `✅` with today's date
- **Open Security Findings table:**
  - Close resolved findings: set status to `✅ Resolved`
  - Add any new findings that were acknowledged but not blocked: status `⚠️ Acknowledged — [rationale]`
  - Do not add Critical/Major findings here — those must be resolved before this table is updated
- Do **not** touch Sections 1, 2, or 4
