---
name: DotNet Infrastructure Layer — EF Core, Dapper, Database & Deployment
description: .NET 8 Infrastructure layer patterns — EF Core + Dapper hybrid, database configuration (SQLite local / Azure SQL cloud), migration rules, SQLite vs SQL Server divergences, and Azure App Service IIS deployment requirements. Load this file when implementing data access, migrations, or deploying to Azure.
---

# .NET Infrastructure Layer — Data Access & Deployment

> **Prerequisite:** `dotnet-core.md` establishes the project structure. `dotnet-application.md` defines the Application layer patterns that the Infrastructure layer implements.

---

## 1. Data Access — EF Core + Dapper Hybrid

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

## 2. Database

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

---

## 3. SQLite vs SQL Server — Known Divergences

> **Why this matters:** SQLite is used locally for developer convenience. The cloud target is SQL Server. These engines behave differently in ways that cause bugs that work locally but fail in cloud — or silently give wrong results.

| Area | SQLite behaviour | SQL Server behaviour | Safe coding rule |
|---|---|---|---|
| **Foreign key enforcement** | FK constraints are **OFF by default** — invalid references silently insert | FK constraints are always enforced | Enable FK enforcement in SQLite: `PRAGMA foreign_keys = ON;` — add in `OnConfiguring` or via migration `HasAnnotation` |
| **Column alterations in migrations** | No `ALTER COLUMN` support — EF Core must drop and recreate the table | Full `ALTER COLUMN` support | Always generate migrations against the SQL Server provider; test migrations on SQL Server before merging |
| **String collation / case sensitivity** | Case-**insensitive** by default for `LIKE` and equality | Case-insensitive by default but collation is configurable | Specify `UseCollation("SQL_Latin1_General_CP1_CI_AS")` on string columns in `OnModelCreating` |
| **DateTime precision** | Stores as ISO 8601 text or real; no sub-second precision guarantee | `datetime2(7)` provides 100ns precision | Map `DateTime` columns to `datetime2` explicitly: `.HasColumnType("datetime2")` in Fluent API |
| **GUID storage** | Stored as 36-char text string | Stored as 16-byte `uniqueidentifier` (efficient) | EF Core handles this transparently — no manual override needed |
| **Decimal / money precision** | Stored as 8-byte float — rounding errors possible for financial values | `decimal(p,s)` stores exact fixed-point values | Always annotate decimal columns: `.HasColumnType("decimal(18,2)")` in Fluent API |
| **String length enforcement** | `VARCHAR(n)` length limit is **not enforced** — longer strings insert silently | Length limits are enforced; insert fails if exceeded | Always call `.HasMaxLength(n)` in Fluent API and validate at the application layer — never rely on DB enforcement alone |
| **Concurrent writes** | File-level locking — one writer at a time | Row/page-level locking with MVCC | Acceptable for local dev; never use SQLite in staging or production |
| **Schema-qualified names** | No schema support (`dbo.TableName` is invalid) | Tables belong to a schema (default `dbo`) | EF Core uses `dbo` by default — no action needed unless you use custom schemas |
| **Computed columns** | Limited support (`STORED` only) | Full computed column support | Avoid computed columns in migrations unless tested on both providers |

### Integration Test Configuration

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

## 4. CI/CD — Azure DevOps

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

---

## 5. Azure App Service (IIS) Deployment Requirements

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
