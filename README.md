# AI-SDLC Framework

Enterprise-grade agentic SDLC skills and workflows for .NET Core + Angular projects — works with Claude Code, Cursor, GitHub Copilot, Gemini CLI, Kiro, OpenCode, and more.

## Install

Run this once in any project root:

```bash
npx github:HarmohanSingh13/apex
```

The CLI auto-detects which AI agent(s) you use and copies the right files into your project:

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
# Install for all agents, not just auto-detected ones
npx github:HarmohanSingh13/apex install --all

# Preview what would be installed without writing any files
npx github:HarmohanSingh13/apex install --dry-run

# Add a prefix to all installed skill/rule names
npx github:HarmohanSingh13/apex install --prefix=sdlc
```

## What Gets Installed

Seven workflows covering the full SDLC — each one is a focused AI agent that knows your stack deeply:

| Workflow | When to use it |
|----------|---------------|
| `orchestrator` | Start here — routes you to the right phase automatically |
| `requirements` | Gathering user stories, BRD, acceptance criteria, sprint planning |
| `design` | Architecture decisions, API contracts, DB schema, sequence diagrams |
| `development` | Implementing features with TDD, PR flow, OWASP compliance |
| `testing` | Writing Jest / xUnit / Cypress test suites |
| `soc-review` | Security-focused code review against OWASP Top 10 |
| `devops` | Azure DevOps / Jenkins pipeline setup and configuration |

Each workflow carries deep knowledge of the stack (.NET Core 8, Angular 18, Clean Architecture, Azure) so your AI agent doesn't need to be re-briefed on every task.

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

### Cursor / Copilot / Gemini / Kiro / OpenCode

The installed rule/instruction file tells your agent to read the relevant workflow file. For example, to start development work:

> "Read `.agents/workflows/development.md` and implement the login feature as described in the user story."

### Generic / Any Agent

Point your agent at the Orchestrator:

```
Read .agents/workflows/orchestrator.md and proceed.
```

## Repository Structure

```
src/                    # CLI TypeScript source
dist/                   # Compiled CLI (committed)
templates/              # Bundled agent files (committed)
scripts/sync.js         # Syncs .agents/ etc. into templates/ before build

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

## Updating the Framework

When you modify any agent files (`.agents/`, `.claude/`, etc.), rebuild and commit:

```bash
npm run build           # syncs templates/ + compiles TypeScript
git add dist/ templates/
git commit -m "chore: update skills"
git push
```

Users get the update next time they run `npx github:HarmohanSingh13/apex`.

## Stack

This framework is designed for:

- **Backend**: ASP.NET Core 8, Minimal APIs, Clean Architecture, Dapper + EF Core, SQL Server
- **Frontend**: Angular 18, standalone components, Signals-first state, SCSS
- **Auth**: LDAP + JWT + CAPTCHA + concurrent login prevention
- **Infra**: Azure Queue Storage, WebJob, Helm/Kubernetes, Jenkins CI/CD
- **AI**: Azure OpenAI integration
