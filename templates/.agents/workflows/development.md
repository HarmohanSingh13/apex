---
description: "Development — Use when: implementing features, writing Angular components or .NET API handlers, following TDD, creating feature branches, creating test stubs alongside code, reviewing code for OWASP compliance during development, or integrating completed code via pull request. Full test implementation (Jest/xUnit/Cypress) is handled by the Test Agent — this agent creates stubs only."
---

# Development Agent

This workflow takes user stories or feature specifications as input and guides the implementation process — from analyzing the codebase to scaffolding, coding, integrating, and documenting.

---

## Entry Gate Check

Run this before anything else. If any hard gate fails, halt and list what is missing. Do not proceed to the Prerequisite or any subsequent step.

### Infer app name and artifact path
Derive `<app-name>` from the project root folder name, or find an existing `*-artifacts/` directory in the working tree.

### Hard gates (all must pass)

| Check | How to verify | Failure message |
|---|---|---|
| Active story specified | User has provided a story ID (US-XXX) and title | "Specify the story to implement (e.g. US-003 — Create PO draft)." |
| Design artifacts exist | `<app-name>-artifacts/design/` contains an architecture doc AND a schema file AND an API contracts file | "Design artifacts missing. Run the Design workflow before implementing." |
| Acceptance criteria available | `<app-name>-artifacts/requirements/*_acceptance_criteria_*.csv` contains rows for the active story | "No acceptance criteria found for [US-XXX]. Cannot implement without them." |
| `SECURITY.md` present | File exists at `<app-name>-artifacts/design/SECURITY.md` | "`SECURITY.md` missing. Run the Design workflow to generate it first." |

### State file cross-check (if present)
If `project_status.md` exists:
- Design row must be `✅ Done`. If not, surface a warning:
  > _"project_status.md shows Design as [status]. Proceeding with artifacts found on disk — verify design is complete before implementing."_
- Check the Sprint Backlog: if the active story's status is `✅ Done`, confirm the user intends to rework it before proceeding.

### Context load
If `app-context.md` exists:
- Read it. Section 2 (Technical Inventory) shows existing patterns, naming conventions, and integration points — follow them, do not diverge. Section 4 (Decision Log) shows settled choices — do not re-decide them during implementation.

### Override protocol
If the user explicitly instructs proceeding despite a failed gate:
> _"Type `confirm override: [your reason]` to bypass this gate. The override will be logged in project_status.md."_
Record the override in `project_status.md` → Open Decisions table before continuing.

---

## Prerequisite: Load Technology Skills

**Before starting any step**, detect the project's tech stack and load the corresponding skill files.

### Instructions

1. Scan the project root for stack indicators:
   - `angular.json` or `package.json` with `@angular/core` → **Angular project**
   - `*.csproj` or `*.sln` with `Microsoft.NET` → **.NET Core project**
   - Both present → **Full-stack project** (load both skills)
2. Load the core skill file(s) by reading:
   - `.agents/skills/angular-frontend/SKILL.md` — for all frontend work
   - `.agents/skills/dotnet-backend/dotnet-core.md` — Clean Architecture structure, naming conventions (always load for .NET)
   - `.agents/skills/dotnet-backend/dotnet-application.md` — CQRS handlers, FluentValidation, JWT auth, Serilog
   - `.agents/skills/dotnet-backend/dotnet-infrastructure.md` — EF Core + Dapper, DB rules, migration rules, Azure App Service deployment
   - **UI/UX theme skill** (load the one that matches the project brand — check `app-context.md` Section 1 or the Design artifacts to determine which theme was chosen in the Design phase):
     - Swaraj-branded → `.agents/skills/ui-ux-design/swaraj-theme-skill.md`
     - Mahindra-branded → `.agents/skills/ui-ux-design/mahindra-theme-core.md` (tokens) + `.agents/skills/ui-ux-design/mahindra-theme-components.md` (components)
     - Mahindra×Swaraj Hybrid → `.agents/skills/ui-ux-design/mahindra-swaraj-hybrid-skill.md`
3. If the user story involves calling an external system (SAP, ERP, third-party API), also load:
   - `.agents/skills/integrations/SKILL.md` — OData vs RFC/BAPI decision rules, anti-corruption layer, adapter scaffolding, resilience, data mapping, testing
4. Always load the security guardrails skill:
   - `.agents/skills/security-guardrails/guardrails-core.md` — mandatory behavior rules, NIST CSF controls, forbidden patterns, dependency governance, and VAPT quality gates
   - `.agents/skills/security-guardrails/guardrails-owasp.md` — CIS Level 1 hardening code templates and OWASP A01–A10 enforcement rules
5. **All subsequent steps MUST follow the conventions defined in the loaded skill(s).** The skill standards override any generic guidance in this workflow.
6. If no matching skill is found, fall back to the generic conventions in this workflow.

> **Critical:** Skills define project structure, naming conventions, coding patterns, testing standards, and architecture rules. Every file you create or modify must comply with the loaded skill(s).

---

## Step 1: Story Intake

Understand what needs to be built.

### Instructions

1. Ask the user: *"Which user story or feature are you implementing? (Provide a story ID, description, or link to the requirements document)"*
2. Gather the following for the target story:
   - **Story ID & Title** (e.g., `US-005: Create Permit Application Form`)
   - **Acceptance Criteria** — the Gherkin scenarios defining "done"
   - **Dependencies** — other stories or components this depends on
   - **Priority & Size** — from the sprint backlog
3. If the user provides a vague description, convert it into a proper user story format:
   ```
   As a [role],
   I want [goal],
   So that [benefit].
   ```
4. Confirm the scope with the user before proceeding.

---

## Step 2: Codebase Analysis

Understand the existing project conventions before writing code.

### What to Scan

| Area | What to Learn |
|---|---|
| **Project Structure** | Directory layout, naming conventions, file organization |
| **Framework & Stack** | Angular version, .NET version, language (TS/C#), SCSS approach |
| **Database** | EF Core entities + Fluent config, Dapper query patterns, migration history |
| **API Patterns** | Route structure, request/response patterns, middleware chain |
| **Auth Patterns** | How authentication/authorization is implemented |
| **UI Patterns** | Component structure, state management, styling conventions |
| **Error Handling** | How errors are caught, logged, and returned |
| **Testing** | Test framework, test file locations, naming conventions |
| **Existing Utilities** | Shared helpers, constants, types, validation functions |

### Instructions

1. Scan the project directory structure.
2. Read key configuration files (`package.json`, `tsconfig.json`, `*.csproj`, etc.).
3. **Cross-reference with loaded skill(s):** Verify the existing codebase follows the skill standards. Note any deviations.
4. Identify patterns from existing similar features (if extending a brownfield project).
5. Document the conventions found — all new code must follow these patterns **AND the loaded skill standards**.
6. If no existing project exists (greenfield), apply the skill standards as the default architecture:
   - **Angular:** Scaffold into `<app-name>-artifacts/development/<app-name>-ai/<app-name>-frontend/` using the feature-based standalone structure from the Angular skill
   - **.NET:** Scaffold into `<app-name>-artifacts/development/<app-name>-ai/<app-name>-backend/` using Clean Architecture with CQRS from the .NET skill
   - Security docs (`SECURITY.md`, `THREAT_MODEL.md`, `assets.md`) live at `<app-name>-artifacts/design/` — they are Design outputs, read here as reference but never modified or moved during Development

---

## Step 3: Implementation Planning

Break the story into discrete implementation tasks.

### Output Root Paths

> **All source files must be created under these roots — no exceptions:**
> - **Frontend (Angular):** `<app-name>-artifacts/development/<app-name>-ai/<app-name>-frontend/`
> - **Backend (.NET):** `<app-name>-artifacts/development/<app-name>-ai/<app-name>-backend/`
>
> Never create source files in the project root, in `<app-name>/app/`, or in any path that does not start with the above prefixes.

### Task Breakdown Format

```
### Implementation Plan for [Story ID]: [Story Title]

**Estimated Effort:** [T-shirt size]
**Output roots:**
  Frontend: <app-name>-artifacts/development/<app-name>-ai/<app-name>-frontend/
  Backend:  <app-name>-artifacts/development/<app-name>-ai/<app-name>-backend/

**Files to Create/Modify:**

| # | Task | File path (relative to output root above) | Layer |
|---|------|------------------------------------------|-------|
| 1 | EF Core entity + Fluent config | `<app-name>-backend/src/<App>.Infrastructure/Persistence/Configurations/[Resource]Configuration.cs` | Schema |
| 2 | Add EF Core migration | `<app-name>-backend/src/<App>.Infrastructure/Migrations/` (generated via dotnet ef) | Schema |
| 3 | CQRS Command + Handler | `<app-name>-backend/src/<App>.Application/Features/[Resource]/Commands/Create[Resource]Command.cs` | Backend |
| 4 | FluentValidation validator | `<app-name>-backend/src/<App>.Application/Features/[Resource]/Commands/Create[Resource]CommandValidator.cs` | Backend |
| 5 | API Controller | `<app-name>-backend/src/<App>.API/Controllers/[Resource]Controller.cs` | Backend |
| 6 | Angular feature service | `<app-name>-frontend/src/app/features/[resource]/[resource].service.ts` | Frontend |
| 7 | Angular standalone component | `<app-name>-frontend/src/app/features/[resource]/[resource]-list/[resource]-list.component.ts` | Frontend |
| 8 | Angular reactive form component | `<app-name>-frontend/src/app/features/[resource]/[resource]-form/[resource]-form.component.ts` | Frontend |
| 9 | Jest unit test stub | `<app-name>-frontend/src/app/features/[resource]/[resource].service.spec.ts` | Test stub |
| 10 | xUnit test stub | `<app-name>-backend/tests/<App>.Application.Tests/Features/[Resource]/Create[Resource]CommandHandlerTests.cs` | Test stub |
```

### Instructions

1. Break the story into tasks ordered by dependency (backend before frontend, schema before API).
2. Identify all files that need to be created or modified.
3. Estimate sub-task complexity.
4. **If the story involves a high-risk feature area, run a WebSearch before planning the implementation** (see below).
5. Present the plan to the user for approval before coding.

### Optional: WebSearch for High-Risk Features

If the story involves any of the following, search for the latest guidance before writing the implementation plan. Static checklists cover stable patterns; these searches catch recent advisories, new CVEs, and updated best-practice recommendations.

| Feature Area | Searches to Run |
|---|---|
| **Authentication / JWT / OAuth** | `"OWASP authentication cheat sheet [current year]"` · `"JWT security best practices [current year]"` |
| **File upload / storage** | `"OWASP file upload cheat sheet [current year]"` · `"Azure Blob Storage secure upload [current year]"` |
| **Payment / financial data** | `"OWASP payment card cheat sheet [current year]"` · `"PCI DSS API security [current year]"` |
| **External API / SAP integration** | `"OWASP API security top 10 [current year]"` · `"SonarQube [framework] HTTP client security rules [current year]"` |
| **Rich text / user-generated content** | `"OWASP XSS prevention cheat sheet [current year]"` · `"Angular DomSanitizer bypass risks [current year]"` |

> Skip this step for standard CRUD features (forms, lists, detail views) — the three checklists in Step 5 are sufficient.

---

## Step 4: Scaffolding

Create the file structure and boilerplate for the feature.

> **Output path reminder:** Every file created in this step must live under one of the two output roots established in Step 3. Before writing any file, confirm its full path starts with `<app-name>-artifacts/development/<app-name>-ai/<app-name>-frontend/` or `<app-name>-artifacts/development/<app-name>-ai/<app-name>-backend/`. If a file path does not start with one of these roots, stop and recalculate the correct path before proceeding.

### Instructions

1. Create all necessary directories and files identified in Step 3.
2. **Use the loaded skill's templates and patterns:**
   - **Angular frontend:** Follow the Angular skill for standalone components, feature services, reactive forms, store patterns, routing, and test files. Use the exact file naming and folder structure from the skill.
   - **.NET backend:** Follow the .NET skill for controllers, commands/queries (CQRS), validators (FluentValidation), entity configurations (EF Core), and repository patterns. Use Clean Architecture layer separation.
3. Add boilerplate code following the skill conventions:
   - **API/Controllers:** Use the controller or minimal API pattern from the .NET skill with MediatR dispatch.
   - **Database:** EF Core entity + Fluent configuration from the .NET skill, or Dapper for read-heavy queries.
  - **UI Components:** Standalone Angular components with HTML/SCSS following the **exact classes, styles, and structures defined in the UI/UX skill** (e.g. Swaraj Green headers, soft card shadows).
  - **Frontend API configuration:** Create or update Angular environment files so API access is driven by `apiUrl` (`environment.dev.ts` / `environment.prod.ts`), and consume this value from services/interceptors.
   - **Forms:** Typed reactive forms per the Angular skill.
   - **Tests:** Create test stubs only — file + `describe`/class block + empty `it`/`[Fact]` stubs named after acceptance criteria scenarios. Do **not** implement test logic here. The Test Agent fills all test implementations in the next phase. Stubs must compile with no errors.
4. Ensure all imports, DI registrations, and module references are correct.
5. Run a quick build/lint check to verify no syntax errors.

### Angular API URL Standard

- Do not hardcode API routes with a fixed host in services.
- Prefer `apiUrl` from Angular environment files for all backend calls.
- Construct feature endpoints via environment-based base URL (for example: `${environment.apiUrl}/portals`).
- Keep `environment.dev.ts` and `environment.prod.ts` aligned with deployment topology (including virtual directory paths when backend is not at root).

> **Important:** Do NOT use generic scaffolding templates. Always refer to the code examples in the loaded skill file(s) for the exact patterns to follow.

---

## Step 5: Implementation

Write the actual feature code.

### Coding Standards

| Principle | Guideline |
|---|---|
| **DRY** | Don't Repeat Yourself — extract shared logic into utilities |
| **SOLID** | Single responsibility, open/closed, Liskov substitution, interface segregation, dependency inversion |
| **Error Handling** | Always handle errors explicitly; never swallow exceptions |
| **Input Validation** | Validate and sanitize ALL user inputs on the server side |
| **Type Safety** | Use TypeScript strictly — avoid `any` types |
| **Performance** | Use pagination for lists; avoid N+1 queries; optimize renders |
| **Accessibility** | Semantic HTML; ARIA labels; keyboard navigation |

### Security Implementation Checklists

> **Security Checklists — Last Reviewed: April 2026**
> These checklists cover OWASP Top 10, SAST CWE rules, and DAST runtime behaviours. Review and update annually, or whenever OWASP publishes a new Top 10 release.

> **Guardrails Relationship:** The loaded `guardrails-core.md` and `guardrails-owasp.md` are the upstream authority for all security rules. The three checklists below are the workflow-level operationalization of those rules for this stack. Where the guardrails skill contains more specific or stricter guidance (e.g. exact CIS hardening patterns, data classification requirements, forbidden patterns list), the guardrails skill takes precedence. Every code file generated in this step must comply with both the checklists below and the mandatory behavior rules in the guardrails skill.

Code produced by this agent must satisfy **all three checklists** below before being considered complete. The goal is zero findings when OWASP ZAP (DAST) and SonarCloud/Semgrep (SAST) run in the pipeline. Do not defer any item to a later sprint.

> **Test scope boundary:** This agent's responsibility ends at creating test stubs (compilable empty skeletons). Full test implementation — Arrange/Act/Assert bodies, coverage verification, Cypress E2E scenarios — is the Test Agent's responsibility. Do not write test implementations here; focus on making production code testable (proper dependency injection, no tight coupling, `data-testid` attributes on all interactive elements).

---

#### A — OWASP Top 10

> **Single source of truth:** The full A01–A10 enforcement rules, forbidden patterns, and code-level examples live in `.agents/skills/security-guardrails/guardrails-owasp.md` → `## OWASP TOP 10 — ENFORCEMENT RULES`. Load that section and apply every rule to the code being generated. Do **not** interpret the summary rows below as complete — they are memory-aids only; the guardrails skill is the binding specification.

| Ref | Stack-specific implementation note (see guardrails skill for full rule) |
|---|---|
| **A01 — Access Control** | `[Authorize(Policy="...")]` or `[Authorize(Roles="...")]` on every controller/action — plain `[Authorize]` without a role or policy is **prohibited**; every endpoint must declare its minimum required role or policy explicitly; never trust client-supplied identity |
| **A02 — Cryptographic Failures** | All secrets via Azure Key Vault / env vars; BCrypt for passwords; never hardcode credentials |
| **A03 — Injection** | EF Core LINQ or parameterised Dapper only; never concatenate user input into SQL/LDAP/shell/path strings |
| **A04 — Insecure Design** | Rate-limiting middleware; account lockout after N failures; no mass-assignment on request DTOs |
| **A05 — Security Misconfiguration** | CORS `WithOrigins([config])`; Swagger disabled in Production; see DAST checklist for required headers |
| **A06 — Vulnerable Components** | Pin NuGet and npm packages; run `dotnet list package --vulnerable` and `npm audit` before committing |
| **A07 — Auth Failures** | JWT `ValidateLifetime = true`; short expiry + refresh token rotation; never skip `[Authorize]` on data routes |
| **A08 — Data Integrity** | FluentValidation via MediatR pipeline behaviour; never bypass model validation; strict JSON deserialization |
| **A09 — Logging Failures** | Serilog structured logging; never log passwords, tokens, PII, or connection strings |
| **A10 — SSRF** | No user-controlled URLs in `HttpClient` calls; allowlist outbound domains in configuration |
| **XSS** | Angular template binding only; never `bypassSecurityTrustHtml/Url/Script/Style` or `innerHTML` with user data |
| **Sensitive Data** | Strip `PasswordHash`, raw internal IDs, and audit fields from every response DTO |

---

#### B — SAST Hardening Rules

These are the specific code patterns that SAST tools (SonarCloud, Semgrep, Checkmarx) flag as CWE violations. Write code that avoids these from the start.

**Backend (.NET)**

| CWE | Rule | Correct Pattern |
|---|---|---|
| CWE-330 | Never use `System.Random` for security-sensitive values (tokens, IDs, salts) | Use `RandomNumberGenerator.GetBytes()` or `Guid.NewGuid()` |
| CWE-327 | Never use `MD5`, `SHA1`, or `DES` for hashing or encryption | Use `BCrypt` for passwords; `SHA-256`+ for digests; `AES-GCM` for encryption |
| CWE-611 | Disable DTD processing on all XML readers | `XmlReaderSettings { DtdProcessing = DtdProcessing.Prohibit }` |
| CWE-22 | Never pass user input directly to file path APIs | Validate and sanitise paths; use `Path.GetFullPath()` and check it starts within allowed base directory |
| CWE-78 | Never pass user input to `Process.Start()` or shell commands | Avoid shell execution entirely; if required, whitelist allowed commands only |
| CWE-502 | Never deserialise untrusted input with `BinaryFormatter` or `JavaScriptSerializer` | Use `System.Text.Json` with strict type handling; never use `TypeNameHandling.All` in Newtonsoft |
| CWE-352 | Anti-forgery on all state-changing endpoints (if using cookie-based auth) | `[ValidateAntiForgeryToken]` or `IAntiforgery` service for non-JWT endpoints |
| CWE-532 | Never log sensitive values | Never pass passwords, tokens, or PII as Serilog structured properties |
| CWE-1333 | Set timeout on all user-supplied Regex patterns | `new Regex(pattern, options, TimeSpan.FromSeconds(1))` |
| CWE-259 | No hardcoded passwords, secrets, or API keys in any source file — including test files | All secrets from `IConfiguration` backed by Key Vault or environment variables; in tests use `Environment.GetEnvironmentVariable("TEST_USER_PASSWORD")` or generate a random value with `Guid.NewGuid().ToString()` — never a recognisable string |
| CWE-113 | Never echo HTTP request header values into response headers without strict format validation | Validate against an allowlist regex before reflecting (e.g. UUID format for correlation IDs: `^[a-fA-F0-9\-]{8,64}$`); generate a new `Guid.NewGuid().ToString()` if the input fails validation — never pass raw header values through |
| CWE-213 | Never return command objects, entity objects, or full domain models from API actions | Always create a purpose-built `[Resource]ResponseDto` containing only the fields the client needs; never rely on `[JsonIgnore]` as the sole protection against data exposure |
| General | Suppress server version information | `builder.WebHost.ConfigureKestrel(o => o.AddServerHeader = false)` |
| General | Remove `X-Powered-By` header | Add to security headers middleware (see DAST section) |
| General | `[ApiController]` model validation must not be bypassed | Never set `SuppressModelStateInvalidFilter = true` |

**Frontend (TypeScript / Angular)**

| CWE | Rule | Correct Pattern |
|---|---|---|
| CWE-79 | Never use `innerHTML`, `outerHTML`, or `document.write()` with user data | Use Angular template binding `{{ value }}`; Angular sanitises automatically |
| CWE-79 | Never bypass Angular's DOM sanitiser | No `bypassSecurityTrustHtml/Url/Script/Style/ResourceUrl` unless reviewed and documented |
| CWE-95 | Never use `eval()`, `new Function()`, or `setTimeout(string)` | Use typed functions; never evaluate strings as code |
| CWE-330 | Never use `Math.random()` for IDs, tokens, or nonces | Use `crypto.randomUUID()` or `crypto.getRandomValues()` |
| CWE-312 | Never log or store sensitive data in `console.log`, `localStorage`, or `sessionStorage` beyond what is necessary | JWT in `localStorage` is an accepted tradeoff for SPAs — document it; never store passwords or PII |
| CWE-259 | No API keys, client secrets, or environment-specific URLs hardcoded in TypeScript | All config via Angular environment files; sensitive values never in frontend code |
| General | No `any` type on security-sensitive data structures (auth responses, user objects) | Use typed interfaces; TypeScript strict mode enabled |
| General | No `console.log` in production code with request/response payloads | Remove debug logs before commit; use structured logging service if needed |

---

#### C — DAST Hardening Rules

These are the runtime behaviours that DAST tools (OWASP ZAP, Burp Suite, Acunetix) probe for. Implement them at the infrastructure/middleware level so every endpoint inherits them automatically.

> **Deployment reality:** The app runs behind a reverse proxy (Cloudflare CDN + Azure App Service). TLS is terminated at Cloudflare — Kestrel receives plain HTTP internally. This means `context.Request.IsHttps` is always `false` unless ForwardedHeaders middleware is configured first. Missing this causes HSTS to never be sent, which a DAST scanner reports as a Medium finding. Additionally, the .NET middleware pipeline only covers API responses — Angular's static `.js`/`.css` files are served by IIS directly and bypass the middleware entirely, causing XCTO, CSP, and Permissions-Policy to be missing on those assets. Both gaps must be addressed.

**Step 1 — Forward Headers (must be first in Program.cs)**

Add before any other middleware so that `IsHttps`, `RemoteIpAddress`, and `Scheme` reflect the original client request rather than the internal proxy hop:

```csharp
// Program.cs — MUST be before UseStaticFiles, UseAuthentication, and security headers
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    // Trust all proxies (Cloudflare IPs rotate) — restrict to Cloudflare CIDR in high-security deployments
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();
app.UseForwardedHeaders(); // ← FIRST middleware
```

**Step 2 — Security Headers Middleware (.NET API responses)**

Add immediately after `UseForwardedHeaders()`, before `UseAuthentication`:

```csharp
app.Use(async (context, next) =>
{
    var headers = context.Response.Headers;
    headers.Append("X-Content-Type-Options",  "nosniff");
    headers.Append("X-Frame-Options",          "DENY");
    headers.Append("X-XSS-Protection",         "1; mode=block");
    headers.Append("Referrer-Policy",          "strict-origin-when-cross-origin");
    headers.Append("Permissions-Policy",       "camera=(), microphone=(), geolocation=(), payment=()");
    headers.Append("Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';");
    // HSTS — works correctly because UseForwardedHeaders() above sets IsHttps from X-Forwarded-Proto
    if (context.Request.IsHttps)
        headers.Append("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    headers.Remove("Server");
    headers.Remove("X-Powered-By");
    await next();
});
```

**Step 3 — Angular Static Files: `web.config` (IIS / Azure App Service)**

The .NET middleware pipeline does **not** cover static Angular assets (`.js`, `.css` chunks). IIS serves these directly, bypassing all middleware. Add a `web.config` to the Angular project's `public/` folder so it is included in the build output and applied by IIS for every static file response:

```xml
<!-- <app-name>-frontend/public/web.config -->
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <httpProtocol>
      <customHeaders>
        <add name="X-Content-Type-Options"   value="nosniff" />
        <add name="X-Frame-Options"           value="DENY" />
        <add name="X-XSS-Protection"          value="1; mode=block" />
        <add name="Referrer-Policy"           value="strict-origin-when-cross-origin" />
        <add name="Permissions-Policy"        value="camera=(), microphone=(), geolocation=(), payment=()" />
        <add name="Content-Security-Policy"
             value="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';" />
        <add name="Strict-Transport-Security" value="max-age=31536000; includeSubDomains" />
      </customHeaders>
      <redirectHeaders>
        <clear />
      </redirectHeaders>
    </httpProtocol>
    <!-- Angular client-side routing: serve index.html for all non-file routes -->
    <rewrite>
      <rules>
        <rule name="Angular Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile"      negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

> **Note:** If the Angular app is hosted as a virtual application under a .NET API (e.g. `/` serves Angular, `/api` serves .NET), wrap the rewrite rules in `<location path="." inheritInChildApplications="false">` to prevent the rewrite from intercepting the `/api` sub-application routes.

**Step 4 — Sensitive API Response Caching**

```csharp
[HttpGet]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public async Task<IActionResult> GetSensitiveData() { ... }
```

**Step 5 — Cookie Security (if cookies are used)**

```csharp
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly   = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite  = SameSiteMode.Strict;
    // Scope to exact host — do NOT set Domain to parent domain
});
```

> **Cloudflare cookies (`__cf_bm`, `__cflb`):** These are injected by Cloudflare's Bot Management and are scoped to the parent domain by Cloudflare, not the application. They cannot be controlled in application code — this is expected and should be documented as a known-accepted finding in THREAT_MODEL.md.

**Step 6 — Information Leakage Prevention**

| Rule | Implementation |
|---|---|
| Error responses never include stack traces | Global exception middleware returns generic `500`; detail only in `Local` environment |
| API version not exposed in response headers | Do not add `api-version` to response headers |
| No sensitive data in URL query parameters | Sensitive values in request body or route only |
| Swagger disabled in Production | Gate behind `IsEnvironment("Local") \|\| IsEnvironment("Development")` only |

**DAST Checklist — Verify Before Considering Complete**

| Check | Expected Result | Scope |
|---|---|---|
| `X-Content-Type-Options` present | `nosniff` | API responses + static files (web.config) |
| `X-Frame-Options` present | `DENY` | API responses + static files (web.config) |
| `Strict-Transport-Security` present | `max-age=31536000; includeSubDomains` | API responses + static files (web.config) |
| `Content-Security-Policy` present | Restrictive policy (no `unsafe-eval`) | API responses + static files (web.config) |
| `Permissions-Policy` present | Disable camera, mic, geo, payment | API responses + static files (web.config) |
| `Referrer-Policy` present | `strict-origin-when-cross-origin` | API responses + static files (web.config) |
| `Server` header absent | Not present | API responses |
| ForwardedHeaders middleware registered | First in pipeline | Program.cs |
| Stack trace absent from error responses | Generic message in non-Local | API responses |
| Sensitive endpoints return `Cache-Control: no-store` | Present on auth + data endpoints | API responses |
| Cookies have `HttpOnly`, `Secure`, `SameSite=Strict` | All three flags set | Application cookies only |
| CORS does not respond to arbitrary origins | `WithOrigins([configuredList])` only | API responses |

> **Standard:** All three checklists (OWASP, SAST, DAST) must be satisfied before implementation is marked complete. When the `/soc-review` agent runs on this code, security findings should be zero or limited to accepted architectural deferrals (e.g. JWT in localStorage for SPA) that are explicitly documented. Any deferral must be cross-referenced against the VAPT Remediation SLA in `guardrails-core.md` — Critical and High findings cannot be deferred regardless of sprint priority.

### Implementation Order

1. **Database layer** — Schema changes, migrations, seed data
2. **Business logic** — Core functions, validation rules, workflow logic
3. **API layer** — Route handlers, middleware, request/response mapping
4. **UI layer** — Pages, components, forms, data display
5. **Integration** — Connect frontend to backend, test data flow
6. **Polish** — Error states, loading states, empty states, edge cases

### Instructions

1. Follow the implementation order above.
2. After completing each layer, run a quick verification:
   - Database: `dotnet ef migrations add <Name>` then verify migration file; apply with `dotnet ef database update` locally
   - API: Test with a sample request
   - UI: Visual check in browser
3. Commit logically — one commit per layer or per meaningful unit of work.
4. Reference the acceptance criteria throughout to ensure nothing is missed.

---

## Step 6: Integration & Wiring

Connect all layers and ensure end-to-end functionality.

### Checklist

- [ ] Frontend calls the correct API endpoints
- [ ] API properly validates inputs and returns appropriate responses
- [ ] Database queries are optimized (no N+1, proper indexes)
- [ ] Authentication/authorization is enforced at all layers
- [ ] Error states are handled and displayed to the user
- [ ] Loading states are shown during async operations
- [ ] Navigation/routing works correctly
- [ ] Form submission, validation, and feedback work end-to-end
- [ ] File uploads (if applicable) work with size/type restrictions

### Security Baseline Verification (mandatory — do not skip)

Before marking any story complete, verify these two baseline items are present and correct in the project. If either is missing or incorrect, fix it as part of this story — do not defer.

- [ ] **`Program.cs`** — `app.UseForwardedHeaders()` is the **first** middleware call, registered before `UseAuthentication`, `UseAuthorization`, `UseHsts`, and the security headers middleware. Without this, `context.Request.IsHttps` is always `false` behind Cloudflare/CDN and HSTS is never sent.
- [ ] **`<app-name>-frontend/public/web.config`** — file exists and contains all six security headers from the DAST template: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy`, `Permissions-Policy`, and `Referrer-Policy`. This covers Angular static assets which bypass the .NET middleware pipeline entirely.

### Instructions

1. Test the complete user flow end-to-end.
2. Verify each acceptance criterion from the user story.
3. Test error scenarios (invalid input, unauthorized access, network failure).
4. Check browser console for errors or warnings.
5. Fix any integration issues found.

---

## Step 7: Documentation

Document what was built for future maintainability.

### Deliverables

| Artifact | Description |
|---|---|
| **Code Comments** | Inline comments for complex logic, JSDoc for public functions |
| **README Updates** | Update project README if new setup steps or features are added |
| **API Documentation** | Document new endpoints (can be inline or in a separate doc) |
| **Changelog Entry** | Brief description of what was added/changed |

### Changelog Entry Format

```markdown
## [Version] — [YYYY-MM-DD]

### Added
- [US-005] Permit application form with multi-step wizard
- [US-005] File upload support for permit attachments
- [US-005] API endpoint: POST /api/permits

### Changed
- Updated navigation to include new permit creation link

### Fixed
- N/A
```

### Instructions

1. Add JSDoc comments to all new public functions and components.
2. Update the project README if setup steps changed.
3. Create or update the changelog.
4. Ensure all new files have a brief header comment explaining their purpose.

---

## Step 8: Output Summary & Audit Artifact

Provide a summary of all work done and generate the mandatory implementation summary artifact.

### Summary Format

```markdown
## Implementation Summary — [Story ID]: [Story Title]

### Files Created
| File | Purpose |
|------|---------|
| `<app-name>-backend/src/<App>.Application/Features/Permits/Commands/CreatePermitCommand.cs` | CQRS command + handler for permit creation |
| `<app-name>-backend/src/<App>.API/Controllers/PermitsController.cs` | REST controller — POST /api/permits |
| `<app-name>-backend/src/<App>.Infrastructure/Migrations/20240101_AddPermit.cs` | EF Core migration — Permits table |
| `<app-name>-frontend/src/app/features/permits/permit-form/permit-form.component.ts` | Reactive form component for permit creation |

### Files Modified
| File | Change |
|------|--------|
| `<app-name>-backend/src/<App>.Infrastructure/Persistence/AppDbContext.cs` | Added Permits DbSet |
| `<app-name>-frontend/src/app/features/permits/permits.routes.ts` | Registered permit-form route |

### Acceptance Criteria Status
| Criterion | Status | Implementation Notes |
|-----------|--------|----------------------|
| User can submit a permit | ✅ Passed | Handled in `CreatePermitCommand` |
| Validation errors shown | ✅ Passed | Client-side reactive forms + FluentValidation |
| Unauthorized access blocked | ✅ Passed | `[Authorize]` attribute on controller |

### Remaining Items
- [ ] Any deferred items or known limitations
```

### Instructions

1. List all files created and modified.
2. Map each acceptance criterion to its implementation status with brief notes.
3. Note any deferred items, known limitations, or follow-up tasks.
4. **MANDATORY Audit Artifact:**
   - Infer `<app-name>` from the project root folder name.
   - Output path: `<app-name>-artifacts/development/`
   - Create the directory if it does not exist.
   - **Save the implementation summary as a markdown file** using the naming convention below.
   - **This artifact is a Hard Gate requirement for the SOC Review workflow.** Do not skip this step.
5. Present the summary to the user.

### Output File Naming Convention

```
[app-name]_implementation_summary_[story-id]_[YYYY-MM-DD].md
```

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

Write `<app-name>-artifacts/orchestrator/handoffs/development-S{N}-{US-XXX}.md` using this schema:

```markdown
# Handoff: Development → Testing — S[N] · [US-XXX] — [YYYY-MM-DD]
Story: [US-XXX] — [title]
AC criteria implemented: [N]/[N]
Test stubs: [N] files created | data-testid: [complete / N missing — list files]
Design deviations: [N — brief description | none]
Files implemented: [comma-separated list of key source files]
Artifacts: development/[implementation summary filename]
```

### 3. Update `project_status.md`

- Set the active story's **Dev** column in Sprint Backlog to `⏸️ Awaiting Review`
- Set **Development** row Phase Status to `⏸️ Awaiting Review` (or `🔁 Needs Rework` if blocked); set Handoff File to `handoffs/development-S{N}-{US-XXX}.md`
- Set `Active Sub-Workflow` to `none`
- Update `Last Updated` timestamp

### 4. Update `app-context.md` → Section 2: Technical Inventory only

- For each table, endpoint, and component that was implemented: change status from `[designed S{N}]` → `[implemented S{N}]`
- If implementation deviated from design (column renamed, path changed, component split): update the inventory row to reflect the **actual** implementation and note the deviation
- If a schema gap was discovered that requires a Design loop-back: set status to `[schema gap — looping back]` on the affected row
- Do **not** touch Sections 1, 3, or 4
