# Mahindra AI-SDLC Framework

This project uses the Mahindra AI-SDLC framework — a structured, phase-based approach to enterprise software development for .NET Core + Angular projects.

## How to Use

For any development task, start by reading the Orchestrator workflow:

```
Read .agents/workflows/orchestrator.md
```

The Orchestrator is the single entry point that routes work to the correct phase workflow. It manages project state, delegates to specialist workflows, and tracks progress across the full SDLC.

## Available Workflows

| Phase | Read This File |
|-------|---------------|
| Orchestrator (always start here) | `.agents/workflows/orchestrator.md` |
| Requirements & Planning | `.agents/workflows/requirements.md` |
| Architecture & Design | `.agents/workflows/design.md` |
| Feature Development | `.agents/workflows/development.md` |
| Testing | `.agents/workflows/testing.md` |
| Security / SOC Review | `.agents/workflows/soc-review.md` |
| Azure DevOps CI/CD | `.agents/workflows/devops.md` |

## Available Skills

Load the relevant skill file before writing code:

| When Working On | Read This Skill |
|----------------|----------------|
| .NET Core / C# backend | `.agents/skills/dotnet-backend/SKILL.md` |
| Angular frontend | `.agents/skills/angular-frontend/SKILL.md` |
| Mahindra-branded UI | `.agents/skills/ui-ux-design/mahindra-theme-skill.md` |
| Swaraj-branded UI | `.agents/skills/ui-ux-design/swaraj-theme-skill.md` |
| Security & OWASP compliance | `.agents/skills/security-guardrails/SECURITY_GUARDRAILS_SKILL.md` |
| SAP / external integrations | `.agents/skills/integrations/SKILL.md` |
| Azure DevOps pipelines | `.agents/skills/devops-azure-cicd/SKILL.md` |

## Project Stack

- **Backend**: ASP.NET Core 8, Minimal APIs, Clean Architecture, Dapper, SQL Server
- **Frontend**: Angular 18 standalone components, Signals-based state, SCSS
- **Auth**: LDAP + JWT + CAPTCHA + concurrent session prevention
- **Infra**: Azure Queue Storage, WebJob, Helm/Kubernetes, Jenkins CI/CD
- **AI**: Azure OpenAI
