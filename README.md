# Mahindra AI-SDLC Framework

Enterprise-grade agentic SDLC skills and workflows for .NET Core + Angular projects — works with Claude Code, Cursor, GitHub Copilot, Gemini CLI, Kiro, and more.

## Install

Run this once in any project root:

```bash
npx @mahindra/ai-sdlc install
```

The CLI detects which AI agent(s) you use and copies the right files into your project:

| Agent | Installed Path |
|-------|---------------|
| Claude Code | `.claude/agents/` |
| Cursor | `.cursor/rules/` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Gemini CLI | `.gemini/GEMINI.md` |
| Kiro | `.kiro/steering/` |
| OpenCode | `.opencode/AGENTS.md` |
| Generic / all others | `.agents/` |

If no agent directory is detected, `.agents/` is installed as a universal fallback.

### Options

```bash
# Install for all agents, not just detected ones
npx @mahindra/ai-sdlc install --all

# Preview what would be installed without writing any files
npx @mahindra/ai-sdlc install --dry-run

# Add a prefix to all installed skill/rule names
npx @mahindra/ai-sdlc install --prefix=sdlc
```

## What Gets Installed

### Skills

| Skill | Purpose |
|-------|---------|
| `.NET Core Backend` | Clean Architecture, EF Core + Dapper, FluentValidation, Serilog, JWT auth |
| `Angular Frontend` | Angular 18 standalone components, Signals, reactive forms, Jest/Cypress |
| `UI/UX — Mahindra Theme` | Mahindra Rise design system components and tokens |
| `UI/UX — Swaraj Theme` | Swaraj StoreTAT design system |
| `Security Guardrails` | OWASP Top 10, secure coding patterns, SOC review checklist |
| `External Integrations` | SAP OData / RFC/BAPI anti-corruption layer, service adapters |
| `Azure DevOps CI/CD` | Pipeline templates for .NET and Angular builds, security scans |

### Workflows

| Workflow | Purpose |
|----------|---------|
| `orchestrator` | Supreme hub — single entry point for all SDLC work |
| `requirements` | User stories, BRD, acceptance criteria, sprint planning |
| `design` | Architecture decisions, API contracts, DB schema, sequence diagrams |
| `development` | TDD feature implementation, PR flow, OWASP compliance |
| `testing` | Jest / xUnit / Cypress full test suites |
| `soc-review` | Security-focused code review against OWASP Top 10 |
| `devops` | Azure DevOps / Jenkins pipeline setup and configuration |

## Usage After Install

### Claude Code

The Orchestrator agent is automatically available as a slash command:

```
/orchestrator
```

Or invoke any phase agent directly:

```
/requirements   /design   /development   /testing   /soc-review   /devops
```

### Cursor / Copilot / Gemini / Kiro

The installed rule/instruction file tells your agent to read the relevant workflow file. For example, to start development work:

> "Read `.agents/workflows/development.md` and implement the login feature as described in the user story."

### Generic / Any Agent

Point your agent at the Orchestrator:

```
Read .agents/workflows/orchestrator.md and proceed.
```

## Repository Structure

```
.agents/
├── workflows/          # Phase workflow definitions
│   ├── orchestrator.md
│   ├── requirements.md
│   ├── design.md
│   ├── development.md
│   ├── testing.md
│   ├── soc-review.md
│   └── devops.md
├── skills/             # Reusable skill definitions
│   ├── dotnet-backend/
│   ├── angular-frontend/
│   ├── ui-ux-design/
│   ├── security-guardrails/
│   ├── integrations/
│   └── devops-azure-cicd/
└── assets/             # DevOps pipeline templates, BRD config

.claude/agents/         # Claude Code subagent definitions
.cursor/rules/          # Cursor IDE rules
.gemini/                # Gemini CLI instructions
.github/                # GitHub Copilot instructions
.kiro/                  # Kiro steering files
.opencode/              # OpenCode agent config
```

## Publishing

```bash
cd packages/ai-sdlc-cli
npm run build           # syncs templates + compiles TypeScript
npm publish --access public
```

## Stack

This framework is designed for:

- **Backend**: ASP.NET Core 8, Minimal APIs, Clean Architecture, Dapper + EF Core, SQL Server
- **Frontend**: Angular 18, standalone components, Signals-first state, SCSS
- **Auth**: LDAP + JWT + CAPTCHA + concurrent login prevention
- **Infra**: Azure Queue Storage, WebJob, Helm/Kubernetes, Jenkins CI/CD
- **AI**: Azure OpenAI integration
