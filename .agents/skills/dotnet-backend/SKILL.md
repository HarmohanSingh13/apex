<!-- This file has been split. Load sub-files instead:
  - dotnet-core.md           — Clean Architecture, naming conventions (always load for .NET)
  - dotnet-application.md    — CQRS/MediatR, FluentValidation, JWT, Serilog
  - dotnet-infrastructure.md — EF Core + Dapper, DB rules, Azure App Service deployment
-->

# .NET Core Backend Skill

When developing .NET backend code, **always follow these standards**. These rules apply automatically whenever you create, modify, or scaffold controllers, services, entities, or infrastructure components.

---

## 1. Framework Version

- **.NET 8** (LTS)
- Use the **minimal hosting model** (`WebApplication.CreateBuilder`)
- Use **top-level statements** for `Program.cs`
- Enable **nullable reference types** globally
- Use **file-scoped namespaces**

### Example — Program.cs

```csharp
using MyApp.API.Extensions;
using MyApp.Application;
using MyApp.Infrastructure;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((ctx, cfg) =>
    cfg.ReadFrom.Configuration(ctx.Configuration));

builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);
builder.Services.AddApiServices();

var app = builder.Build();

app.UseSerilogRequestLogging();
app.UseExceptionHandler("/error");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
```

---

## 2. Architecture — Clean Architecture

```
MyApp.sln
├── src/
│   ├── MyApp.API/                  # Presentation layer (thin)
│   │   ├── Controllers/
│   │   ├── Filters/
│   │   ├── Middleware/
│   │   ├── Extensions/
│   │   └── Program.cs
│   │
│   ├── MyApp.Application/          # Use cases & business logic
│   │   ├── Common/
│   │   │   ├── Behaviors/          # MediatR pipeline behaviors
│   │   │   ├── Interfaces/         # Abstractions
│   │   │   └── Models/             # DTOs, ViewModels
│   │   ├── Features/
│   │   │   ├── Orders/
│   │   │   │   ├── Commands/
│   │   │   │   │   ├── CreateOrder/
│   │   │   │   │   │   ├── CreateOrderCommand.cs
│   │   │   │   │   │   ├── CreateOrderCommandHandler.cs
│   │   │   │   │   │   └── CreateOrderCommandValidator.cs
│   │   │   │   │   └── UpdateOrder/
│   │   │   │   └── Queries/
│   │   │   │       ├── GetOrders/
│   │   │   │       │   ├── GetOrdersQuery.cs
│   │   │   │       │   ├── GetOrdersQueryHandler.cs
│   │   │   │       │   └── OrderDto.cs
│   │   │   │       └── GetOrderById/
│   │   │   └── Users/
│   │   └── DependencyInjection.cs
│   │
│   ├── MyApp.Domain/                # Entities, value objects, enums
│   │   ├── Entities/
│   │   ├── Enums/
│   │   ├── Events/
│   │   ├── Exceptions/
│   │   └── ValueObjects/
│   │
│   └── MyApp.Infrastructure/        # External concerns
│       ├── Data/
│       │   ├── AppDbContext.cs
│       │   ├── Configurations/      # EF fluent config
│       │   └── Migrations/
│       ├── Repositories/
│       ├── Services/                # External service integrations
│       └── DependencyInjection.cs
│
└── tests/
    ├── MyApp.API.Tests/
    ├── MyApp.Application.Tests/
    ├── MyApp.Domain.Tests/
    └── MyApp.Infrastructure.Tests/
```

### Dependency Rules

```
API → Application → Domain
API → Infrastructure → Application → Domain
```

- **Domain** has **ZERO** external dependencies (no NuGet packages except primitives)
- **Application** depends only on Domain; defines interfaces that Infrastructure implements
- **Infrastructure** implements Application interfaces (repositories, services, data access)
- **API** is thin — delegates everything to Application layer via MediatR

---

## 3. Data Access — EF Core + Dapper Hybrid

| Use Case | Tool | When |
|---|---|---|
| Writes, aggregates, domain logic | **Entity Framework Core** | CRUD, complex entity graphs, migrations |
| Reporting, high-performance reads | **Dapper** | Read-only queries, dashboards, exports |

### EF Core Conventions

```csharp
// Entity configuration — always use Fluent API, not data annotations
public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");
        builder.HasKey(o => o.Id);
        builder.Property(o => o.OrderNumber).IsRequired().HasMaxLength(50);
        builder.HasIndex(o => o.OrderNumber).IsUnique();
        builder.HasOne(o => o.Customer)
               .WithMany(c => c.Orders)
               .HasForeignKey(o => o.CustomerId);
    }
}
```

### Dapper Usage

```csharp
// Use for read-only, high-performance queries
public class OrderReportRepository : IOrderReportRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public async Task<IEnumerable<OrderReportDto>> GetMonthlyReport(int year, int month)
    {
        using var connection = _connectionFactory.Create();
        return await connection.QueryAsync<OrderReportDto>(
            """
            SELECT o.OrderNumber, o.Total, c.Name AS CustomerName
            FROM Orders o
            JOIN Customers c ON o.CustomerId = c.Id
            WHERE YEAR(o.CreatedAt) = @Year AND MONTH(o.CreatedAt) = @Month
            ORDER BY o.Total DESC
            """,
            new { Year = year, Month = month });
    }
}
```

### Rules

- **Never** use raw SQL with EF Core — use LINQ
- **Always** use parameterized queries with Dapper
- Use `AsNoTracking()` for read-only EF Core queries
- Define all entity configurations in `Infrastructure/Data/Configurations/`

---

## 4. Database

**Target database is Azure SQL (SQL Server) for all cloud environments. SQLite is used on developer local machines only.**

| Environment | Trigger | Database Provider |
|---|---|---|
| **Local** (developer machine) | Running locally via `launchSettings.json` | SQLite |
| **Development** (cloud) | `develop` branch pipeline | Azure SQL / SQL Server |
| **Production** (cloud) | `main` branch pipeline | Azure SQL / SQL Server |

### Required NuGet Packages

Both packages must always be present — the codebase must be cloud-ready at all times:

```xml
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="8.x.x" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="8.x.x" />
```

### Environment Configuration

```
appsettings.json              ← base config only, no provider or connection string
appsettings.Local.json        ← DatabaseProvider: Sqlite  (committed, no secrets)
appsettings.Development.json  ← DatabaseProvider: SqlServer (connection string from Key Vault)
appsettings.Production.json   ← DatabaseProvider: SqlServer (connection string from Key Vault)
launchSettings.json           ← sets ASPNETCORE_ENVIRONMENT=Local for local runs
```

```json
// appsettings.Local.json
{
  "DatabaseProvider": "Sqlite",
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=app-local.db"
  }
}

// appsettings.Development.json
{
  "DatabaseProvider": "SqlServer",
  "ConnectionStrings": {
    "DefaultConnection": "AZURE-KEY-VAULT"
  }
}

// appsettings.Production.json
{
  "DatabaseProvider": "SqlServer",
  "ConnectionStrings": {
    "DefaultConnection": "AZURE-KEY-VAULT"
  }
}
```

### Program.cs — Provider Registration

```csharp
var provider = builder.Configuration["DatabaseProvider"]
    ?? throw new InvalidOperationException("DatabaseProvider is not configured.");

builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (provider == "Sqlite")
        options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"));
    else
        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
});
```

### EF Core Migration Rules

- **Always generate migrations against the SQL Server provider** — migrations must be cloud-compatible
- Run migrations with: `dotnet ef migrations add <Name> --project MyApp.Infrastructure --startup-project MyApp.API`
- Never generate SQLite-specific migrations — SQLite is for local convenience only, not schema authority
- Apply migrations on startup in non-Local environments only:

```csharp
if (!app.Environment.IsEnvironment("Local"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}
```

### Schema Design Rules

- Use `Guid` for primary keys (unless performance-critical, then `int`/`long`)
- Always include `CreatedAt`, `UpdatedAt` audit columns
- Use soft deletes (`IsDeleted`, `DeletedAt`) for business entities
- Define indexes for all foreign keys and frequently queried columns

### SQLite vs SQL Server — Known Divergences

> **Why this matters:** SQLite is used locally for developer convenience. The cloud target is SQL Server. These engines behave differently in ways that cause bugs that work locally but fail in cloud — or silently give wrong results. Understand all divergences below before writing any data layer code.

| Area | SQLite behaviour | SQL Server behaviour | Safe coding rule |
|---|---|---|---|
| **Foreign key enforcement** | FK constraints are **OFF by default** — invalid references silently insert | FK constraints are always enforced | Enable FK enforcement in SQLite: `PRAGMA foreign_keys = ON;` — add in `OnConfiguring` or via migration `HasAnnotation` |
| **Column alterations in migrations** | No `ALTER COLUMN` support — EF Core must drop and recreate the table | Full `ALTER COLUMN` support | Always generate migrations against the SQL Server provider (rule above); test migrations on SQL Server before merging |
| **String collation / case sensitivity** | Case-**insensitive** by default for `LIKE` and equality | Case-insensitive by default but collation is configurable; `_CS_` collations are case-sensitive | Specify `UseCollation("SQL_Latin1_General_CP1_CI_AS")` on string columns in `OnModelCreating` for consistent behaviour; never rely on implicit case folding |
| **DateTime precision** | Stores as ISO 8601 text or real; no sub-second precision guarantee | `datetime2(7)` provides 100ns precision; `datetimeoffset` supports timezone | Map `DateTime` columns to `datetime2` explicitly: `.HasColumnType("datetime2")` in Fluent API |
| **GUID storage** | Stored as 36-char text string | Stored as 16-byte `uniqueidentifier` (efficient) | EF Core handles this transparently when using `Guid` PK — no manual override needed, but be aware raw ADO.NET / Dapper queries differ |
| **Decimal / money precision** | Stored as 8-byte float — rounding errors possible for financial values | `decimal(p,s)` stores exact fixed-point values | Always annotate decimal columns: `.HasColumnType("decimal(18,2)")` (or appropriate precision) in Fluent API |
| **String length enforcement** | `VARCHAR(n)` length limit is **not enforced** — longer strings insert silently | Length limits are enforced; insert fails if exceeded | Always call `.HasMaxLength(n)` in Fluent API and validate at the application layer with FluentValidation — never rely on DB enforcement alone |
| **Concurrent writes** | File-level locking — one writer at a time | Row/page-level locking with MVCC | Acceptable for local dev; never use SQLite in staging or production |
| **Schema-qualified names** | No schema support (`dbo.TableName` is invalid) | Tables belong to a schema (default `dbo`) | EF Core uses `dbo` by default on SQL Server; no action needed unless you use custom schemas |
| **Computed columns** | Limited support (`STORED` only, no `VIRTUAL` in EF Core provider) | Full computed column support | Avoid computed columns in migrations unless tested on both providers |

#### Integration Test Configuration

Run integration tests against a real SQL Server instance (not SQLite) to catch divergences before they reach production.

```json
// appsettings.IntegrationTest.json  (not committed — loaded by test project only)
{
  "DatabaseProvider": "SqlServer",
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=MyApp_Test;User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=True"
  }
}
```

```yaml
# azure-pipelines.yml — spin up SQL Server container for integration tests
services:
  mssql:
    image: mcr.microsoft.com/mssql/server:2022-latest
    env:
      SA_PASSWORD: "YourStrong!Passw0rd"
      ACCEPT_EULA: "Y"
    ports:
      - 1433:1433
```

> **Rule:** Unit tests may use SQLite (fast, no infra). Integration tests that touch the database **must** run against SQL Server. Mark integration tests with `[Trait("Category", "Integration")]` and run them as a separate step in the pipeline after the unit test step.

---

## 5. API Style — Controllers + Minimal APIs

| Use Case | Style |
|---|---|
| Standard business APIs | **Controllers** |
| Health checks, internal/system endpoints | **Minimal APIs** |

### Controller Pattern

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly ISender _mediator;

    public OrdersController(ISender mediator) => _mediator = mediator;

    [HttpGet]
    [ProducesResponseType(typeof(List<OrderDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] GetOrdersQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateOrderCommand command)
    {
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _mediator.Send(new GetOrderByIdQuery(id));
        return result is null ? NotFound() : Ok(result);
    }
}
```

### Rules

- Controllers are **thin** — no business logic, only mediate between HTTP and Application layer
- Use `[ApiController]` attribute for automatic model validation
- Use proper `[ProducesResponseType]` attributes
- Use `ISender` (MediatR) to dispatch commands and queries
- Return proper HTTP status codes (`201 Created`, `404 Not Found`, etc.)

---

## 6. Authentication & Authorization

- **JWT** (OAuth2 / OpenID Connect) — default
- **Azure AD** — for corporate identity scenarios

### Rules

- Stateless authentication — no server-side sessions
- Short-lived access tokens (15–30 min)
- Refresh tokens stored securely (httpOnly cookies)
- **Never** implement custom token generation — use proven libraries
- Use `[Authorize]` attribute with policies for role-based access

### Example — JWT Configuration

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Auth:Authority"];
        options.Audience = builder.Configuration["Auth:Audience"];
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
        };
    });

builder.Services.AddAuthorizationBuilder()
    .AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"))
    .AddPolicy("CanManageOrders", policy => policy.RequireClaim("permission", "orders.manage"));
```

---

## 7. Logging — Serilog

- Use **Serilog** for structured logging
- Use `ILogger<T>` abstraction (never reference Serilog directly in Application/Domain)
- Configure sinks based on environment

### Rules

- **Never** log sensitive data (passwords, tokens, PII)
- Use structured log properties: `_logger.LogInformation("Order {OrderId} created by {UserId}", orderId, userId)`
- Log levels: `Debug` (dev), `Information` (business events), `Warning` (recoverable issues), `Error` (failures)
- Add correlation IDs to all log entries

### Example — Serilog Configuration

```json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft.AspNetCore": "Warning",
        "Microsoft.EntityFrameworkCore": "Warning"
      }
    },
    "WriteTo": [
      { "Name": "Console" },
      { 
        "Name": "Seq",
        "Args": { "serverUrl": "http://localhost:5341" }
      }
    ],
    "Enrich": ["FromLogContext", "WithCorrelationId", "WithMachineName"]
  }
}
```

---

## 8. Validation — FluentValidation

- Use **FluentValidation** for all input validation
- One validator per command/query
- Register validators via MediatR pipeline behavior

### Example — Validator

```csharp
public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(x => x.CustomerName)
            .NotEmpty().WithMessage("Customer name is required")
            .MaximumLength(200).WithMessage("Customer name must not exceed 200 characters");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be at least 1");

        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress().WithMessage("A valid email is required");
    }
}
```

### Validation Pipeline Behavior

```csharp
public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
        => _validators = validators;

    public async Task<TResponse> Handle(TRequest request,
        RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        if (!_validators.Any()) return await next();

        var context = new ValidationContext<TRequest>(request);
        var failures = (await Task.WhenAll(
                _validators.Select(v => v.ValidateAsync(context, ct))))
            .SelectMany(r => r.Errors)
            .Where(f => f is not null)
            .ToList();

        if (failures.Any())
            throw new ValidationException(failures);

        return await next();
    }
}
```

### Rules

- **Never** use Data Annotations (`[Required]`, `[MaxLength]`) for validation
- Validators live next to their commands: `CreateOrder/CreateOrderCommandValidator.cs`
- Validation runs automatically via MediatR pipeline — controllers stay clean

---

## 9. CI/CD — Azure DevOps

### Standard Pipeline Stages

```yaml
trigger:
  branches:
    include: [main, develop, release/*]

stages:
  - stage: Build
    jobs:
      - job: BuildAndTest
        steps:
          - task: UseDotNet@2
            inputs:
              version: '8.x'
          - script: dotnet restore
          - script: dotnet build --no-restore --configuration Release
          - script: dotnet test --no-build --configuration Release --collect:"XPlat Code Coverage"
          - task: PublishCodeCoverageResults@2
            inputs:
              codeCoverageTool: Cobertura
              summaryFileLocation: '**/coverage.cobertura.xml'
          - script: dotnet publish --no-build --configuration Release --output $(Build.ArtifactStagingDirectory)
          - task: PublishBuildArtifacts@1

  - stage: DeployDev
    dependsOn: Build
    condition: succeeded()
    # Deploy to Dev environment

  - stage: DeployQA
    dependsOn: DeployDev
    condition: succeeded()
    # Deploy to QA with approval gate

  - stage: DeployProd
    dependsOn: DeployQA
    condition: succeeded()
    # Deploy to Prod with approval gate
```

### Rules

- **Secrets** via Azure Key Vault — never in config files or pipeline variables
- **Environment approvals** required for QA and Prod
- **Infrastructure as Code** using Bicep or Terraform
- Pipeline stages: `Restore → Build → Test → Coverage → Publish → Deploy`

### Azure App Service (IIS) Deployment Requirements

These are mandatory for correct operation on Azure App Service (Windows/IIS):

- **`UseForwardedHeaders()` must be the first middleware in `Program.cs`** when deploying behind a reverse proxy or CDN (Cloudflare, Azure Front Door, App Service itself). Without it, `context.Request.IsHttps` is always `false` inside Kestrel (TLS is terminated at the proxy), causing HSTS to never be sent and `UseHttpsRedirection()` to redirect in an infinite loop:
  ```csharp
  // Program.cs — BEFORE app.UseHsts(), app.UseHttpsRedirection(), and security headers middleware
  builder.Services.Configure<ForwardedHeadersOptions>(options =>
  {
      options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
      options.KnownNetworks.Clear(); // Trust all upstream proxies (Cloudflare IPs rotate)
      options.KnownProxies.Clear();
  });
  var app = builder.Build();
  app.UseForwardedHeaders(); // ← must be first
  ```

- **`web.config` must be present in the API project** to remove the IIS WebDAV module. Without it, IIS returns `405 Method Not Allowed` for all POST/PUT/DELETE requests before they reach the .NET app:
  ```xml
  <?xml version="1.0" encoding="utf-8"?>
  <configuration>
    <system.webServer>
      <handlers>
        <remove name="WebDAV" />
        <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
      </handlers>
      <modules>
        <remove name="WebDAVModule" />
      </modules>
      <aspNetCore processPath="dotnet" arguments=".\<AppName>.dll"
                  stdoutLogEnabled="false" stdoutLogFile=".\logs\stdout"
                  hostingModel="inprocess" />
    </system.webServer>
  </configuration>
  ```
- **`<InvariantGlobalization>false</InvariantGlobalization>`** in `.csproj` — setting this to `true` causes `CultureNotFoundException: en-us is an invalid culture identifier` on startup because SqlClient and BCrypt.Net require culture support.
- **App Settings key naming**: ASP.NET Core reads Azure App Service Application Settings using `__` (double underscore) as the hierarchy separator. The pipeline must set `ASPNETCORE_ENVIRONMENT`, `Jwt__Secret`, and `ConnectionStrings__DefaultConnection` — not the pipeline variable names (`jwtSecret`, `dbConnectionString`).

---

## 10. General Coding Conventions

### C# Style

- **File-scoped namespaces**: `namespace MyApp.Domain.Entities;`
- **Primary constructors** for simple DI: `public class OrderService(IOrderRepository repo)`
- **Records** for DTOs and value objects: `public record OrderDto(Guid Id, string Name)`
- **Pattern matching** over if-else chains
- **Nullable reference types** enabled and enforced

### Naming

| Element | Convention | Example |
|---|---|---|
| Classes | PascalCase | `OrderService` |
| Interfaces | `I` prefix + PascalCase | `IOrderRepository` |
| Methods | PascalCase | `GetOrderById` |
| Properties | PascalCase | `OrderNumber` |
| Private fields | `_camelCase` | `_orderRepository` |
| Constants | PascalCase | `MaxRetryCount` |
| Async methods | `Async` suffix | `GetOrdersAsync` |
| Enum values | PascalCase | `OrderStatus.Pending` |

### Error Handling

- Use custom domain exceptions: `OrderNotFoundException`, `ValidationException`
- Global exception handler middleware in API layer
- Never expose stack traces in production responses
- Always log exceptions with context

### Example — Global Exception Handler

```csharp
public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
        => _logger = logger;

    public async ValueTask<bool> TryHandleAsync(HttpContext context,
        Exception exception, CancellationToken ct)
    {
        _logger.LogError(exception, "Unhandled exception: {Message}", exception.Message);

        var (statusCode, response) = exception switch
        {
            ValidationException ex => (400, new ProblemDetails
            {
                Title = "Validation Error",
                Status = 400,
                Detail = string.Join("; ", ex.Errors.Select(e => e.ErrorMessage)),
            }),
            NotFoundException ex => (404, new ProblemDetails
            {
                Title = "Not Found",
                Status = 404,
                Detail = ex.Message,
            }),
            _ => (500, new ProblemDetails
            {
                Title = "Internal Server Error",
                Status = 500,
                Detail = "An unexpected error occurred.",
            }),
        };

        context.Response.StatusCode = statusCode;
        await context.Response.WriteAsJsonAsync(response, ct);
        return true;
    }
}
```
