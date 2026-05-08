---
name: DotNet Application Layer — CQRS, Validation, Auth & Logging
description: .NET 8 Application layer patterns — MediatR CQRS, FluentValidation pipeline, JWT authentication, Serilog structured logging, and API controller conventions. Load this file when implementing commands, queries, validators, auth, or controllers.
---

# .NET Application Layer — CQRS, Validation, Auth & Logging

> **Prerequisite:** `dotnet-core.md` establishes the project structure and naming rules — ensure those conventions are followed throughout.

---

## 1. API Style — Controllers + Minimal APIs

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

## 2. Authentication & Authorization

- **JWT** (OAuth2 / OpenID Connect) — default
- **Azure AD** — for corporate identity scenarios

### Rules

- Stateless authentication — no server-side sessions
- Short-lived access tokens (15–30 min)
- Refresh tokens stored securely (httpOnly cookies)
- **Never** implement custom token generation — use proven libraries
- Use `[Authorize]` attribute with policies for role-based access
- Plain `[Authorize]` without a role or policy is **prohibited** — every endpoint must declare its minimum required role or policy explicitly

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

## 3. Logging — Serilog

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

## 4. Validation — FluentValidation

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
