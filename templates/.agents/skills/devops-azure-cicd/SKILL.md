---
name: Azure DevOps CI CD Bootstrap
description: Azure DevOps bootstrap standards - create repos with main as default branch, push code to develop, scaffold pipeline YAML extending shared templates, create pipeline objects, wire variable groups, and enforce safe git and CI conventions against existing org infrastructure.
---

# Azure DevOps CI/CD Bootstrap Skill

When working on repository onboarding, Azure DevOps git remotes, bootstrap pipelines, or CI/CD scaffold files, **always follow these standards**.

---

## 1. Platform Standard

- Source control target: **Azure DevOps Repos**
- Pipeline style: **YAML pipelines**
- Template model: **shared template repository + repo-local `azure-pipelines.yml`**
- Default branch in Azure DevOps: **`main`** (set at repo creation so branch policies on `develop` do not block bootstrap pushes)
- Integration/working branch: **`develop`** (all code and pipeline YAML is pushed here)
- Default remote name for Azure DevOps: **`azure`**

### Rules

- Do **not** overwrite an existing `origin` remote unless the user explicitly asks.
- Do **not** force-push bootstrap commits.
- When creating a repo via REST API, always set `defaultBranch: refs/heads/main` in the request body so that `main` becomes the default and branch policies apply there, not on `develop`.
- Always push bootstrap code and pipeline YAML to the `develop` branch — never to `main`.
- Prefer a split-repo model for full-stack apps:
  - `<app>-frontend`
  - `<app>-backend`
- Use a single repo only when the user explicitly wants a monorepo.

---

## 2. Repository Bootstrap Rules

### Required Preconditions

- Azure CLI installed
- Azure DevOps extension installed: `az extension add -n azure-devops`
- Valid Azure authentication via `az login` or PAT (`az devops login`)
- Valid Azure DevOps defaults for organization and project
- Local working tree reviewed for secrets and generated files

### Git Rules

- Initialize git only if the local path is not already a repository.
- Ensure `.gitignore` exists before the first commit.
- Create or switch to `develop` using `git checkout -B develop`.
- Create the first commit only if the repository has no commits.
- Use `git push -u <remote-name> develop`.
- Never use `git push --force` during bootstrap.
- When creating the Azure DevOps repo via REST API, include `"defaultBranch": "refs/heads/main"` in the request body so branch policies default to `main`, keeping `develop` open for direct bootstrap pushes.

### Remote Strategy

| Local State | Action |
|---|---|
| No remotes exist | Use `origin` or `azure` based on user preference |
| `origin` already exists | Add Azure DevOps as `azure` |
| Azure remote already exists | Reuse it after validation |

---

## 3. Pipeline File Standard

Every onboarded repository must contain a root-level `azure-pipelines.yml`.

### Required Shape

```yaml
resources:
  repositories:
    - repository: templates
      type: git
      name: SharedProject/Pipeline-Templates
      ref: refs/heads/main

trigger:
  branches:
    include:
      - develop

extends:
  template: dotnet-actions.yml@templates
  parameters:
    buildAgentPool: 'ENTER-POOL'
```

### Rules

- Keep the pipeline entry file in the repo root.
- Prefer `extends` for full template-driven pipelines.
- Reference template repos through `resources.repositories`, not local file copies.
- Keep secret values out of YAML; use placeholders until variable groups are introduced.
- Use repo-local YAML only as a thin wrapper over shared templates.

---

## 4. Stack-to-Template Mapping

| Stack | Template | Notes |
|---|---|---|
| Angular frontend | `angular-actions.yml@templates` | Root pipeline only, template owns stages |
| .NET backend | `dotnet-actions.yml@templates` | Root pipeline only, template owns stages |

### Rules

- Detect frontend/backend stacks before generating YAML.
- For unsupported stacks, stop and ask for the correct shared template instead of guessing.

---

## 5. Parameter Handling

Pipeline wrappers must expose only the minimum required parameters.

### Common Parameters

- `buildAgentPool`
- `snykServiceConnection`
- `snykToken`
- `skipSecurityScan`
- `checkmarxProjectName`
- `checkmarxUsername`
- `checkmarxPassword`
- `checkmarxPreset`
- `azureServiceConnection`
- `webappName`
- `virtualDirectory` for .NET web deployments when applicable

### Rules

- Preserve parameter names expected by the shared templates.
- Do not silently rename parameters between wrapper YAML and template YAML.
- Flag mismatches immediately.
- Keep optional deployment parameters commented or clearly marked when not yet known.

---

## 6. Safety Checks

Before pushing code or scaffolding a pipeline, always validate:

- no secrets in tracked files
- no `node_modules`, `bin`, `obj`, `.next`, `dist`, or generated outputs committed unintentionally
- no destructive remote rewrite
- no branch naming drift from the agreed target branch

If any of these fail, stop and ask for explicit user direction.

---

## 7. Azure DevOps API Standard

Use Azure DevOps REST APIs as the primary automation interface.

### Core Endpoints

- Repositories: `POST/GET _apis/git/repositories`
- Pipelines: `POST/PATCH/GET _apis/pipelines`
- Variable Groups: `GET/POST/PUT _apis/distributedtask/variablegroups`

### Authentication

- Use PAT-based Basic authentication headers for API calls.
- Do not hardcode PAT values in files, scripts, or logs.

### Rules

- Prefer API response payloads over command output parsing.
- Enforce idempotent behavior: check existing resources before create/update.
- Handle 409 conflicts and 429 throttling with explicit retry/backoff strategy.
- Keep Azure CLI as an optional fallback for manual troubleshooting only.

---

## 8. Output Expectations

Every DevOps bootstrap task should finish with:

- repo creation status per application
- remote name used
- pushed branch name
- generated pipeline file path
- unresolved placeholders needed for later pipeline creation and variable group setup
## 9. Pipeline and Variable Group Naming Standard

- Pipeline names must follow repository names:
  - <app-name>-frontend
  - <app-name>-backend
- Variable groups follow a split model — three groups per app:
  - `<app-name>-dev-variables` — app-specific dev config:
    - `buildAgentPool` — name of the shared build agent pool
    - `skipSecurityScan` — `true` for dev environment
    - `azureServiceConnection` — Azure Resource Manager service connection name
    - `webappName` — Azure Web App name for deployment target
    - `virtualDirectory` — virtual directory path for .NET IIS deployment (backend only)
    - `dbProvider` — set to `SqlServer` for cloud environments
    - `dbConnectionString` — full Azure SQL connection string (**secret**)
    - `jwtSecret` — JWT signing secret, minimum 32 characters (**secret**)
  - `<app-name>-prod-variables` — app-specific prod config (same variables as dev, prod values)
  - `security-scan-variables` — shared org-wide security scanning config (snykServiceConnection, snykToken, checkmarxServiceConnection, checkmarxProjectName, checkmarxUsername, checkmarxPassword, checkmarxPreset); one group reused across all apps
- Both frontend and backend pipelines reference all three groups.
- `dbConnectionString` and `jwtSecret` must always be marked as **secret** (`isSecret: true`) in the variable group — never stored as plain text.
- The backend pipeline must include an `AzureAppServiceSettings@1` task that writes the following App Service settings (sourced from variable group values) **before** the deploy step. Use double-underscore (`__`) as the hierarchy separator — ASP.NET Core requires this to map nested config keys:

  | App Setting Key | Source Variable | Notes |
  |---|---|---|
  | `ASPNETCORE_ENVIRONMENT` | Hard-code `Development` or `Production` per env | **Required** — without this the app cannot load environment-specific `appsettings` and placeholder values are used |
  | `DatabaseProvider` | `dbProvider` | Tells the app which DB driver to use |
  | `ConnectionStrings__DefaultConnection` | `dbConnectionString` | Maps to `ConnectionStrings:DefaultConnection` in .NET config |
  | `Jwt__Secret` | `jwtSecret` | Maps to `Jwt:Secret` in .NET config |

- If the pipeline template does not support `AzureAppServiceSettings@1`, these four keys must be set manually in Azure Portal → App Service → Configuration → Application settings. Document this as an outstanding item in the bootstrap summary.
- Do not create QA or UAT variable groups unless explicitly requested by the user.

---

## 10. Execution Mode Standard

- Default mode: direct API call execution plus git commands.
- Do not rely on `.ps1` helper scripts as workflow dependencies.
- Prefer transparent, stepwise operations where each REST request can be audited.

### Rules

- Keep operations idempotent where possible.
- Report API-level results and blockers immediately.
- Use Azure CLI only as an optional fallback for manual recovery steps.
