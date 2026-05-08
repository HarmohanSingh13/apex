# DevOps Bootstrap — Steps 3–11, Recovery & Write-Back

> **Context:** This file is loaded by `devops.md` after Steps 1–2 complete. It contains the detailed execution steps, recovery procedures, and orchestrator write-back. Do not invoke this file directly.

---

## Step 3: Stack Detection and Template Selection

Choose the correct shared pipeline template for each repository.

### Selection Rules

| Stack | Starter YAML Example | Shared Template |
|---|---|---|
| Angular frontend | `.agents/assets/devops/azure-pipelines.angular.example.yml` | `angular-actions.yml@templates` |
| .NET backend | `.agents/assets/devops/azure-pipelines.dotnet.example.yml` | `dotnet-actions.yml@templates` |

### Instructions

1. Inspect each codebase root for stack indicators.
2. If the repo is Angular or Next.js, use the Angular starter as the baseline.
3. If the repo is .NET, use the .NET starter as the baseline.
4. For unsupported stacks, stop and ask the user for the correct shared template — do not guess.

---

## Step 4: Bootstrap Plan

Produce a full plan covering repos, pipelines, and variable groups before making any changes.

### Output Format

```markdown
## DevOps Bootstrap Plan

### Repositories
| Area | Local Path | Repo Name | Branch | Remote | Pipeline File | Template |
|---|---|---|---|---|---|---|
| Frontend | ... | <app>-frontend | develop | azure | azure-pipelines.yml | angular-actions.yml@templates |
| Backend  | ... | <app>-backend  | develop | azure | azure-pipelines.yml | dotnet-actions.yml@templates |

### Pipelines
| Repo | Pipeline Name | Points To |
|---|---|---|
| <app>-frontend | <app>-frontend | azure-pipelines.yml @ develop |
| <app>-backend  | <app>-backend  | azure-pipelines.yml @ develop |

### Variable Groups
| Group Name | Linked To | Placeholders |
|---|---|---|
| <app>-dev  | Both pipelines | webappName (if not yet known) |
| <app>-prod | Both pipelines | webappName (if not yet known) |
```

### Instructions

1. Map each local codebase to one Azure DevOps repository.
2. Map each repo to a pipeline name following the `<app>-frontend` / `<app>-backend` convention.
3. Map variable groups to environments (`<app>-dev`, `<app>-prod`) and note any placeholder values.
4. Present the full plan to the user and get confirmation before making any changes.

---

## Step 5: Repository Creation and Git Push

Create the remote repositories and push the code.

### Instructions

1. Resolve organisation and project identifiers for API calls.
2. Create each repo via REST API: `POST _apis/git/repositories`.
3. Execute git bootstrap for each codebase:
   - Initialize git if the local path is not already a repository
   - Create or switch to the `develop` branch using `git checkout -B develop`
   - Create an initial commit if the repo has no commits
   - Add the Azure DevOps remote (default name: `azure`)
   - Push `develop` without force-push: `git push -u azure develop`
   - Use PAT-based authentication in the remote URL
4. If the local path already has a remote named `origin`, do not overwrite it — add Azure DevOps as `azure` instead.

---

## Step 5.5: Branch Protection Policies

Set branch policies on `main` (the stable/release branch) immediately after the initial push, before any pipeline is wired up. The `develop` branch remains unprotected to allow direct pushes during active development. This follows standard Git flow where `main` is production-ready and `develop` is the active integration branch.

### Branch Policy Strategy

| Branch | Status | Policy | Reason |
|---|---|---|---|
| **main** | Protected | Minimum reviewers + build validation + comment resolution | Stable/release branch; all changes via PR with approval |
| **develop** | Unprotected | None | Active development branch; developers push directly for integration |

### Required Policies for `main`

| Policy | Setting |
|---|---|
| **Minimum reviewers** | ≥ 1 approver required for all PRs to main |
| **Reset votes on push** | Enabled — new commits invalidate prior approvals |
| **Build validation** | Require the CI pipeline to pass before merge (configure after Step 7 when pipeline object exists) |
| **Comment resolution** | All active PR comments must be resolved before merge |
| **No direct push** | Block direct pushes to `main` — all changes via PR from develop or release branches |
| **Force push blocked** | Permanently block force push to `main` |

### Instructions

1. For each repository created in Step 5, apply branch policies to the `main` branch via REST API:
   `PATCH _apis/policy/configurations` with the appropriate policy type IDs.
2. Key policy type IDs (Azure DevOps):
   - Minimum reviewer count: `fa4e907d-c16b-4a4c-9dfa-4906e5d171dd`
   - Build validation: `0609b952-1397-4640-95ec-e00a01b2c241`
   - Comment requirements: `c6a1889d-b943-4856-b76f-9e46bb6b0df2`
3. Set `No direct push` and `Force push blocked` on the `main` ref via the repository settings: `PATCH _apis/git/repositories/<repoId>/refs/<refName>/locks`.
4. **Do NOT apply any policies to `develop`** — leave it unprotected to support active development workflows.
5. **Build validation policy cannot be configured until the pipeline object exists** (Step 7). Return to this step after Step 7 and add the build validation policy to `main` using the pipeline ID returned by Step 7.
6. Document the applied policies in the bootstrap summary (Step 11).

### Post-Bootstrap Developer Workflow

After bootstrap, developers follow this flow:

**For regular development:**
```
1. Create feature branch: git checkout -b feature/my-feature
2. Push to develop (direct push allowed): git push -u azure develop
3. OR push feature branch: git push -u azure feature/my-feature
```

**For release to main (promotion):**
```
1. Create PR from develop → main
2. Require ≥1 approval (policy enforced)
3. Require passing build (policy enforced)
4. All comments resolved (policy enforced)
5. Complete PR to merge to main
```

The key principle: **Develop is your agile integration point; main is your stable release point.**

---

## Step 6: Pipeline YAML Scaffolding

Create the `azure-pipelines.yml` entry file in each repository that extends the shared template.

### Minimum Output Requirements

- Root-level `azure-pipelines.yml`
- `resources.repositories` block referencing the shared template repo
- `trigger` for `develop`
- `extends` block pointing to the correct shared template with all required parameters filled from Step 1 intake values
- Variable group reference for `<app>-dev` and `<app>-prod`
- Security gate definitions per the `VAPT & CI/CD QUALITY GATES` section of `guardrails-core.md` — the following gates are mandatory and must be present in every generated pipeline:

  | Gate | Tool | Block Condition |
  |---|---|---|
  | Secret scanning | Gitleaks | Any detected secret = pipeline fail |
  | SAST | Semgrep (`p/owasp-top-ten`, `p/csharp`, `p/typescript`) | Any High finding = pipeline fail |
  | SCA | Snyk | Any Critical or High CVE = pipeline fail |
  | DAST | OWASP ZAP | Any Critical finding = pipeline fail (staging, per-release) |

### Angular-specific Requirements (Angular 18+)

- **`public/web.config` must use `inheritInChildApplications="false"`**: If frontend and backend share one App Service (frontend at root, backend as a virtual application), the Angular catch-all rewrite rule will intercept backend routes and return the Angular 404 page. Wrap all rewrite rules in `<location path="." inheritInChildApplications="false">`.
- **Frontend `apiUrl` must include the virtual directory path**: `environment.dev.ts` / `environment.prod.ts` `apiUrl` must be `https://<webapp>.azurewebsites.net/<virtualDirectory>`, not just the root domain.

### .NET Backend-specific Requirements (Azure App Service / IIS)

- **`web.config` required to remove WebDAV**: Without it, IIS returns `405 Method Not Allowed` on all POST/PUT/DELETE requests before they reach the .NET app. The file must remove `WebDAVModule` and route all verbs through `AspNetCoreModuleV2`.
- **`InvariantGlobalization` must be `false`**: `<InvariantGlobalization>true</InvariantGlobalization>` in `.csproj` causes a `CultureNotFoundException` on startup — SqlClient and BCrypt both require culture support.
- **Virtual application type must be "Application"**: In Azure Portal → App Service → Configuration → Path mappings, the backend path must be type **Application**, not Virtual directory.

### Instructions

1. Read the selected starter file from Step 3 and use it as the canonical base. Instantiate the full structure; do not create a minimal or simplified YAML.
2. Create `azure-pipelines.yml` in the root of each target codebase by copying the starter structure and replacing placeholders with Step 1 values.
3. Preserve starter parity for all core sections unless there is an explicit, documented project-specific reason to diverge.
4. For any value noted as `PLACEHOLDER` (e.g. `webappName`), leave the placeholder and add an inline comment: `# TODO: Update before first deployment`.
5. Embed the security gate block from the `VAPT & CI/CD QUALITY GATES` section of `guardrails-core.md` into the generated YAML. Use the `snykServiceConnection` and `checkmarxServiceConnection` values from Step 1 to wire the SCA and SAST tools. Prefer Semgrep for SAST (as defined in the guardrails skill); use Checkmarx only when the org template requires it.
6. Add the VAPT Remediation SLA as an inline comment block so the team understands the block/warn thresholds: Critical (CVSS 9.0+) = 24h block, High (CVSS 7.0–8.9) = 72h block, Medium = 30d with tracker, Low = 90d backlog.
7. Validate the generated file using the checklist below and include a brief pass/fail status for each item in the Step 11 summary. This validation is informational and does not block progression.
8. Commit the pipeline file to the `develop` branch and push.

### Starter Fidelity Checklist (Informational)

Validate each generated `azure-pipelines.yml` against the selected starter template and report the result in Step 11.

- Build `name:` format is present and aligned with app naming
- `trigger.branches.include` contains `develop` and `developers/*`
- `trigger.branches.exclude` contains `main`
- `pr.branches.include` contains `main`
- Conditional variable-group selection exists for release vs non-release
- `security-scan-variables` group reference is present
- Inline defaults for `skipSecurityScan` and `buildAgentPool` are present
- `resources.repositories` uses `Pipeline-Templates` alias
- `extends` uses the stack-appropriate template via `@Pipeline-Templates`
- Required Step 1 parameters are wired in the `extends.parameters` block

If any item is missing, continue workflow execution but explicitly document the gap and remediation action in Step 11.

---

## Step 7: Pipeline Object Creation

Create the Azure DevOps pipeline objects that point to the committed YAML files.

### Instructions

1. Create each pipeline via REST API: `POST _apis/pipelines`.
2. Name each pipeline following the convention: `<app>-frontend`, `<app>-backend`.
3. Point each pipeline to `azure-pipelines.yml` on the `develop` branch of its repository.
4. Set the default agent queue from the `buildAgentPool` value collected in Step 1.
5. If a pipeline with the same name already exists, update it via `PATCH _apis/pipelines/<id>` rather than creating a duplicate.

---

## Step 8: Variable Group Creation

Create variable groups for each deployment environment and populate them with the values from Step 1.

### Standard Environments

| Environment | Variable Group | Purpose |
|---|---|---|
| Development | `<app>-dev` | Shared dev config for frontend and backend pipelines |
| Production | `<app>-prod` | Shared prod config for frontend and backend pipelines |

### Instructions

1. Check whether the variable group already exists: `GET _apis/distributedtask/variablegroups?groupName=<app>-dev`.
2. Create or update via: `POST/PUT _apis/distributedtask/variablegroups`.
3. Populate all variable names from Step 1, including `apiUrl` and `aspnetcoreEnvironment` where applicable. Mark secret variables (`snykToken`, `dbConnectionString`, `jwtSecret`) with `isSecret: true`.
4. For `PLACEHOLDER` values, set the value to `PLACEHOLDER` and add a description noting it must be updated before deployment.
5. Store the variable group JSON definition to `./<app-name>-artifacts/devops/variable-groups-<app>-<env>.json` as a local source-of-truth record.

---

## Step 9: Pipeline-to-Variables Binding

Verify that each pipeline is linked to its variable groups.

### Instructions

1. Confirm that the variable groups `<app>-dev` and `<app>-prod` are accessible to both pipelines.
2. Variable group linkage is handled by the shared pipeline template — validate the `extends` parameters reference the correct group names.
3. Trigger a dry-run or manual run on `develop` to confirm the pipeline can resolve all variables without errors.
4. If the test trigger fails due to a `PLACEHOLDER` value, report it clearly — this is expected if the Azure Web App is not yet provisioned.

---

## Step 10: Verification

Verify the full bootstrap end-to-end.

### Verification Checklist

- Repos exist in Azure DevOps
- `develop` branch exists and code is pushed in each repo
- Local git remotes point to the correct Azure DevOps URLs
- `azure-pipelines.yml` exists in each repo root and references the correct shared template
- Pipeline objects exist in Azure DevOps with the correct names
- Variable groups `<app>-dev` and `<app>-prod` exist and are populated
- No secrets were committed to source control
- No force push was used at any point

**Azure App Service — Post-Deployment Checks**
- `ASPNETCORE_ENVIRONMENT`, `Jwt__Secret`, and `ConnectionStrings__DefaultConnection` are present in App Service Application Settings with correct double-underscore keys
- `/health` returns `Healthy` — startup error indicates missing App Settings or `InvariantGlobalization=true`
- `POST /api/auth/login` returns `200` — `405` means `web.config` missing; Angular 404 page means `inheritInChildApplications="false"` missing from frontend `web.config`
- Backend virtual application path is type **Application** (not Virtual directory) in Azure Portal Path mappings
- Frontend `apiUrl` includes virtual directory path if backend is not at root

**TLS Hardening — Azure App Service**

Weak cipher suites (especially CBC-mode) are a DAST Medium finding and cannot be fixed in application code — they are controlled at the platform level.

1. **Set minimum TLS version to 1.2** in Azure Portal → App Service → Settings → TLS/SSL settings → Minimum Inbound TLS Version → `1.2`
2. **Disable CBC cipher suites** via Azure CLI (run once per App Service instance):
   ```bash
   az webapp config set \
     --resource-group <rg> \
     --name <app-service-name> \
     --min-tls-version 1.2
   ```
3. **If using Cloudflare in front of Azure App Service:** Set Cloudflare SSL/TLS → Edge Certificates → Minimum TLS Version to `TLS 1.2` and enable **TLS 1.3**. Set Cipher Suites to `Modern` (disables all CBC-mode suites). This is the primary control when Cloudflare handles TLS termination.
4. **Verify** after deployment using [SSL Labs Server Test](https://www.ssllabs.com/ssltest/) — target grade **A** or better. A grade below A is a blocker for sprint completion.

> **Why this is here and not in application code:** When running behind Cloudflare (or any CDN that terminates TLS), cipher suite selection happens at the CDN layer, not in the .NET application. `HttpClient` and Kestrel cipher configuration only affect the internal App Service ↔ origin connection, not the public-facing TLS handshake.

### Instructions

1. Verify each repo: `GET _apis/git/repositories/<repo-name>`.
2. Verify remote branches: `git ls-remote azure`.
3. Verify pipelines exist: `GET _apis/pipelines` — confirm names match `<app>-frontend` / `<app>-backend`.
4. Verify variable groups: `GET _apis/distributedtask/variablegroups?groupName=<app>-dev`.
5. List any remaining `PLACEHOLDER` values the user must update before the first deployment.

> **Note:** Use Azure CLI only as a manual fallback for troubleshooting — REST API is the primary verification method.

---

## Recovery Procedures

Use these when the idempotent resume path is not appropriate — typically when something was created incorrectly and must be torn down before proceeding.

### Wrong repo name created

Repos are not easily renamed in Azure DevOps (name is part of the clone URL — renaming breaks existing remotes).

1. Delete the incorrectly named repo: `DELETE _apis/git/repositories/<repoId>`. **Confirm with user before executing — this is destructive.**
2. In `bootstrap-state.md`: set Step 5 back to `⬜ Not run`, clear the repo ID from Collected Inputs, clear Failure Detail.
3. Re-run from Step 5 with the correct repo name.

### PAT expired or invalid mid-run

1. User generates a new PAT with required scopes (Code, Build, Variable Groups).
2. Update `bootstrap-state.md` → Collected Inputs: no PAT is stored there (never persist PATs to file) — user provides it fresh at resume time.
3. Resume from the failed step. The workflow re-reads the PAT from the user at runtime.

### Git push rejected (non-fast-forward)

This means the remote `develop` branch has commits not present locally — a conflict.

1. Do **not** force push. Force push to `develop` is blocked by branch policy and violates the security guardrails.
2. Fetch the remote: `git fetch azure develop`.
3. Determine the source of the conflict with the user — was it a manual commit directly to the remote branch?
4. If yes: rebase local onto remote (`git rebase azure/develop`), resolve conflicts, then push.
5. If the remote commit is erroneous: raise with the repository owner to revert via PR — do not force push.

### Pipeline YAML syntax error after commit

1. Fix the YAML locally.
2. Commit the fix to `develop` and push.
3. In `bootstrap-state.md`: Step 6 is already ✅ Done (the file was committed). Update the Notes column: `"fixed syntax error — recommitted YYYY-MM-DD"`.
4. Continue from Step 7 — no need to re-scaffold.

### Variable group created with wrong values

Variable groups support individual variable updates — no need to delete and recreate.

1. Identify the incorrect variable(s).
2. `PATCH _apis/distributedtask/variablegroups/<id>` with the corrected values.
3. Update `bootstrap-state.md` → Step 8 Notes with correction details.
4. Resume from Step 9 (binding verification).

### Full restart needed (catastrophic partial state)

If state is too corrupted to resume cleanly:

1. Present the user with a full inventory of what was created (from `bootstrap-state.md`).
2. Ask for explicit confirmation before deleting anything.
3. Delete in reverse order: variable groups → pipelines → repos.
   - `DELETE _apis/distributedtask/variablegroups/<id>`
   - `DELETE _apis/pipelines/<id>` _(note: this deletes pipeline definition, not build history)_
   - `DELETE _apis/git/repositories/<id>` _(destructive — confirm explicitly)_
4. Delete `bootstrap-state.md` from `<app-name>-artifacts/devops/`.
5. Re-run from Step 1.

---

## Step 11: Output Summary

Provide a complete bootstrap summary.

### Summary Format

```markdown
## DevOps Bootstrap Summary — <app-name>

### Repositories
| Area | Repo | Branch | Result |
|---|---|---|---|
| Frontend | <app>-frontend | develop | Success / Blocked |
| Backend  | <app>-backend  | develop | Success / Blocked |

### Pipelines
| Pipeline | Status | Notes |
|---|---|---|
| <app>-frontend | Created / Updated | — |
| <app>-backend  | Created / Updated | — |

### Variable Groups
| Group | Status | Placeholders Remaining |
|---|---|---|
| <app>-dev  | Created / Updated | webappName (update before deployment) |
| <app>-prod | Created / Updated | webappName (update before deployment) |

### Outstanding Items
- [ ] List any PLACEHOLDER values that must be updated
- [ ] List any manual steps required (e.g. branch policies, environment approvals)
```

If any step fails, report the exact blocker and the REST API response that caused it. Do not partially complete and silently continue.

### Output File Naming Convention

```
[project-name]_devops_bootstrap_summary_[YYYY-MM-DD].md
[project-name]_variable-groups-[env]_[YYYY-MM-DD].json
```

Save to: `./<app-name>-artifacts/devops/` (create if it does not exist).

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

Write `<app-name>-artifacts/orchestrator/handoffs/devops-S{N}.md` using this schema:

```markdown
# Handoff: DevOps → Sprint Close — S[N] — [YYYY-MM-DD]
Sprint: [N] | Stories completed: [N]
Repos: frontend [✅/❌] · backend [✅/❌]
Pipeline: [active ✅ / failed ❌]
Variable groups: [configured ✅ / missing ❌]
Branch policies: [active ✅ / not set ❌]
Artifacts: devops/[list key files]
Sprint status: [COMPLETE | PARTIAL — Step [N] failed]
```

### 3. Update `project_status.md`

Set the **DevOps** row Phase Status based on outcome:

| Outcome | Phase Status | Handoff File |
|---|---|---|
| All steps ✅ Done | `⏸️ Awaiting Review` | `handoffs/devops-S{N}.md` |
| Any step 🔴 Failed | `🔄 In Progress` | `handoffs/devops-S{N}.md` |
| User abandoned | `🔄 In Progress` | `handoffs/devops-S{N}.md` |

Additionally:
- Update **Azure DevOps Config** section with actual values — populate from `bootstrap-state.md` → Collected Inputs.
- **Do NOT advance the Sprint counter.** That is done by the Orchestrator after Human Approval Gate APPROVED.
- Set `Active Sub-Workflow` to `none`.
- Update `Last Updated` timestamp.

### 4. `app-context.md`

No write-back required. DevOps state lives in `project_status.md` → Azure DevOps Config section.
