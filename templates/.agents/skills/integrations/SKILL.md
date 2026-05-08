---
name: Integrations
description: External system integration standards — decision rules for OData vs RFC/BAPI, anti-corruption layer pattern, service adapters, SAP-specific HTTP and NCo conventions, resilience, data mapping, and integration testing. Strong bias toward OData for net-new developments.
---

# Integrations Skill

When implementing integrations with external systems (SAP S/4HANA, SAP ECC, or any third-party system), **always follow these standards**. These rules apply automatically whenever you scaffold, implement, or review integration code.

---

## 1. Integration Decision Rules — OData vs RFC/BAPI

**Default choice for all net-new integrations is OData.** RFC/BAPI is only used when OData is not available or technically insufficient.

### Decision Table

| Situation | Use |
|---|---|
| SAP S/4HANA with an available OData service | **OData** |
| New integration requirement, SAP version is S/4HANA | **OData** |
| Read-heavy data retrieval (orders, materials, vendors) from S/4HANA | **OData** |
| Create / update operations where an OData service exists | **OData** |
| SAP ECC (older system) with no OData Gateway configured | **RFC/BAPI** |
| Complex transactional operations with no equivalent OData service | **RFC/BAPI** |
| Bulk data extraction requiring high throughput (millions of records) | **RFC/BAPI** |
| Legacy integration that already uses RFC — extending existing flow | **RFC/BAPI** |
| SAP BTP Integration Suite acting as middleware | **OData** (to BTP endpoint) |

### Rules

- **Never introduce RFC/BAPI for a net-new integration without first confirming no OData service exists.** Document the absence in the integration design.
- If both are technically available, **OData wins** — RFC/BAPI should not be chosen for convenience or familiarity.
- If RFC/BAPI is chosen, record the justification as an ADR in the design artifacts.

---

## 2. Architecture — Anti-Corruption Layer

All external system integrations must be isolated behind an **Anti-Corruption Layer (ACL)**. SAP data models, field naming conventions, and types must never leak into the application's domain or application layers.

### Layer Placement (Clean Architecture)

```
MyApp.Application/
└── Common/
    └── Interfaces/
        └── Integrations/
            ├── ISapMaterialService.cs      ← domain-facing interface
            ├── ISapPurchaseOrderService.cs
            └── ISapVendorService.cs

MyApp.Infrastructure/
└── Integrations/
    └── Sap/
        ├── OData/
        │   ├── SapODataClient.cs           ← shared HTTP client wrapper
        │   ├── Materials/
        │   │   ├── SapMaterialService.cs   ← implements ISapMaterialService
        │   │   └── Dtos/
        │   │       ├── SapMaterialDto.cs   ← raw SAP response shape
        │   │       └── SapMaterialMapper.cs← maps SAP DTO → domain model
        │   └── PurchaseOrders/
        │       ├── SapPurchaseOrderService.cs
        │       └── Dtos/
        ├── Rfc/
        │   ├── SapRfcConnectionFactory.cs  ← NCo connection pool wrapper
        │   ├── Materials/
        │   │   ├── SapRfcMaterialService.cs
        │   │   └── Dtos/
        └── SapConfiguration.cs             ← typed config (URL, creds)
```

### Rules

- **Application layer defines the interface** — it expresses what the app needs in domain terms
- **Infrastructure layer implements** — it knows about SAP, OData URLs, RFC function names
- **Domain models never reference SAP DTOs** — mapping always happens in `Infrastructure`
- **One service class per SAP business object** — do not create a single god class for all SAP calls
- **DTOs are internal to Infrastructure** — never expose `SapMaterialDto` to Application or API layers

---

## 3. OData Integration Pattern

### Required NuGet Packages

```xml
<PackageReference Include="Microsoft.Extensions.Http.Resilience" Version="8.x.x" />
<PackageReference Include="Microsoft.Extensions.Options" Version="8.x.x" />
```

> Use `HttpClient` directly — do not use the `Microsoft.OData.Client` library. It adds complexity without benefit for consuming SAP OData APIs.

### Configuration

```csharp
// SapConfiguration.cs
public class SapConfiguration
{
    public string BaseUrl { get; init; } = string.Empty;       // e.g. https://your-s4.example.com
    public string ODataBasePath { get; init; } = "/sap/opu/odata/sap";
    public string Username { get; init; } = string.Empty;      // from Key Vault
    public string Password { get; init; } = string.Empty;      // from Key Vault — marked isSecret in variable group
    public string ClientId { get; init; } = string.Empty;      // SAP client number e.g. "100"
    public int TimeoutSeconds { get; init; } = 30;
}
```

```json
// appsettings.json (structure only — values from Key Vault in cloud)
{
  "Sap": {
    "BaseUrl": "AZURE-KEY-VAULT",
    "ODataBasePath": "/sap/opu/odata/sap",
    "Username": "AZURE-KEY-VAULT",
    "Password": "AZURE-KEY-VAULT",
    "ClientId": "100",
    "TimeoutSeconds": 30
  }
}
```

### HttpClient Registration (DependencyInjection.cs in Infrastructure)

```csharp
services.Configure<SapConfiguration>(configuration.GetSection("Sap"));

services
    .AddHttpClient<SapODataClient>((sp, client) =>
    {
        var config = sp.GetRequiredService<IOptions<SapConfiguration>>().Value;
        client.BaseAddress = new Uri(config.BaseUrl);
        client.Timeout = TimeSpan.FromSeconds(config.TimeoutSeconds);

        var credentials = Convert.ToBase64String(
            Encoding.ASCII.GetBytes($"{config.Username}:{config.Password}"));
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Basic", credentials);
        client.DefaultRequestHeaders.Accept
            .Add(new MediaTypeWithQualityHeaderValue("application/json"));
        client.DefaultRequestHeaders.Add("sap-client", config.ClientId);
    })
    .AddStandardResilienceHandler();   // retry + circuit breaker — see Section 5
```

### Shared OData Client Wrapper

```csharp
public class SapODataClient(HttpClient httpClient, IOptions<SapConfiguration> config,
    ILogger<SapODataClient> logger)
{
    private readonly string _basePath = config.Value.ODataBasePath;

    public async Task<T?> GetAsync<T>(string serviceRoot, string resourcePath,
        string? odataQuery = null, CancellationToken ct = default)
    {
        var url = BuildUrl(serviceRoot, resourcePath, odataQuery);
        logger.LogInformation("SAP OData GET {Url}", url);

        var response = await httpClient.GetAsync(url, ct);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<T>(ct);
    }

    public async Task<HttpResponseMessage> PostAsync<T>(string serviceRoot,
        string resourcePath, T payload, CancellationToken ct = default)
    {
        var url = BuildUrl(serviceRoot, resourcePath);
        logger.LogInformation("SAP OData POST {Url}", url);

        return await httpClient.PostAsJsonAsync(url, payload, ct);
    }

    private string BuildUrl(string serviceRoot, string resourcePath, string? query = null)
    {
        var url = $"{_basePath}/{serviceRoot}/{resourcePath}?$format=json";
        if (!string.IsNullOrWhiteSpace(query)) url += $"&{query}";
        return url;
    }
}
```

### Service Implementation Example

```csharp
// Application interface (domain terms)
public interface ISapMaterialService
{
    Task<Material?> GetByCodeAsync(string materialCode, CancellationToken ct = default);
    Task<IEnumerable<Material>> GetByPlantAsync(string plantCode, CancellationToken ct = default);
}

// Infrastructure implementation (SAP terms, internally)
public class SapMaterialService(SapODataClient client, ILogger<SapMaterialService> logger)
    : ISapMaterialService
{
    private const string ServiceRoot = "API_MATERIAL_DOCUMENT_SRV";

    public async Task<Material?> GetByCodeAsync(string materialCode, CancellationToken ct = default)
    {
        var result = await client.GetAsync<SapODataResponse<SapMaterialDto>>(
            ServiceRoot,
            $"A_Material('{materialCode}')",
            ct: ct);

        return result?.D is null ? null : SapMaterialMapper.ToDomain(result.D);
    }

    public async Task<IEnumerable<Material>> GetByPlantAsync(string plantCode, CancellationToken ct = default)
    {
        var result = await client.GetAsync<SapODataCollectionResponse<SapMaterialDto>>(
            ServiceRoot,
            "A_Material",
            odataQuery: $"$filter=Plant eq '{plantCode}'&$top=500",
            ct: ct);

        return result?.D?.Results?.Select(SapMaterialMapper.ToDomain)
            ?? Enumerable.Empty<Material>();
    }
}
```

### OData Response Wrapper (standard SAP JSON envelope)

```csharp
public record SapODataResponse<T>(
    [property: JsonPropertyName("d")] T D);

public record SapODataCollectionResponse<T>(
    [property: JsonPropertyName("d")] SapODataResults<T> D);

public record SapODataResults<T>(
    [property: JsonPropertyName("results")] List<T> Results);
```

---

## 4. RFC/BAPI Integration Pattern

### Required NuGet Package

```xml
<!-- SAP NCo must be obtained from SAP Service Marketplace and referenced locally -->
<Reference Include="sapnco" HintPath="libs\sapnco.dll" />
<Reference Include="sapnco_utils" HintPath="libs\sapnco_utils.dll" />
```

> SAP NCo is not available on NuGet. Reference the DLLs locally from a `libs/` folder. Commit the DLLs to the repository — they are not secrets.

### Configuration

```csharp
public class SapRfcConfiguration
{
    public string AppServerHost { get; init; } = string.Empty;  // from Key Vault
    public string SystemNumber { get; init; } = string.Empty;   // e.g. "00"
    public string Client { get; init; } = string.Empty;         // e.g. "100"
    public string User { get; init; } = string.Empty;           // from Key Vault
    public string Password { get; init; } = string.Empty;       // from Key Vault — isSecret
    public string Language { get; init; } = "EN";
    public int MaxPoolSize { get; init; } = 5;
}
```

### Connection Factory

```csharp
public class SapRfcConnectionFactory(IOptions<SapRfcConfiguration> config,
    ILogger<SapRfcConnectionFactory> logger) : ISapRfcConnectionFactory
{
    private RfcDestination? _destination;
    private readonly Lock _lock = new();

    public RfcDestination GetDestination()
    {
        if (_destination is not null) return _destination;

        lock (_lock)
        {
            if (_destination is not null) return _destination;

            var cfg = config.Value;
            var parameters = new RfcConfigParameters
            {
                [RfcConfigParameters.AppServerHost] = cfg.AppServerHost,
                [RfcConfigParameters.SystemNumber]  = cfg.SystemNumber,
                [RfcConfigParameters.Client]        = cfg.Client,
                [RfcConfigParameters.User]          = cfg.User,
                [RfcConfigParameters.Password]      = cfg.Password,
                [RfcConfigParameters.Language]      = cfg.Language,
                [RfcConfigParameters.PoolSize]      = cfg.MaxPoolSize.ToString(),
            };

            _destination = RfcDestinationManager.GetDestination(parameters);
            logger.LogInformation("SAP RFC destination initialised for host {Host}", cfg.AppServerHost);
            return _destination;
        }
    }
}
```

### RFC Service Implementation Example

```csharp
public class SapRfcMaterialService(ISapRfcConnectionFactory connectionFactory,
    ILogger<SapRfcMaterialService> logger) : ISapMaterialService
{
    public async Task<Material?> GetByCodeAsync(string materialCode, CancellationToken ct = default)
    {
        return await Task.Run(() =>
        {
            try
            {
                var destination = connectionFactory.GetDestination();
                var function = destination.Repository.CreateFunction("BAPI_MATERIAL_GET_DETAIL");

                function.GetImportParameterTable("MATNR").Append().SetValue("MATNR", materialCode);

                function.Invoke(destination);

                var returnTable = function.GetTableParameter("RETURN");
                EnsureNoRfcError(returnTable, "BAPI_MATERIAL_GET_DETAIL");

                var detail = function.GetExportParameter("MATERIAL_GENERAL_DATA");
                return SapRfcMaterialMapper.ToDomain(detail);
            }
            catch (RfcBaseException ex)
            {
                logger.LogError(ex, "RFC call BAPI_MATERIAL_GET_DETAIL failed for material {MaterialCode}", materialCode);
                throw new IntegrationException($"SAP RFC call failed: {ex.Message}", ex);
            }
        }, ct);
    }

    private static void EnsureNoRfcError(IRfcTable returnTable, string functionName)
    {
        foreach (var row in returnTable)
        {
            var type = row.GetString("TYPE");
            if (type is "E" or "A")
                throw new IntegrationException(
                    $"{functionName} returned SAP error: {row.GetString("MESSAGE")}");
        }
    }

    // RFC does not support async natively — GetByPlantAsync must also use Task.Run
    public async Task<IEnumerable<Material>> GetByPlantAsync(string plantCode, CancellationToken ct = default)
        => await Task.Run(() => GetByPlantSync(plantCode), ct);

    private IEnumerable<Material> GetByPlantSync(string plantCode) { /* ... */ }
}
```

### Rules

- **RFC is inherently synchronous** — always wrap in `Task.Run` to avoid blocking the thread pool
- **Never share `IFunction` instances** across calls — create a new function object per invocation
- **Always check the `RETURN` table** for error types `E` (error) and `A` (abort) before reading output
- **Pool RFC connections** via `RfcDestinationManager` — never create raw connections per request

---

## 5. Resilience — Retry & Circuit Breaker

All integration calls (OData and RFC) must be wrapped with resilience policies.

### OData — `AddStandardResilienceHandler()`

```csharp
// In DependencyInjection.cs — already shown in Section 3
services.AddHttpClient<SapODataClient>(...)
    .AddStandardResilienceHandler(options =>
    {
        options.Retry.MaxRetryAttempts = 3;
        options.Retry.Delay = TimeSpan.FromSeconds(2);
        options.CircuitBreaker.BreakDuration = TimeSpan.FromSeconds(30);
    });
```

### RFC — Polly Pipeline

```csharp
// Register a Polly pipeline for RFC calls
services.AddResiliencePipeline("sap-rfc", builder =>
{
    builder
        .AddRetry(new RetryStrategyOptions
        {
            MaxRetryAttempts = 2,
            Delay = TimeSpan.FromSeconds(3),
            ShouldHandle = new PredicateBuilder().Handle<IntegrationException>()
                .Handle<RfcCommunicationException>(),
        })
        .AddCircuitBreaker(new CircuitBreakerStrategyOptions
        {
            FailureRatio = 0.5,
            SamplingDuration = TimeSpan.FromSeconds(60),
            BreakDuration = TimeSpan.FromSeconds(30),
        })
        .AddTimeout(TimeSpan.FromSeconds(45));
});
```

### Rules

- **Maximum 3 retries** for OData; **2 retries** for RFC (RFC is stateful — repeated calls may cause duplicate transactions)
- **Never retry on HTTP 4xx** (client errors) — only on 5xx and transient network failures
- **Never retry BAPI calls that write data** (POST/create/update) — retrying a write BAPI can create duplicates. Use idempotency checks or do not retry
- **Circuit breaker opens at 30 seconds** — downstream systems are given time to recover

---

## 6. Data Mapping Conventions

### Rules

- **One mapper class per SAP object** — `SapMaterialMapper`, `SapPurchaseOrderMapper`
- Mappers are **static classes with static methods** — no DI, no state
- **SAP field names stay in the DTO** — domain properties use standard English naming
- **Handle SAP null patterns** — SAP returns empty strings `""` and `"0000-00-00"` for nulls; always normalize

### Example Mapper

```csharp
public static class SapMaterialMapper
{
    public static Material ToDomain(SapMaterialDto dto) => new()
    {
        Code        = dto.Matnr.TrimStart('0'),              // SAP pads material codes with leading zeros
        Description = dto.Maktx,
        Unit        = dto.Meins,
        PlantCode   = dto.Werks,
        CreatedAt   = ParseSapDate(dto.Ersda),
        IsDeleted   = false,
    };

    private static DateTime? ParseSapDate(string sapDate)
    {
        // SAP date format: YYYYMMDD; empty/null means no date
        if (string.IsNullOrWhiteSpace(sapDate) || sapDate == "00000000") return null;
        return DateTime.TryParseExact(sapDate, "yyyyMMdd",
            CultureInfo.InvariantCulture, DateTimeStyles.None, out var date)
            ? date : null;
    }
}
```

### Common SAP Data Quirks to Always Handle

| SAP Pattern | Normalize To |
|---|---|
| Leading-zero padded codes (`0000001234`) | `TrimStart('0')` |
| Date `"00000000"` or `"0000-00-00"` | `null` |
| Empty string `""` for optional fields | `null` |
| Amount fields as string (`"1234.56"`) | `decimal.Parse` with `InvariantCulture` |
| Boolean as `"X"` (true) or `""` (false) | `value == "X"` |

---

## 7. Error Handling

### Custom Exception

```csharp
// Domain/Exceptions/IntegrationException.cs
public class IntegrationException : Exception
{
    public string? System { get; }
    public string? OperationName { get; }

    public IntegrationException(string message, Exception? inner = null)
        : base(message, inner) { }

    public IntegrationException(string system, string operationName, string message, Exception? inner = null)
        : base(message, inner)
    {
        System = system;
        OperationName = operationName;
    }
}
```

### Rules

- **All integration exceptions wrap to `IntegrationException`** — SAP-specific exception types never surface to Application or API layers
- **Log at the adapter level** — log the SAP error message, function name, and input parameters (excluding secrets)
- **Never expose raw SAP error messages to the API response** — map to a generic integration error with a correlation ID
- **Global exception handler maps `IntegrationException`** to HTTP 502 Bad Gateway:

```csharp
IntegrationException ex => (502, new ProblemDetails
{
    Title = "Integration Error",
    Status = 502,
    Detail = "An upstream system error occurred. Please try again or contact support.",
}),
```

---

## 8. Integration Testing

### Strategy

| Test Type | Tool | What to Test |
|---|---|---|
| Unit tests | Jest / xUnit | Mapper logic, error normalization, query string building |
| Integration adapter tests | xUnit + WireMock.Net | OData HTTP calls against a mocked SAP endpoint |
| RFC adapter tests | xUnit + Mock `ISapRfcConnectionFactory` | RFC function parameter setting and return table parsing |
| E2E (optional) | Manual / Postman | Against SAP sandbox/dev system |

### WireMock for OData Adapter Tests

```csharp
public class SapMaterialServiceTests : IAsyncLifetime
{
    private WireMockServer _server = null!;
    private ISapMaterialService _sut = null!;

    public async Task InitializeAsync()
    {
        _server = WireMockServer.Start();
        // wire up HttpClient pointing to _server.Url
        // build SapMaterialService via DI with test config
    }

    [Fact]
    public async Task GetByCodeAsync_ReturnsMappedMaterial_WhenSapResponds()
    {
        _server.Given(Request.Create()
                .WithPath("/sap/opu/odata/sap/API_MATERIAL_DOCUMENT_SRV/A_Material('MAT001')*")
                .UsingGet())
            .RespondWith(Response.Create()
                .WithStatusCode(200)
                .WithBodyAsJson(new { d = new { Matnr = "0000MAT001", Maktx = "Test Material" } }));

        var result = await _sut.GetByCodeAsync("MAT001");

        result.Should().NotBeNull();
        result!.Code.Should().Be("MAT001");
        result.Description.Should().Be("Test Material");
    }

    public Task DisposeAsync() { _server.Stop(); return Task.CompletedTask; }
}
```

### Rules

- **Never call a real SAP system in automated tests** — always mock
- **Test mappers independently** with raw SAP DTO fixtures — they contain the most error-prone logic
- **Test the SAP null/quirk patterns explicitly** (leading zeros, empty dates, `"X"` booleans)
- **RFC tests mock `ISapRfcConnectionFactory`** — never instantiate a real NCo connection in tests

---

## 9. Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Interface (Application layer) | `ISap[Object]Service` | `ISapMaterialService` |
| OData implementation | `Sap[Object]Service` in `OData/` folder | `SapMaterialService` |
| RFC implementation | `SapRfc[Object]Service` in `Rfc/` folder | `SapRfcMaterialService` |
| SAP DTO | `Sap[Object]Dto` | `SapMaterialDto` |
| Mapper | `Sap[Object]Mapper` | `SapMaterialMapper` |
| RFC mapper | `SapRfc[Object]Mapper` | `SapRfcMaterialMapper` |
| Configuration class | `Sap[Area]Configuration` | `SapConfiguration`, `SapRfcConfiguration` |
| Custom exception | `IntegrationException` | (shared across all integrations) |

### DI Registration

All integration services are registered in `Infrastructure/DependencyInjection.cs`:

```csharp
// OData services
services.AddScoped<ISapMaterialService, SapMaterialService>();
services.AddScoped<ISapPurchaseOrderService, SapPurchaseOrderService>();

// RFC services (only when OData is unavailable)
// services.AddScoped<ISapMaterialService, SapRfcMaterialService>();

// NOTE: Register only one implementation per interface.
// Comment out the unused one with a note explaining the choice.
```
