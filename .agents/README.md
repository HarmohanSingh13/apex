# AI Agents — Coding Workflow & Skills Collection

Reusable, project-agnostic workflow agents and skills for Agile SDLC. Copy into any project's `.agents/` directory to enable.

## Workflows (Agents)

Invoked manually via `/slash-command` in the AI chat.

| Agent | File | Command | SDLC Phase |
|---|---|---|---|
| Requirements & Planning | `workflows/requirements.md` | `/requirements` | Sprint Planning |
| Design | `workflows/design.md` | `/design` | Architecture & Design |
| Development | `workflows/development.md` | `/development` | Implementation (code + test stubs) |
| Testing | `workflows/testing.md` | `/testing` | Test Implementation, Coverage & E2E |
| SOC Review | `workflows/soc-review.md` | `/soc-review` | Security, Quality & Performance Assurance |
| DevOps Bootstrap | `workflows/devops.md` | `/devops` | Source Control, CI/CD & Variable Groups |
| Orchestrator | `workflows/orchestrator.md` | `/orchestrator` | Cross-phase Coordination |

## Skills

Auto-detected by the AI when relevant context is present. No slash command needed.

| Skill | Folder | Auto-Activates When |
|---|---|---|
| Angular Frontend | `skills/angular-frontend/` | Working on Angular components, services, routing, forms |
| .NET Core Backend | `skills/dotnet-backend/` | Working on C# controllers, services, EF Core, APIs _(split: `dotnet-core.md` · `dotnet-application.md` · `dotnet-infrastructure.md`)_ |
| Azure DevOps CI/CD Bootstrap | `skills/devops-azure-cicd/` | Working on Azure DevOps repos, git remotes, bootstrap pipelines, YAML template wrappers |
| Integrations | `skills/integrations/` | User story or requirement involves calling SAP, ERP, or any external system |
| UI/UX — Swaraj Theme | `skills/ui-ux-design/swaraj-theme-skill.md` | Swaraj-branded apps — green palette, split login with domain illustration, pill buttons |
| UI/UX — Mahindra Theme | `skills/ui-ux-design/mahindra-theme-core.md` + `mahindra-theme-components.md` | Mahindra-branded apps — red palette, modern/minimal, inline nav, geometric login |
| UI/UX — Mahindra×Swaraj Hybrid | `skills/ui-ux-design/mahindra-swaraj-hybrid-skill.md` | Mahindra brand + Swaraj warmth — red palette, split login with domain illustration, separate nav bar |
| Security Guardrails | `skills/security-guardrails/` | Any security review, threat modelling, OWASP/VAPT assessment, or compliance check _(split: `guardrails-core.md` · `guardrails-owasp.md` · `guardrails-docs.md`)_ |
| Testing | `skills/testing/` | Writing or reviewing tests, configuring Jest/Cypress/xUnit, checking code coverage |

## Usage

### 1. Copy to your project
```bash
# Copy everything
cp -r ai-agents/* <your-project>/.agents/

# Or selectively
cp -r ai-agents/workflows/ <your-project>/.agents/workflows/
cp -r ai-agents/skills/ <your-project>/.agents/skills/
```

### 2. Use workflows
Type `/requirements`, `/design`, `/development`, `/testing`, `/soc-review`, `/devops`, or `/orchestrator` in the AI chat.

### 3. Skills activate automatically
When the AI detects you're working on Angular, .NET, or Azure DevOps bootstrap tasks, it reads the relevant SKILL.md files and follows those standards.

## Prerequisites

For Word/Excel output generation:
```bash
pip install python-docx openpyxl
```
