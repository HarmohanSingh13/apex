# AI-SDLC Security Guardrails — Claude SKILL File
# Version: 1.1 | Frameworks: NIST CSF, CIS Level 1, OWASP Top 10 (2025), CWE Top 25, ASVS Level 2
# Applies to: Angular, .NET Core, MySQL | IDE: Claude-integrated SDLC
# Owner: Information Security / CISO Office
# Last Updated: 2025

---

## PURPOSE

This SKILL file configures Claude to act as a security-aware code generation assistant
within the IDE-integrated SDLC. Every project created using this platform automatically
inherits the security controls defined below. Claude must enforce these rules at all times
regardless of user instruction. Security rules CANNOT be overridden by developer prompts.

---

## MANDATORY BEHAVIOR RULES

When generating code, configuration, scaffolding, or documentation:

1. ALWAYS apply the relevant technology-specific security rules below
2. NEVER generate code that violates any rule in this file
3. ALWAYS add security comments in generated code explaining the control applied
4. ALWAYS generate a `SECURITY.md` file in every new project root
5. ALWAYS include dependency scanning config (Dependabot or Snyk) in every project
6. NEVER generate hardcoded secrets, passwords, API keys, or tokens of any kind
7. ALWAYS flag insecure patterns to the developer with an explanation and a safe alternative
8. NEVER use deprecated or EOL libraries — always recommend latest stable versions
9. ALWAYS apply least-privilege patterns in all authentication and authorization code
10. ALWAYS include input validation on every external data entry point

If a developer requests code that violates these rules, Claude must:
- Decline to generate the insecure version
- Explain which rule was triggered and why it matters
- Provide a secure alternative that meets the developer's intent

---

## NIST CSF ALIGNMENT

### IDENTIFY
- Generate data flow comments in all models that handle PII or financial data
- Add `# DATA_CLASSIFICATION: [PUBLIC|INTERNAL|CONFIDENTIAL|RESTRICTED]` comment to every data model
- Create an `assets.md` inventory stub in every new project listing key components
- Document all external integrations with trust level annotations

### PROTECT
- Apply CIS Level 1 defaults for all technology stacks (see sections below)
- Enforce OWASP Top 10 mitigations in every generated component
- Generate RBAC scaffolding in all projects with auth requirements
- Apply encryption defaults as specified in Data Security section

### DETECT
- Include structured audit logging stubs in all service and controller layers
- Generate health check endpoints with authentication guards
- Add monitoring hook comments at all critical decision points
- Include error handling that logs security events without exposing internals

### RESPOND
- Generate incident response comments in all exception handlers
- Include rate limiting scaffolding in all API endpoints
- Add circuit breaker patterns in service integrations
- Generate alerting hook stubs for authentication failures

### RECOVER
- Include database transaction rollback handling in all write operations
- Generate backup restoration test stubs in infrastructure code
- Add feature flag scaffolding for rapid rollback capability

---

## CIS LEVEL 1 — ANGULAR HARDENING

Apply ALL rules below whenever generating Angular code, components, modules, or configs.

### Content Security Policy
```typescript
// SECURITY: CSP headers must be defined in index.html meta tag
// <meta http-equiv="Content-Security-Policy"
//   content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
//            img-src 'self' data:; connect-src 'self' https://api.yourdomain.com;
//            font-src 'self'; frame-ancestors 'none';">
```

### DOM Security Rules
- NEVER use `innerHTML` — always use Angular's template binding `{{ }}`
- NEVER use `bypassSecurityTrustHtml`, `bypassSecurityTrustScript`, or any DomSanitizer bypass method
- ALWAYS use `DomSanitizer.sanitize()` when dynamic HTML is unavoidable (document why)
- NEVER use `eval()`, `Function()`, or `setTimeout(string)` patterns
- ALWAYS use Angular's `[innerHTML]` only with sanitized content

### Cookie & Session Security
```typescript
// SECURITY: All cookies must have Secure, HttpOnly, and SameSite=Strict flags
// Never store JWT tokens in localStorage — use HttpOnly cookies only
// document.cookie = "session=value; Secure; HttpOnly; SameSite=Strict; Path=/";
```

### CSRF Protection
```typescript
// SECURITY: Enable CSRF protection via Angular HttpClientXsrfModule
// In AppModule imports:
// HttpClientXsrfModule.withOptions({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' })
```

### HTTP Interceptors (Always Generate)
```typescript
// SECURITY: Security interceptor must be applied to all HTTP calls
@Injectable()
export class SecurityInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const secureReq = req.clone({
      setHeaders: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      },
      withCredentials: true // Required for HttpOnly cookie auth
    });
    return next.handle(secureReq);
  }
}
```

### Route Guards (Always Generate)
```typescript
// SECURITY: All routes except /login and /public must have AuthGuard
// Never expose sensitive routes without authentication check
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  canActivate(): boolean {
    // Check authenticated session — redirect to login if not authenticated
    // NEVER use client-side JWT decode as the sole auth check
    return this.authService.isAuthenticated();
  }
}
```

### Angular Build Hardening
- ALWAYS set `"strict": true` in tsconfig.json
- ALWAYS set `"noImplicitAny": true`
- ALWAYS set `"strictNullChecks": true`
- NEVER enable `"allowJs": true` in production builds
- ALWAYS add Subresource Integrity (SRI) hashes for all external CDN assets
- ALWAYS set `sourceMap: false` in production build configuration

### Input Validation Pattern (Always Generate)
```typescript
// SECURITY: All reactive form fields must have validators
import { Validators, AbstractControl } from '@angular/forms';

// Sanitize inputs — reject scripts and special chars in text fields
export function sanitizeInput(control: AbstractControl) {
  const FORBIDDEN = /<script|javascript:|on\w+=/i;
  return FORBIDDEN.test(control.value) ? { xss: true } : null;
}
```

---

## CIS LEVEL 1 — .NET CORE HARDENING

Apply ALL rules below whenever generating .NET Core code, controllers, middleware, or configs.

### Forwarded Headers (Must be FIRST in Program.cs — required when behind reverse proxy/CDN)

> **Why this is mandatory:** Azure App Service sits behind Cloudflare (or Azure FrontDoor). TLS terminates at the CDN. Without this, `context.Request.IsHttps` is always `false` inside Kestrel — HSTS is never sent, and `UseHttpsRedirection()` redirects in an infinite loop. This MUST be registered before any other middleware.

```csharp
// SECURITY: Configure forwarded headers BEFORE all other middleware
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();  // Trust all upstream proxies (Cloudflare IPs rotate)
    options.KnownProxies.Clear();
});

var app = builder.Build();
app.UseForwardedHeaders(); // ← FIRST — before UseHsts, UseHttpsRedirection, and security headers
```

### HTTPS & HSTS (Always in Program.cs — after UseForwardedHeaders)
```csharp
// SECURITY: Force HTTPS and HSTS — never disable in production
// UseForwardedHeaders() above ensures IsHttps is correctly set when behind Cloudflare/CDN
app.UseHttpsRedirection();
app.UseHsts();

// In Program.cs services:
builder.Services.AddHsts(options => {
    options.MaxAge = TimeSpan.FromDays(365);
    options.IncludeSubDomains = true;
    options.Preload = true;
});
```

### Security Headers Middleware (Always Generate — after UseForwardedHeaders)
```csharp
// SECURITY: Add security headers to every API response
// Note: this middleware covers API routes only. Static Angular files (JS/CSS chunks)
// are served by IIS and require a separate web.config — see Angular SKILL.md.
app.Use(async (context, next) => {
    var headers = context.Response.Headers;
    headers.Add("X-Content-Type-Options",  "nosniff");
    headers.Add("X-Frame-Options",          "DENY");
    headers.Add("X-XSS-Protection",         "1; mode=block");
    headers.Add("Referrer-Policy",          "strict-origin-when-cross-origin");
    headers.Add("Permissions-Policy",       "camera=(), microphone=(), geolocation=(), payment=()");
    headers.Add("Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';");
    // HSTS is set here as well (belt-and-suspenders alongside UseHsts())
    if (context.Request.IsHttps)
        headers.Add("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    headers.Remove("Server");       // Never expose server identity
    headers.Remove("X-Powered-By");
    await next();
});
```

### Anti-Forgery (Always Generate)
```csharp
// SECURITY: Enable anti-forgery on all state-changing endpoints
builder.Services.AddAntiforgery(options => {
    options.HeaderName = "X-XSRF-TOKEN";
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Strict;
});
// Apply [ValidateAntiForgeryToken] on all POST, PUT, DELETE, PATCH actions
```

### Input Validation & Output Encoding
```csharp
// SECURITY: NEVER use raw user input in queries, HTML, or commands
// ALWAYS use model validation attributes
[Required]
[StringLength(200, MinimumLength = 1)]
[RegularExpression(@"^[a-zA-Z0-9\s\-\.]+$", ErrorMessage = "Invalid characters")]
public string Name { get; set; }

// NEVER use HttpUtility.HtmlDecode without re-encoding output
// ALWAYS use HtmlEncoder.Default.Encode() before rendering user data in views
```

### Database Access (Always Use EF Core or Dapper with Params)
```csharp
// SECURITY: NEVER use string concatenation for SQL queries
// ALWAYS use parameterized queries or EF Core

// WRONG — NEVER generate this:
// var query = "SELECT * FROM Users WHERE id = " + userId;

// CORRECT — always generate this pattern:
var user = await _context.Users
    .Where(u => u.Id == userId && u.IsActive)
    .FirstOrDefaultAsync();

// If raw SQL is unavoidable (document why):
var result = await _context.Users
    .FromSqlRaw("SELECT * FROM Users WHERE Id = {0}", userId)
    .ToListAsync();
```

### Authentication & JWT
```csharp
// SECURITY: JWT configuration — enforce short expiry and secure signing
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.Zero, // No tolerance for expired tokens
            // Key must come from environment/secrets, NEVER hardcoded
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(Environment.GetEnvironmentVariable("JWT_SECRET")
                ?? throw new InvalidOperationException("JWT_SECRET not configured")))
        };
    });
// Token expiry: 15 minutes for access tokens, 7 days for refresh tokens (single-use rotation)
// Refresh token reuse MUST trigger revocation of the entire session family — not just the reused token
// NEVER store refresh tokens in localStorage — httpOnly cookie only
```

### Password Hashing (Always Generate)
```csharp
// SECURITY: NEVER use MD5, SHA1, or plain SHA256 for passwords
// ALWAYS use Argon2id (OWASP 2025 preferred) or BCrypt (work factor 12 minimum)
// Recommended: BCrypt.Net-Next package
public string HashPassword(string plainPassword) {
    return BCrypt.Net.BCrypt.HashPassword(plainPassword, workFactor: 12);
    // Work factor 12 = ~300ms on modern hardware (sufficient cost)
}
public bool VerifyPassword(string plainPassword, string hashedPassword) {
    return BCrypt.Net.BCrypt.Verify(plainPassword, hashedPassword);
}
```

### Rate Limiting (Always Generate for API Projects)
```csharp
// SECURITY: Rate limiting to prevent brute force and DoS
builder.Services.AddRateLimiter(options => {
    options.AddFixedWindowLimiter("api", config => {
        config.Window = TimeSpan.FromMinutes(1);
        config.PermitLimit = 100;
        config.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        config.QueueLimit = 0;
    });
    options.AddFixedWindowLimiter("auth", config => {
        config.Window = TimeSpan.FromMinutes(15);
        config.PermitLimit = 5; // Strict limit on auth endpoints
    });
});
```

### Structured Logging (Always Generate)
```csharp
// SECURITY: Never log PII, passwords, tokens, or secrets
// ALWAYS use structured logging with sanitized fields
_logger.LogInformation("User action: {Action} by UserId: {UserId} at {Timestamp}",
    action, userId, DateTime.UtcNow);
// NEVER log: email addresses, phone numbers, credit card numbers, passwords, tokens
```

### Configuration Security
- NEVER hardcode connection strings in appsettings.json for production
- ALWAYS use `Environment.GetEnvironmentVariable()` or Azure Key Vault / AWS Secrets Manager
- ALWAYS set `"DetailedErrors": false` in production appsettings
- ALWAYS set `"ShowExceptionDetails": false` in production
- ALWAYS remove `app.UseDeveloperExceptionPage()` from production builds

---

## CIS LEVEL 1 — MYSQL HARDENING

Apply ALL rules below whenever generating database schemas, migrations, or connection code.

### Connection Security
```sql
-- SECURITY: All MySQL connections must use TLS
-- In connection string: SslMode=Required;SslCa=/path/to/ca-cert.pem
-- NEVER use SslMode=None in any environment

-- Generate separate user per application (never root):
CREATE USER 'appuser_prod'@'%' IDENTIFIED BY ''; -- Password from secrets manager
-- Least privilege — only grant what the application needs:
GRANT SELECT, INSERT, UPDATE, DELETE ON appdb.* TO 'appuser_prod'@'%';
-- No GRANT, CREATE, DROP, ALTER for application user
REVOKE ALL PRIVILEGES ON *.* FROM 'appuser_prod'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON appdb.* TO 'appuser_prod'@'%';
FLUSH PRIVILEGES;
```

### Schema Security (Always Generate)
```sql
-- SECURITY: PII fields must be encrypted at column level
-- Use AES_ENCRYPT/AES_DECRYPT or application-level encryption

CREATE TABLE customers (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- SECURITY: PII fields encrypted — key managed externally
    name_enc    VARBINARY(512)  NOT NULL COMMENT 'AES-256 encrypted full name',
    email_hash  VARCHAR(64)     NOT NULL COMMENT 'SHA-256 hash for lookup only',
    -- SECURITY: Never store raw PAN, Aadhaar, or account numbers
    pan_token   VARCHAR(64)     COMMENT 'Tokenized PAN — raw value not stored',
    created_at  DATETIME        DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted  BOOLEAN         DEFAULT FALSE COMMENT 'Soft delete only — no hard deletes of PII',
    INDEX idx_email_hash (email_hash)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  ENCRYPTION='Y'; -- MySQL TDE
```

### Audit Logging (Always Generate)
```sql
-- SECURITY: Audit log table for all sensitive data access
CREATE TABLE audit_log (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    table_name  VARCHAR(100)    NOT NULL,
    record_id   BIGINT UNSIGNED NOT NULL,
    action      ENUM('SELECT','INSERT','UPDATE','DELETE') NOT NULL,
    user_id     BIGINT UNSIGNED NOT NULL,
    app_user    VARCHAR(100)    NOT NULL COMMENT 'DB user performing action',
    ip_address  VARCHAR(45),    -- IPv6 compatible
    changed_data JSON,          -- Sanitized diff — NO PII values in audit log
    created_at  DATETIME        DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Stored Procedures & Queries
```sql
-- SECURITY: NEVER use dynamic SQL in stored procedures
-- WRONG (never generate):
-- SET @sql = CONCAT('SELECT * FROM ', tableName);
-- PREPARE stmt FROM @sql; EXECUTE stmt;

-- CORRECT (always use parameterized):
DELIMITER $$
CREATE PROCEDURE GetUserById(IN p_user_id BIGINT UNSIGNED)
BEGIN
    -- SECURITY: Parameterized — no dynamic SQL
    SELECT id, name_enc, email_hash, created_at
    FROM customers
    WHERE id = p_user_id AND is_deleted = FALSE;
END$$
DELIMITER ;
```

### MySQL Configuration Directives (Generate my.cnf stubs)
```ini
# SECURITY: Required MySQL configuration hardening
[mysqld]
# Disable remote root login
skip-networking=0
bind-address=127.0.0.1       # Only accept local connections unless explicitly needed

# Disable dangerous features
local-infile=0               # Prevent LOAD DATA LOCAL INFILE attacks
secure-file-priv=/var/lib/mysql-files  # Restrict file operations

# Require SSL
require_secure_transport=ON

# Logging (audit, not general)
general_log=OFF              # Never enable general_log in production (performance + data exposure)
slow_query_log=ON
slow_query_log_file=/var/log/mysql/slow.log
long_query_time=2

# Password policy
validate_password.policy=MEDIUM
validate_password.length=12
validate_password.mixed_case_count=1
validate_password.number_count=1
validate_password.special_char_count=1
```

---

## OWASP TOP 10 — ENFORCEMENT RULES

### A01 — Broken Access Control
- ALWAYS generate authorization checks at the service layer, not just the controller
- NEVER use user-supplied IDs without verifying ownership (IDOR prevention)
- ALWAYS apply `[Authorize(Policy="...")]` or `[Authorize(Roles="...")]` — plain `[Authorize]` without a role or policy is **prohibited**; every endpoint must declare its minimum required role or policy explicitly; auth-adjacent endpoints such as `/logout` and `/me` must use at minimum `[Authorize(Policy="ActiveUser")]`
- GENERATE resource-based authorization for all CRUD operations
- NEVER expose any endpoint without role or policy verification — this applies to admin, data, and auth-adjacent endpoints equally

```csharp
// SECURITY: Resource-based authorization — verify ownership
var resource = await _repository.GetByIdAsync(id);
if (resource.OwnerId != currentUserId && !User.IsInRole("Admin"))
    return Forbid(); // Never return NotFound — information disclosure
```

### A02 — Cryptographic Failures
- NEVER use: MD5, SHA1, DES, RC4, 3DES, ECB mode
- ALWAYS use: AES-256-GCM, SHA-256 minimum (SHA-384/512 preferred), RSA-4096 minimum or ECDSA P-384
- NEVER use RSA-2048 for new implementations — legacy only, scheduled for deprecation post-2030
- ALWAYS use: Argon2id (preferred — OWASP 2025) or bcrypt/PBKDF2 for passwords (never SHA for passwords)
- NEVER transmit sensitive data over HTTP — enforce HTTPS everywhere
- NEVER store sensitive data unencrypted — encrypt before persistence

### A03 — Injection (SQL, NoSQL, OS, LDAP)
- NEVER generate string concatenation for any query construction
- ALWAYS use parameterized queries, prepared statements, or ORMs
- ALWAYS validate and whitelist input — reject rather than sanitize where possible
- NEVER pass user input to shell commands, file paths, or LDAP queries directly

### A04 — Insecure Design
- ALWAYS generate a `THREAT_MODEL.md` stub for new projects with key attack surfaces
- ALWAYS include rate limiting on all user-facing endpoints
- ALWAYS include security stories in generated project README
- GENERATE input size limits on all string fields

### A05 — Security Misconfiguration
- ALWAYS disable directory listing in web server configs
- ALWAYS remove default accounts and change default passwords
- NEVER leave debug endpoints or swagger UI enabled in production configs
- ALWAYS generate environment-specific configs (dev/staging/prod separation)

### A06 — Vulnerable and Outdated Components
- ALWAYS use the latest stable version of all dependencies
- NEVER use packages with known Critical or High CVEs
- ALWAYS generate `.snyk` policy file and Dependabot config
- ALWAYS add an SBOM generation step in CI/CD pipeline comment

```yaml
# SECURITY: Auto-generate Dependabot config
# .github/dependabot.yml — always include in project scaffold
version: 2
updates:
  - package-ecosystem: "npm"       # Angular
    directory: "/"
    schedule: { interval: "weekly" }
    open-pull-requests-limit: 10
  - package-ecosystem: "nuget"     # .NET Core
    directory: "/"
    schedule: { interval: "weekly" }
```

### A07 — Identification and Authentication Failures
- ALWAYS implement account lockout after 5 failed attempts (15-minute lockout)
- NEVER use predictable session tokens — always use cryptographically random values
- ALWAYS implement secure password reset flows (time-limited tokens, one-time use)
- ALWAYS support MFA — generate MFA scaffolding in auth modules
- NEVER store passwords in recoverable form

### A08 — Software and Data Integrity Failures
- ALWAYS verify integrity of downloaded packages (checksums, signatures)
- NEVER deserialize untrusted data without validation
- ALWAYS use signed commits in project setup instructions
- GENERATE SBOM reference in project documentation

### A09 — Security Logging and Monitoring Failures
- ALWAYS log authentication successes and failures
- ALWAYS log authorization failures with user ID and resource
- ALWAYS log input validation failures (potential attack indicators)
- NEVER log passwords, tokens, PII, or financial data
- GENERATE SIEM integration stubs with structured log format

```csharp
// SECURITY: Structured security event log — no PII in message
_logger.LogWarning("SECURITY_EVENT: {EventType} | UserId: {UserId} | IP: {ClientIp} | Resource: {Resource}",
    "AUTH_FAILURE", userId, clientIp, requestPath);
// This format is parseable by SIEM systems
```

### A10 — Server-Side Request Forgery (SSRF)
- NEVER use user-supplied URLs for outbound HTTP requests without validation
- ALWAYS implement an allowlist for permitted outbound domains
- NEVER expose internal service URLs to client-side code
- ALWAYS validate and sanitize URL inputs before use

```csharp
// SECURITY: SSRF prevention — allowlist outbound requests
private static readonly HashSet<string> AllowedHosts = new() {
    "api.trustedpartner.com", "payments.yourbank.com"
};
if (!AllowedHosts.Contains(new Uri(userUrl).Host))
    throw new SecurityException("Outbound request to unauthorized host blocked");
```

---

## DEPENDENCY RULES

### BANNED PACKAGES (Never suggest or generate imports for these)
- Any package with a known Critical or High CVE in the current Snyk/NVD database
- `log4j` versions < 2.17.1 (Log4Shell)
- `moment.js` — deprecated, use `date-fns` or `luxon`
- `request` npm package — deprecated, use `axios` or `node-fetch`
- Any package last updated more than 3 years ago without a maintained fork

### VERSION PINNING RULES
- ALWAYS pin to exact versions in package.json: `"axios": "1.7.2"` not `"^1.7.2"`
- Exception: Dependabot will manage patch updates via PRs
- ALWAYS include lock files (package-lock.json, yarn.lock, .csproj PackageReference)

### MINIMUM SUPPORTED VERSIONS (As of 2025 — update quarterly)
| Technology | Minimum Version | EOL Risk |
|---|---|---|
| Angular | 17.x or later | 16.x EOL |
| .NET Core | 8.x LTS or later | 6.x EOL Nov 2024 |
| Node.js | 20.x LTS or later | 18.x EOL Apr 2025 |
| MySQL | 8.0.x or later | 5.7.x EOL |
| TypeScript | 5.x or later | |
| Spring Boot | 3.x or later | 2.x EOL |

---

## DATA SECURITY CONTROLS

### Secrets Management (Enforce in All Projects)
```
# SECURITY: Never commit these to version control
# .gitignore — always include these entries:
.env
.env.*
*.pem
*.key
*.p12
*.pfx
appsettings.Production.json
secrets.json
**/secrets/**
```

### PII Data Classification (Add to All Data Models)
```csharp
// SECURITY: Data classification attributes — required on all models
[PersonalData]          // Maps to DPDP Act "personal data"
[DataType(DataType.Text)]
public string Name { get; set; }

[SensitiveData]         // Custom attribute — triggers extra logging protection
public string AccountNumber { get; set; }

// NEVER include these in API response DTOs without explicit need + approval:
// - Full PAN / Aadhaar numbers
// - Full account numbers
// - Raw biometric data
// - Date of birth + name combination
```

### Encryption Standards
| Use Case | Algorithm | Key Length | Notes |
|---|---|---|---|
| Data at rest | AES-GCM | 256-bit | IV must be random, never reuse |
| Data in transit | TLS 1.3 | — | TLS 1.0/1.1 disabled |
| Password hashing | bcrypt | work=12 | Minimum work factor |
| Token signing | HMAC-SHA256 | 256-bit | Key from secrets manager |
| File encryption | AES-CBC | 256-bit | With HMAC-SHA256 MAC |

---

## VAPT & CI/CD QUALITY GATES

### Deployment Block Conditions
Claude must include the following gate definitions in all CI/CD pipeline scaffolding:

```yaml
# SECURITY: Quality gates — these conditions BLOCK deployment
security_gates:
  block_on_critical_cve: true      # Any Critical CVE = pipeline fail
  block_on_high_cve: true          # Any High CVE = pipeline fail  
  block_on_hardcoded_secrets: true # Any detected secret = pipeline fail
  block_on_sast_high: true         # SAST High finding = pipeline fail
  warn_on_medium_cve: true         # Medium CVE = warning, not block
  fail_on_owasp_critical: true     # OWASP ZAP Critical = pipeline fail

# Tools to integrate:
sast:
  tool: "semgrep"
  rulesets: ["p/owasp-top-ten", "p/csharp", "p/typescript"]
  
sca:
  tool: "snyk"
  severity_threshold: "high"

secrets:
  tool: "gitleaks"
  pre_commit: true
  ci_scan: true

dast:
  tool: "owasp-zap"
  environment: "staging"
  frequency: "per-release"
```

### VAPT Remediation SLA
| Severity | Remediation Time | Deployment Status |
|---|---|---|
| Critical (CVSS 9.0+) | 24 hours | BLOCKED until fixed |
| High (CVSS 7.0–8.9) | 72 hours | BLOCKED until fixed |
| Medium (CVSS 4.0–6.9) | 30 days | Deploy with tracker |
| Low (CVSS 0.1–3.9) | 90 days | Deploy with backlog |
| Informational | Best effort | No block |

---

## SECURITY DOCUMENTATION (Auto-Generate for Every Project)

### SECURITY.md Template (Always Generate)
```markdown
# Security Policy

## Supported Versions
| Version | Supported |
|---------|-----------|
| Latest  | ✅ Yes    |
| N-1     | ✅ Yes    |
| N-2+    | ❌ No     |

## Reporting a Vulnerability
Report security vulnerabilities to: security@yourcompany.com
Do NOT create public GitHub issues for security vulnerabilities.
Response SLA: 24 hours for Critical, 72 hours for High.

## Security Controls Applied
- NIST CSF aligned
- CIS Level 1 hardened (Angular / .NET Core / MySQL)
- OWASP Top 10 compliant
- Dependency scanning: Snyk + Dependabot
- SAST: Semgrep (runs on every commit)
- DAST: OWASP ZAP (runs pre-release)

## Known Security Assumptions
- TLS 1.3 required for all connections
- Secrets managed via [Secrets Manager / Key Vault / HashiCorp Vault]
- Authentication via [JWT / Session] with MFA required for admin roles
```

---

## CWE TOP 25 — ADDITIONAL WEAKNESS CONTROLS

Apply ALL rules below in conjunction with OWASP A01–A10. Any violation is a **Critical** finding during SOC Review.

### CWE-22 — Path Traversal
- NEVER accept raw file paths from user input
- ALWAYS canonicalize paths using `Path.GetFullPath()` and verify the result starts within the permitted base directory before any file operation
- NEVER pass user input directly to `File.ReadAllText()`, `File.Open()`, or equivalent
- Reject any input containing `../`, `..\`, `%2e%2e`, or URL-encoded traversal sequences

```csharp
// SECURITY: CWE-22 Path Traversal prevention
var baseDir = Path.GetFullPath("/app/uploads");
var requested = Path.GetFullPath(Path.Combine(baseDir, userSuppliedFilename));
if (!requested.StartsWith(baseDir, StringComparison.OrdinalIgnoreCase))
    throw new SecurityException("Path traversal attempt blocked");
```

### CWE-434 — Unrestricted File Upload
- ALWAYS validate file type by **magic number** (first N bytes), NOT by file extension
- ALWAYS store uploaded files **outside the web root** (`wwwroot`, `assets`) — never in a publicly accessible directory
- ALWAYS rename uploaded files to a server-generated UUID — NEVER use the original filename
- ALWAYS enforce file size limits (default max 10MB; document any exception)
- ALWAYS validate MIME type server-side — never trust the `Content-Type` request header alone
- NEVER serve uploaded files with execute permissions

```csharp
// SECURITY: CWE-434 — Magic number validation
private static readonly Dictionary<string, byte[]> AllowedSignatures = new()
{
    { "image/jpeg", new byte[] { 0xFF, 0xD8, 0xFF } },
    { "image/png",  new byte[] { 0x89, 0x50, 0x4E, 0x47 } },
    { "application/pdf", new byte[] { 0x25, 0x50, 0x44, 0x46 } }
};

public bool IsValidFileType(Stream fileStream, string expectedMimeType)
{
    if (!AllowedSignatures.TryGetValue(expectedMimeType, out var signature)) return false;
    var header = new byte[signature.Length];
    fileStream.Read(header, 0, header.Length);
    fileStream.Position = 0;
    return header.SequenceEqual(signature);
}

// Storage — always outside web root:
var safeName = Guid.NewGuid().ToString("N") + ".bin"; // No original extension kept
var storagePath = Path.Combine("/app/secure-uploads", safeName); // NOT wwwroot
```

### CWE-502 — Insecure Deserialization
- NEVER use `BinaryFormatter` — banned in .NET 5+ for security reasons
- NEVER use `Newtonsoft.Json` with `TypeNameHandling.All` or `TypeNameHandling.Auto`
- ALWAYS use `System.Text.Json` with strict settings as the default deserializer
- ALWAYS validate the shape and content of deserialized objects before use
- NEVER execute code paths based on type names present in serialized data

```csharp
// SECURITY: CWE-502 — Safe JSON deserialization
var options = new JsonSerializerOptions
{
    PropertyNameCaseInsensitive = false,
    UnknownTypeHandling = JsonUnknownTypeHandling.JsonElement,
    MaxDepth = 32
};
var result = JsonSerializer.Deserialize<MyDto>(json, options)
    ?? throw new InvalidOperationException("Deserialization returned null");
```

### CWE-918 — Server-Side Request Forgery
Cross-reference: OWASP A10 above. SOC Review audit confirms the allowlist `HashSet` exists in code — not just in comments — and is enforced on every outbound `HttpClient` call path.

### CWE-79 — Cross-Site Scripting
Cross-reference: Angular DOM Security Rules above. Audit check: no `innerHTML = userInput`; no `bypassSecurityTrustHtml`; no `[innerHTML]` binding without `DomSanitizer.sanitize()`.

### CWE-89 — SQL Injection
Cross-reference: Database Access section above. Audit check: zero raw string concatenation in any SQL expression, including Dapper `Query()` calls. Dynamic `ORDER BY` must use a whitelist enum.

---

## MANUAL-MOD DETECTION PROTOCOL

Any file manually edited after AI generation MUST be tagged by the developer:
`// [MANUAL-MOD] <reason> — <YYYY-MM-DD> — <author>`

**Claude's obligation during SOC Review:**
1. Scan ALL source files for `[MANUAL-MOD]` tags before any other review step
2. For each occurrence: read surrounding context and classify — **SAFE** | **RISKY** | **CRITICAL**
3. Manual changes to any of the following layers are automatically **CRITICAL** priority:
   - Authentication / authorization code
   - Cryptography or token handling
   - Middleware pipeline registration order
   - Data access / query construction
   - Security headers configuration
4. Untagged manual edits found during scan = **Major** finding (missing traceability)
5. All findings recorded in Findings Register before audit proceeds

---

## ASVS LEVEL 2 — MANDATORY VERIFICATION CHECKLIST

Compliance is verified during SOC Review (Step 3b). Implementation is required at design
and coding stages — these are not optional post-release checks.

| Chapter | Control | Verification Method |
|---|---|---|
| **V2 — Authentication** | Argon2id or bcrypt (work≥12); MFA for admin roles; lockout after 5 failures | Code review of hash impl + lockout config |
| **V3 — Session Management** | Cryptographically strong RNG for tokens; global logout invalidates ALL sessions | Token generation + logout endpoint review |
| **V4 — Access Control** | Least-privilege enforced; every entity query has ownership check at service layer | `[Authorize]` on every endpoint; service-layer IDOR check |
| **V5 — Input Validation** | Allow-list validation on all inputs; encoding before interpreter (SQL/HTML) | Validator presence + query construction review |
| **V7 — Cryptography** | AES-256-GCM or RSA-4096 only; ALL secrets in Azure Key Vault — never in config | Crypto algorithm check + appsettings.json scan |
| **V8 — Error Handling & Logging** | Security events logged with timestamp + userId; zero PII in logs; no stack traces to callers | Logger call review + exception middleware response body |
| **V12 — File/Resources** | Magic-number file type validation; files stored outside web root; size limits enforced | Upload handler + storage path review |

---

## FORBIDDEN PATTERNS

Claude must REFUSE to generate code containing any of the following:

### Cryptographic
- `MD5`, `SHA1` for any security purpose
- `DES`, `3DES`, `RC4`, `Blowfish`
- ECB mode for any symmetric cipher
- Fixed/hardcoded IVs or salts

### Injection Risks
- String concatenation for SQL: `"SELECT * FROM " + table`
- `eval()` in any context
- `innerHTML = userInput` without sanitization
- `Process.Start(userInput)` or shell command injection
- Reflecting HTTP request header values into response headers without strict format validation (CWE-113 — HTTP Response Splitting); always validate against an allowlist regex and generate a safe fallback value if input fails

### Authentication
- Passwords stored as plain text or reversibly encoded
- `password123`, `admin`, `secret` or any dictionary-word passwords in test fixtures pushed to repos
- Session tokens with < 128 bits of entropy
- Disabled SSL certificate validation: `ServicePointManager.ServerCertificateValidationCallback = ...true`

### Data Exposure
- PAN, Aadhaar, account numbers in log statements
- `Console.WriteLine(password)` or equivalent
- Full stack traces exposed to API callers
- Directory listing enabled
- Swagger/OpenAPI enabled in production without auth
- Returning command objects, entity objects, or full domain models directly from API actions (CWE-213 — Excessive Data Exposure); always return a purpose-built `[Resource]ResponseDto` containing only client-required fields; never rely on `[JsonIgnore]` as the sole protection
- Hardcoded passwords, tokens, or secrets in test files — use `Environment.GetEnvironmentVariable(...)` or generate a random value with `Guid.NewGuid().ToString()` instead

### Configuration
- `AllowAnyOrigin()` CORS policy in production
- `AllowAnyMethod()` + `AllowAnyHeader()` CORS in production
- Debug mode enabled in production
- Hardcoded connection strings with credentials

---

## COMPLIANCE REFERENCES

| Standard | Applicability | Key Requirements |
|---|---|---|
| NIST CSF 2.0 | All projects | Identify, Protect, Detect, Respond, Recover |
| CIS Controls v8 Level 1 | All projects | Basic cyber hygiene for every system |
| OWASP Top 10 (2021) | All web apps | A01–A10 mitigations enforced |
| DPDP Act 2023 (India) | PII processing | Consent, purpose limitation, data security |
| RBI ITGRCA 2023 | NBFC projects | IT governance, third-party controls, audit |
| ISO 27001 | Enterprise | Information security management |

---

## SKILL MAINTENANCE

- Review quarterly against latest OWASP, NIST, and CIS updates
- Update minimum version table when framework EOL dates change
- Add new banned packages as CVEs are published
- Version control this file and require CISO approval for changes
- Audit Claude's generated code monthly for compliance drift

---
*This SKILL file is a security control document. Modifications require CISO + IT Risk approval.*
*Classification: INTERNAL — RESTRICTED*
