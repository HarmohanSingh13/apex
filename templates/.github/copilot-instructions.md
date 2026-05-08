# Mahindra AI-SDLC Framework

This project uses the Mahindra AI-SDLC framework — a structured, phase-based approach to enterprise software development for .NET Core + Angular projects.

## Instructions

Before responding to any task, read the appropriate workflow file from `.agents/workflows/`. The Orchestrator is the single entry point for all work:

**Read `.agents/workflows/orchestrator.md` for any new or unknown task.**

Each workflow file contains complete, numbered step-by-step instructions. Execute every step exactly — do not summarise or skip steps.

## Workflow Files

| Phase | File |
|-------|------|
| Orchestrator — start here for anything | `.agents/workflows/orchestrator.md` |
| Requirements & user stories | `.agents/workflows/requirements.md` |
| Architecture & design | `.agents/workflows/design.md` |
| Feature development | `.agents/workflows/development.md` |
| Testing (Jest / xUnit / Cypress) | `.agents/workflows/testing.md` |
| Security / SOC review | `.agents/workflows/soc-review.md` |
| Azure DevOps CI/CD setup | `.agents/workflows/devops.md` |

## Skill Files

Load the relevant skill before writing code:

| Task | Skill File |
|------|-----------|
| .NET Core / C# backend | `.agents/skills/dotnet-backend/SKILL.md` |
| Angular 18 frontend | `.agents/skills/angular-frontend/SKILL.md` |
| Mahindra-branded UI/UX | `.agents/skills/ui-ux-design/mahindra-theme-skill.md` |
| Swaraj-branded UI/UX | `.agents/skills/ui-ux-design/swaraj-theme-skill.md` |
| Security & OWASP | `.agents/skills/security-guardrails/SECURITY_GUARDRAILS_SKILL.md` |
| SAP / external integrations | `.agents/skills/integrations/SKILL.md` |
| Azure DevOps pipelines | `.agents/skills/devops-azure-cicd/SKILL.md` |

## Stack

- **Backend**: ASP.NET Core 8, Minimal APIs, Clean Architecture, Dapper, SQL Server
- **Frontend**: Angular 18 standalone components, Signals, SCSS
- **Auth**: LDAP + JWT + CAPTCHA + concurrent session prevention
- **Infra**: Azure Queue Storage, WebJob, Helm/Kubernetes, Jenkins
- **AI**: Azure OpenAI
