---
inclusion: always
---

# Mahindra AI-SDLC Framework

This project uses the Mahindra AI-SDLC framework. All development work follows structured phase-based workflows.

## Orchestrator — Entry Point

For any task, begin by reading the Orchestrator workflow:

```
Read .agents/workflows/orchestrator.md
```

The Orchestrator manages project state, routes to the correct phase, and tracks all SDLC work. It is the only workflow you need to invoke directly.

## Phase Workflows

| Phase | File |
|-------|------|
| Orchestrator | `.agents/workflows/orchestrator.md` |
| Requirements | `.agents/workflows/requirements.md` |
| Design | `.agents/workflows/design.md` |
| Development | `.agents/workflows/development.md` |
| Testing | `.agents/workflows/testing.md` |
| SOC Review | `.agents/workflows/soc-review.md` |
| DevOps | `.agents/workflows/devops.md` |

## Skills — Load Before Writing Code

| Task | File |
|------|------|
| .NET Core backend | `.agents/skills/dotnet-backend/SKILL.md` |
| Angular frontend | `.agents/skills/angular-frontend/SKILL.md` |
| Mahindra UI theme | `.agents/skills/ui-ux-design/mahindra-theme-skill.md` |
| Swaraj UI theme | `.agents/skills/ui-ux-design/swaraj-theme-skill.md` |
| Security / OWASP | `.agents/skills/security-guardrails/SECURITY_GUARDRAILS_SKILL.md` |
| Integrations | `.agents/skills/integrations/SKILL.md` |
| Azure DevOps | `.agents/skills/devops-azure-cicd/SKILL.md` |

## Stack

- **Backend**: ASP.NET Core 8, Minimal APIs, Clean Architecture, Dapper, SQL Server
- **Frontend**: Angular 18, standalone components, Signals, SCSS
- **Auth**: LDAP + JWT + CAPTCHA
- **Infra**: Azure Queue Storage, WebJob, Kubernetes, Jenkins
