---
name: DotNet Core Backend — Architecture & Conventions
description: .NET 8 Clean Architecture structure, naming conventions, error handling, and project setup. Always load this file when .NET is detected. Load dotnet-application.md for CQRS/FluentValidation patterns, dotnet-infrastructure.md for EF Core/Dapper/database rules.
---

# .NET Core Backend — Architecture & Conventions

When developing .NET backend code, **always follow these standards**. These rules apply automatically whenever you create, modify, or scaffold any .NET project component.

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

## 3. General Coding Conventions

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

---

## 4. Companion Skill Files

| File | Purpose | When to Load |
|---|---|---|
| `dotnet-application.md` | CQRS handlers, MediatR, FluentValidation, JWT auth, Serilog | When implementing Application layer features (commands, queries, validators) |
| `dotnet-infrastructure.md` | EF Core + Dapper hybrid, DB migration rules, SQLite vs SQL Server divergences, Azure App Service deployment requirements | When implementing Infrastructure layer (repositories, data access, migrations, controllers, CI/CD) |
