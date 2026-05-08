---
description: "DevOps Bootstrap — Use when: creating Azure DevOps repositories, pushing code to develop, scaffolding azure-pipelines.yml CI/CD pipeline YAML, creating pipeline objects, setting up variable groups (dev/prod), configuring branch protection policies, or onboarding a new application into the organisation's existing Azure DevOps infrastructure."
---

# DevOps Bootstrap Agent

This workflow onboards a newly developed application into the organisation's existing Azure DevOps setup — from creating repositories and pushing code, through to live pipelines backed by variable groups.

> **Assumption:** Org-wide infrastructure (agent pools, service connections, Snyk, Checkmarx) already exists. This agent integrates with it — it does not provision it. If org infrastructure needs to be created first, run the DevOps Infrastructure Setup agent before this one.

---

## Entry Gate Check

Run this before anything else. If any hard gate fails, halt and list what is missing. Do not proceed to the Prerequisite or any subsequent step.

### Infer app name and artifact path
Derive `<app-name>` from the project root folder name, or find an existing `*-artifacts/` directory in the working tree.

### Hard gates (all must pass)

| Check | How to verify | Failure message |
|---|---|---|
| SOC Review passed | `<app-name>-artifacts/soc-review/*_code_review_*.md` exists AND contains verdict `✅ Approved` or `⚠️ Approved with comments` | "No passing SOC Review found. Code must pass review before DevOps bootstrap." |
| `SECURITY.md` present | File exists at `<app-name>-artifacts/design/SECURITY.md` | "`SECURITY.md` missing. Run the Design workflow first — it generates this file at `design/SECURITY.md`." |
| `azure-pipelines.yml` present | File exists at repo root | "`azure-pipelines.yml` not found. Scaffold the pipeline file before running this workflow." |
| No hardcoded secrets | Quick scan: no patterns matching `password\s*=`, `secret\s*=`, `api_key\s*=` as string literals in committed files | "Potential hardcoded secret detected in [file]. Resolve before pushing to Azure DevOps." |
| Azure DevOps PAT available | User confirms PAT exists in a local env var or has it ready to paste | "Azure DevOps PAT required. Set it in a local environment variable before proceeding." |

### State file cross-check (if present)
If `project_status.md` exists:
- SOC Review row must be `✅ Done`. If `🔁 Needs Rework`:
  > _"project_status.md shows SOC Review as Needs Rework. Resolve all review findings before DevOps bootstrap."_ This gate **cannot be overridden** — no override protocol applies here.
- Azure DevOps Config section: if org/project are already populated, confirm reuse or ask if creating a new repo.

### Context load
If `app-context.md` exists:
- Read Section 3 (Security Posture → Guardrails Compliance). All six checks must be ✅ before proceeding. If any are ⬜ or missing, surface them as blockers.
- Read Section 4 (Decision Log). Check for any pipeline architecture decisions already made (e.g., template repo path, agent pool name).

### Override protocol
**SOC Review gate cannot be overridden.** For all other gates:
> _"Type `confirm override: [your reason]` to bypass this gate. The override will be logged in project_status.md."_
Record the override in `project_status.md` → Open Decisions table before continuing.

---

## Prerequisite: Load Technology Skills

**Before starting any step**, detect the application's stack and load the corresponding technology skill files.

### Instructions

1. Scan the codebase roots for stack indicators:
   - `angular.json` or `package.json` with `@angular/core` or `next` → frontend JavaScript application
   - `*.csproj` or `*.sln` → .NET backend
2. Load the relevant skill file(s):
   - `.agents/skills/angular-frontend/SKILL.md`
   - `.agents/skills/dotnet-backend/dotnet-core.md`
   - `.agents/skills/devops-azure-cicd/SKILL.md`
   - `.agents/skills/security-guardrails/guardrails-core.md` — CI/CD quality gates, VAPT remediation SLA, tool integration requirements (Semgrep, Snyk, Gitleaks, OWASP ZAP), and deployment block conditions
3. All repository, git, and pipeline work must follow the DevOps skill. All security tooling and gate definitions must follow the Security Guardrails skill.

---

## Bootstrap State and Resume Protocol

### On every run — check for existing state first

Before executing any step, look for a checkpoint file:
- Path: `<app-name>-artifacts/devops/bootstrap-state.md`

**If found:**
1. Read it completely.
2. Show the user the step completion table:
   > _"Existing bootstrap state found. Steps 1–5 complete. Step 6 failed: [error]. Resume from Step 6?"_
3. If user confirms resume: load Collected Inputs from the state file (do not re-ask intake questions), skip all ✅ Done steps, start executing from the first non-Done step.
4. If user wants to start fresh: warn that this re-runs everything, ask for explicit confirmation, then create a new state file.

**If not found:**
Create a new `bootstrap-state.md` now using the schema below. Save to `<app-name>-artifacts/devops/`. All steps start as ⬜ Not run.

### Idempotency rule (applies to every step)

Before executing any step's Instructions, check the `bootstrap-state.md` table:
- `✅ Done` → skip this step's Instructions entirely, log "skipped (already done)", proceed to the next step.
- `🔴 Failed` → this is the resume point. Execute the step's Instructions.
- `⬜ Not run` → execute the step's Instructions.

After each step completes successfully, immediately update `bootstrap-state.md`: set the step to `✅ Done` with the current timestamp and any relevant output (e.g., repo IDs, pipeline IDs). Do this before moving to the next step — if the process is interrupted, the checkpoint captures what was done.

### Per-step idempotency checks

These checks run inside each step's Instructions before making any API call or git operation:

| Step | Check Before Acting | If Already Exists |
|---|---|---|
| 5 — Repo creation | `GET _apis/git/repositories` — check if repo name exists | Skip `POST`, use existing repo ID. Still verify `develop` branch exists and push if needed. |
| 5 — Git push | `git ls-remote azure develop` — check if branch exists with commits | Skip push if remote already has commits on `develop`. |
| 5.5 — Branch policies | `GET _apis/policy/configurations?repositoryId=<id>` — check if policy type already applied | Skip `PATCH` for that policy type. Apply only missing policies. |
| 6 — Pipeline YAML | Check if `azure-pipelines.yml` exists in repo root (read from remote) | Skip scaffolding. Verify content matches expected template — flag if it differs. |
| 7 — Pipeline objects | `GET _apis/pipelines` — check if pipeline name exists | Skip `POST`. Use existing pipeline ID. `PATCH` only if template reference or parameters differ. |
| 8 — Variable groups | `GET _apis/distributedtask/variablegroups?groupName=<name>` — check if group exists | Skip `POST`. `PATCH` to add or update individual variables. Never delete existing variables. |
| 9 — Variable binding | Already handled by idempotent pipeline template — verify linkage only | No create needed. Verify and flag if group not accessible. |

### `bootstrap-state.md` schema

```markdown
# Bootstrap State — <app-name>
**Created:** YYYY-MM-DD HH:MM
**Last Updated:** YYYY-MM-DD HH:MM

## Step Completion

| Step | Name | Status | Completed At | Notes |
|---|---|---|---|---|
| 1 | Intake | ⬜ Not run | — | — |
| 2 | Prerequisite Validation | ⬜ Not run | — | — |
| 3 | Stack Detection | ⬜ Not run | — | — |
| 4 | Bootstrap Plan | ⬜ Not run | — | — |
| 5 | Repository Creation and Git Push | ⬜ Not run | — | — |
| 5.5 | Branch Protection Policies | ⬜ Not run | — | — |
| 6 | Pipeline YAML Scaffolding | ⬜ Not run | — | — |
| 7 | Pipeline Object Creation | ⬜ Not run | — | — |
| 8 | Variable Group Creation | ⬜ Not run | — | — |
| 9 | Pipeline-to-Variables Binding | ⬜ Not run | — | — |
| 10 | Verification | ⬜ Not run | — | — |
| 11 | Output Summary | ⬜ Not run | — | — |

_Status values: ⬜ Not run · ✅ Done · 🔴 Failed · ⏭ Skipped (already existed)_

## Collected Inputs
_Populated during Step 1 intake. Reused on resume — do not re-ask if present._

- **Org URL:** —
- **Project:** —
- **Frontend repo name:** —
- **Backend repo name:** —
- **Frontend local path:** <app-name>-artifacts/development/<app-name>-ai/<app-name>-frontend/
- **Backend local path:** <app-name>-artifacts/development/<app-name>-ai/<app-name>-backend/
- **Remote name:** azure
- **Target branch:** develop
- **Build agent pool:** —
- **Frontend pipeline ID:** — _(populated after Step 7)_
- **Backend pipeline ID:** — _(populated after Step 7)_
- **Dev variable group ID:** — _(populated after Step 8)_
- **Prod variable group ID:** — _(populated after Step 8)_

## Failure Detail
_Updated when any step fails. Cleared when the step is retried successfully._

- **Failed Step:** —
- **Error:** —
- **REST Response:** —
- **Resolution:** —
```

---

## Step 1: Intake

Collect all inputs required for the full bootstrap in one go — repository setup, pipeline wiring, and variable group values.

### Repository Inputs

| Input | Description |
|---|---|
| Azure DevOps organization URL | Example: `https://dev.azure.com/<org>` |
| Azure DevOps project name | Target project containing the repos |
| PAT token | Required for all REST API calls |
| Template repository path | Example: `SharedProject/Pipeline-Templates` |
| Frontend local path | Optional if only backend exists |
| Backend local path | Optional if only frontend exists |
| Repo names | Default to `<app>-frontend` and `<app>-backend` |
| Target branch | Default `develop` |
| Remote name | Default `azure` to avoid overwriting an existing `origin` |

### Pipeline & Variable Group Inputs

These values come from the organisation's existing DevOps infrastructure. Collect them upfront.

| Input | Scope | Notes |
|---|---|---|
| `buildAgentPool` | Org-wide | Name of the shared build agent pool |
| `snykServiceConnection` | Org-wide | Service connection name for Snyk SCA |
| `snykToken` | Org-wide | Snyk API token — will be stored as secret |
| `skipSecurityScan` | Per app | `true` for dev environment, `false` for prod |
| `checkmarxServiceConnection` | Org-wide | Service connection name for Checkmarx |
| `checkmarxProjectName` | Per app | Project name registered in Checkmarx |
| `checkmarxPreset` | Org-wide | Preset name configured in Checkmarx |
| `azureServiceConnection` | Per project | Azure Resource Manager service connection |
| `webappName` | Per app/env | Azure Web App name for deployment target |
| `apiUrl` | Frontend per env | Base API URL consumed by frontend environment files |
| `aspnetcoreEnvironment` | Backend per env | `Development` or `Production` value for App Service setting |
| `virtualDirectory` | Backend only | Virtual directory path for IIS deployment (e.g. `gyro`) |

> **If `webappName`, `apiUrl`, `aspnetcoreEnvironment`, or `virtualDirectory` are not yet known** (Azure Web App not provisioned), use `PLACEHOLDER` as the value. The variable group will be created with a placeholder and the user must update it before the first production deployment.

> **Pipeline variable names ≠ ASP.NET Core config keys.** Variable group names like `jwtSecret` and `dbConnectionString` do not automatically map to ASP.NET Core configuration. The pipeline template must use an `AzureAppServiceSettings@1` task to write the correct keys. Verify the following App Settings are set on the App Service with **double-underscore** (`__`) as the hierarchy separator:
>
> | App Setting Key | Source Variable | Notes |
> |---|---|---|
> | `ASPNETCORE_ENVIRONMENT` | `aspnetcoreEnvironment` | Required — if missing, app defaults to `Production` and placeholder config values are used |
> | `Jwt__Secret` | `jwtSecret` | Maps to `Jwt:Secret` in .NET config |
> | `ConnectionStrings__DefaultConnection` | `dbConnectionString` | Maps to `ConnectionStrings:DefaultConnection` |
>
> If `AzureAppServiceSettings@1` is not in the pipeline template, these must be set **manually in Azure Portal** → App Service → Configuration → Application settings.

### Instructions

1. Ask the user for all repository inputs.
2. Ask the user for pipeline and variable group values. Confirm which are already known org-wide and which are app-specific.
3. If repo names are not provided, derive them from the application name.
4. Confirm whether the user wants a split-repo model or a single repository model.
5. Confirm the full set of collected values with the user before proceeding.

---

## Step 2: Prerequisite Validation

Validate the environment before touching git remotes or Azure DevOps.

### Validation Checklist

- PAT token has the required Azure DevOps scopes (Code, Build, Variable Groups)
- Git is installed
- Local codebase paths exist
- Pipeline template repository path is known and accessible
- The local codebase does not contain secrets, generated build outputs (`node_modules`, `bin`, `obj`, `dist`), or missing `.gitignore` files
- The `.gitignore` in each codebase covers all patterns mandated by the Security Guardrails skill (`DATA_SECURITY_CONTROLS — Secrets Management`): `.env`, `.env.*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `appsettings.Production.json`, `secrets.json`, `**/secrets/**`
- `SECURITY.md` exists at `<app-name>-artifacts/design/SECURITY.md` (Design phase output — not inside `development/`, `<app-name>-ai/`, the frontend, or the backend application folders)
- No forbidden cryptographic or injection patterns are present in committed code (run a quick Gitleaks scan if the tooling is available)

### Instructions

1. Build the API auth header from the PAT using Basic auth.
2. Validate PAT and project access: `GET _apis/projects/<project-name>`.
3. Verify the template repository is accessible: `GET _apis/git/repositories` — confirm the shared template repo exists.
4. Verify each local codebase path exists and contains the expected stack files.
5. Verify `.gitignore` exists in each codebase before the first push. Check that it includes every pattern from the Security Guardrails skill `DATA_SECURITY_CONTROLS — Secrets Management` section. If any pattern is missing, add it and commit before continuing.
6. Verify `SECURITY.md` exists at `<app-name>-artifacts/design/`. If absent, generate it now using the `SECURITY.md` template in `guardrails-docs.md` (`SECURITY.md Template` section). Note: this file is a Design phase output and lives in `design/` — it is **not** inside `development/`, `<app-name>-ai/`, the frontend, or the backend, and is not committed into either application repo.
7. Stop and ask the user before proceeding if secrets or generated artifacts are detected.

---

## Continue Execution

After completing Steps 1 and 2, read `.agents/workflows/devops-steps.md` and execute Steps 3–11 in sequence. That file also contains Recovery Procedures and the Orchestrator Write-Back section.
