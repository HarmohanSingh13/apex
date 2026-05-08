# Security Guardrails — CIS Hardening & OWASP A01–A10 Enforcement
# Version: 1.1 | Frameworks: CIS Level 1, OWASP Top 10 (2025), CWE Top 25
# Owner: Information Security / CISO Office

> **When to load:** Load this file during Development and SOC Review phases. Contains CIS Level 1 hardening code templates for Angular, .NET Core, and MySQL, plus OWASP A01–A10 enforcement rules with code examples.
>
> **Prerequisite:** `guardrails-core.md` must also be loaded (mandatory behavior rules and forbidden patterns).

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
// ALWAYS use BCrypt or PBKDF2
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

## OWASP TOP 10 (2025) — ENFORCEMENT RULES

> **2025 update:** OWASP renumbered and renamed several categories from the 2021 list.
> Key changes include new entries: **Software Supply Chain Failures** and **Mishandling of
> Exceptional Conditions**. All A01–A10 enforcement rules below reflect the 2025 taxonomy.

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
- ALWAYS use: Argon2id (preferred — OWASP 2025) or bcrypt (work≥12) for passwords (never SHA for passwords)
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

## CWE TOP 25 — ADDITIONAL WEAKNESS CONTROLS

Apply ALL rules below in conjunction with OWASP A01–A10. These address vulnerability classes
not fully covered by OWASP Top 10 alone. Any violation is a **Critical** finding during SOC Review.

### CWE-22 — Path Traversal
- NEVER accept raw file paths from user input
- ALWAYS canonicalize paths using `Path.GetFullPath()` and verify the result starts within
  the permitted base directory before any file operation
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
// SECURITY: CWE-434 — Magic number validation (file signature check)
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
    UnknownTypeHandling = JsonUnknownTypeHandling.JsonElement, // No polymorphic type resolution
    MaxDepth = 32 // Prevent deeply nested JSON DoS
};
var result = JsonSerializer.Deserialize<MyDto>(json, options)
    ?? throw new InvalidOperationException("Deserialization returned null");
// Validate result before use — never trust deserialized data directly
```

### CWE-918 — Server-Side Request Forgery
Cross-reference: OWASP A10 enforcement rules above already cover SSRF.
The CWE-918 check during SOC Review audit confirms the allowlist `HashSet` exists in code —
not just in config comments — and that it is enforced on every outbound `HttpClient` call path.

### CWE-79 — Cross-Site Scripting
Cross-reference: Angular DOM Security Rules above cover XSS at the framework level.
CWE-79 audit check: confirm no `innerHTML = userInput` pattern anywhere in the Angular
codebase, and no `[innerHTML]` binding used without prior `DomSanitizer.sanitize()`.
No `bypassSecurityTrustHtml`, `bypassSecurityTrustScript` usage anywhere.

### CWE-89 — SQL Injection
Cross-reference: Database Access section above covers SQL injection prevention.
CWE-89 audit check: confirm zero raw string concatenation into any SQL expression —
including Dapper `Query()` calls. Dynamic `ORDER BY` column names must use a whitelist
enum, not direct user input interpolation.

---
*This file is a security control document. Modifications require CISO + IT Risk approval.*
*Classification: INTERNAL — RESTRICTED*
