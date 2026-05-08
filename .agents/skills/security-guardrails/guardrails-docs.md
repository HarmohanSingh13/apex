# Security Guardrails — Security Documentation Templates
# Version: 1.0 | Owner: Information Security / CISO Office

> **When to load:** Load this file during the **Design phase only**. Contains the canonical templates for `SECURITY.md`, `THREAT_MODEL.md`, and `assets.md` — the three security documents that Design is responsible for generating. Output path for all three: `<app-name>-artifacts/design/`.
>
> **Prerequisite:** `guardrails-core.md` must also be loaded.

---

## SECURITY.md Template

Generate this file at `<app-name>-artifacts/design/SECURITY.md` for every new project. This is a Design phase output — it lives in `design/`, not in any application source directory.

```markdown
# Security Policy — [App Name]

## Supported Versions
| Version | Supported |
|---------|-----------|
| Latest  | ✅ Yes    |
| N-1     | ✅ Yes    |
| N-2+    | ❌ No     |

## Reporting a Vulnerability
Report security vulnerabilities to: security@mahindra.com
Do NOT create public issues or commit security details to source control.
Response SLA: 24 hours for Critical, 72 hours for High.

## Security Controls Applied
- NIST CSF 2.0 aligned
- CIS Level 1 hardened (Angular 18 / .NET 8 / Azure SQL)
- OWASP Top 10 (2021) compliant — A01–A10 enforced
- Dependency scanning: Snyk + Dependabot (weekly)
- SAST: Semgrep — `p/owasp-top-ten`, `p/csharp`, `p/typescript` (every commit)
- DAST: OWASP ZAP (pre-release, staging environment)
- Secret scanning: Gitleaks (pre-commit + CI)

## Authentication & Access
- Authentication: JWT (access token 15 min / refresh token 7 days, single-use rotation via httpOnly cookie)
- Refresh Token Breach Response: token reuse detected → entire session family revoked immediately
- MFA: Required for Admin roles
- Account lockout: 5 failed attempts → 15-minute lockout
- Role-based access control: [list roles here — e.g. Admin, Reviewer, User]

## Data Classification Summary
| Category | Examples | Storage / Transit Controls |
|---|---|---|
| RESTRICTED | [e.g. employee IDs, financial data] | AES-256-GCM at rest, TLS 1.3 in transit |
| CONFIDENTIAL | [e.g. project data, workflow state] | Encrypted at rest, TLS 1.3 in transit |
| INTERNAL | [e.g. configuration, metadata] | TLS 1.3 in transit |
| PUBLIC | [e.g. reference data, labels] | No special controls required |

## Known Security Assumptions
- TLS 1.3 required for all connections (enforced at CDN/App Service level)
- Secrets managed via Azure Key Vault — never in config files or source control
- Application deployed behind Cloudflare CDN (TLS termination at CDN layer)
- Azure App Service minimum TLS version: 1.2 (TLS 1.3 preferred)
```

---

## THREAT_MODEL.md Template

Generate this file at `<app-name>-artifacts/design/THREAT_MODEL.md` for every new project. Update it whenever a new sprint introduces new attack surfaces (new data classifications, new external integrations, new user-facing features handling CONFIDENTIAL/RESTRICTED data).

```markdown
# Threat Model — [App Name]
**Version:** 1.0
**Last Updated:** [YYYY-MM-DD]
**Sprint:** [N]

---

## Application Overview

**Purpose:** [1–2 sentences: what the app does]
**Technology Stack:** Angular 18 frontend · .NET 8 backend · Azure SQL · Azure App Service
**Deployment:** Azure App Service (Windows) behind Cloudflare CDN
**Users:** [list user types — e.g. Internal employees, External partners, Admin users]

---

## Trust Boundaries

```
[Browser / Client]
        │ HTTPS (TLS 1.3 via Cloudflare)
        ▼
[Cloudflare CDN]  ←— TLS terminates here
        │ HTTPS (TLS 1.2+ to origin)
        ▼
[Azure App Service]
  ├── Angular SPA (static files via IIS)
  └── .NET 8 API (Kestrel via IIS ARR)
        │ Azure Private Link / VNet
        ▼
[Azure SQL Database]
```

---

## Attack Surface Inventory

| Surface | Entry Point | Data Exposed | Trust Level |
|---|---|---|---|
| Login endpoint | `POST /api/auth/login` | Credentials | Untrusted |
| User API | `GET/POST/PUT /api/[resource]` | [data type] | Authenticated |
| Admin API | `GET/POST /api/admin/[resource]` | [data type] | Admin only |
| File upload | `POST /api/upload` (if applicable) | Binary content | Authenticated |
| Angular SPA | Browser | Client-side state | Untrusted |

---

## STRIDE Analysis

| Threat | Category | Affected Component | Mitigation | Status |
|---|---|---|---|---|
| JWT token theft via localStorage | Spoofing | Auth | httpOnly cookies only — never localStorage | ✅ Mitigated |
| SQL injection via API parameters | Tampering | .NET API → Azure SQL | EF Core + parameterized Dapper queries | ✅ Mitigated |
| IDOR — user accessing another user's data | Elevation of Privilege | .NET API | Resource-based authorization on every query | ✅ Mitigated |
| Hardcoded secrets in source | Information Disclosure | All | Gitleaks pre-commit + CI scan | ✅ Mitigated |
| Refresh token reuse / session hijack | Spoofing | Auth service | Single-use rotation + entire session family revoked on reuse | ✅ Mitigated |
| Brute force on login | DoS / Auth | Login endpoint | Rate limiter (5 attempts / 15 min) + lockout | ✅ Mitigated |
| XSS via Angular template | Tampering | Angular SPA | Angular template binding — no innerHTML | ✅ Mitigated |
| CSRF on state-changing endpoints | Tampering | .NET API | Anti-forgery token (XSRF-TOKEN) | ✅ Mitigated |
| Weak cipher suites (CBC-mode) | Information Disclosure | TLS layer | Cloudflare Modern cipher suite + TLS 1.2 min | ✅ Mitigated |
| [Add new threats as attack surface grows] | | | | ⬜ Open |

---

## High-Risk Data Flows

### [Flow 1 — example: User Authentication]
```
User submits credentials →
  Angular form (HTTPS POST) →
  .NET LoginController (FluentValidation → BCrypt.Verify) →
  JWT issued (httpOnly cookie, 15 min access TTL / 7 day refresh, single-use rotation) →
  Audit log entry (user_id, IP, timestamp — no password)
```
Risk: Credential theft. Mitigation: HTTPS, no localStorage, rate limiting, lockout, secure cookie flags.

### [Add additional high-risk data flows for CONFIDENTIAL/RESTRICTED entities]

---

## Open Threats & Residual Risks

| ID | Description | Severity | Residual Risk | Owner |
|---|---|---|---|---|
| T-001 | [description] | [High/Med/Low] | [accepted/mitigated/deferred] | [team] |

---

## Revision History

| Version | Date | Sprint | Change |
|---|---|---|---|
| 1.0 | [YYYY-MM-DD] | 1 | Initial threat model |
```

---

## assets.md Template

Generate this file at `<app-name>-artifacts/design/assets.md` for every new project. It is a living inventory of all key assets in the system — updated by the Design phase each sprint as new components are added.

```markdown
# Asset Inventory — [App Name]
**Last Updated:** [YYYY-MM-DD] · **Sprint:** [N]

---

## Application Components

| Asset | Type | Classification | Location | Owner |
|---|---|---|---|---|
| Angular SPA | Frontend application | INTERNAL | Azure App Service (root) | Dev team |
| .NET 8 API | Backend application | INTERNAL | Azure App Service (virtual dir) | Dev team |
| Azure SQL Database | Data store | CONFIDENTIAL | Azure SQL Server | Dev team |
| Azure Key Vault | Secrets store | RESTRICTED | Azure subscription | Platform team |
| Azure DevOps pipelines | CI/CD | INTERNAL | Azure DevOps org | Dev team |

---

## Data Assets

| Asset | Classification | Volume | Retention | Notes |
|---|---|---|---|---|
| User accounts | CONFIDENTIAL | [N] records | Active + 2 years | Soft delete |
| [Business entity 1] | [Classification] | [N] records | [Retention policy] | [Notes] |
| Audit logs | INTERNAL | Rolling | 1 year | Append-only |
| Pipeline secrets | RESTRICTED | [N] variables | Until rotated | Azure Key Vault only |

---

## External Dependencies

| Dependency | Type | Trust Level | Data Shared | SLA |
|---|---|---|---|---|
| Azure Active Directory | Identity provider | Trusted | User identity tokens | 99.9% |
| Cloudflare | CDN / WAF | Trusted | HTTP traffic | 99.99% |
| [External API if applicable] | [Type] | [Level] | [Data] | [SLA] |

---

## Revision History

| Version | Date | Sprint | Change |
|---|---|---|---|
| 1.0 | [YYYY-MM-DD] | 1 | Initial asset inventory |
```

---

## Design Phase — Security Documentation Checklist

When the Design workflow completes, all three files below must exist at `<app-name>-artifacts/design/`:

| File | Required | Content |
|---|---|---|
| `SECURITY.md` | ✅ Mandatory — every project | Security policy, controls, data classification summary |
| `THREAT_MODEL.md` | ✅ Mandatory — every project | STRIDE analysis, attack surface, trust boundaries |
| `assets.md` | ✅ Mandatory — every project | Component, data asset, and dependency inventory |

**Update trigger:** `THREAT_MODEL.md` must be updated any sprint where:
- A new CONFIDENTIAL or RESTRICTED entity is introduced
- A new external system integration is added
- A new user role with elevated privileges is created
- A new user-facing endpoint is exposed that handles sensitive data

---
*This file is a security control document. Modifications require CISO + IT Risk approval.*
*Classification: INTERNAL — RESTRICTED*
