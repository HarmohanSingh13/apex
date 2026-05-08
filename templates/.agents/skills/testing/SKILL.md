---
name: Testing
description: Testing standards for Angular (Jest + Cypress) and .NET (xUnit + Moq) — test structure, naming conventions, coverage thresholds, mock patterns, and CI integration rules.
---

# Testing Skill

When writing, reviewing, or scaffolding tests for Angular or .NET applications, **always follow these standards**. This skill activates automatically when working on test files, configuring test runners, or reviewing code coverage.

---

## 1. Coverage Targets

| Layer | Tool | Minimum Coverage | What Is Measured |
|---|---|---|---|
| Angular unit tests | Jest | 80% | Statements + branches per file |
| Angular E2E tests | Cypress | All acceptance criteria happy paths | Scenario coverage, not line coverage |
| .NET unit tests | xUnit | 80% | Line coverage per project (excluding Infrastructure migrations) |
| .NET integration tests | xUnit | All repository and service methods | Method coverage |

### Rules

- Coverage is measured **per project/app**, not per individual file — a single file at 40% is acceptable if the aggregate is ≥80%.
- **Migrations, generated code, and DTOs are excluded** from coverage calculations — configure exclusions in `coverlet.runsettings` for .NET and `jest.config.ts` for Angular.
- Coverage gates are enforced in CI — a pipeline that drops below 80% aggregate must fail the build.
- Coverage reports must be published as pipeline artifacts on every CI run.

---

## 2. Angular — Jest

### Project Setup

```jsonc
// jest.config.ts
export default {
  preset: 'jest-preset-angular',
  setupFilesAfterFramework: ['<rootDir>/setup-jest.ts'],
  testMatch: ['**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.module.ts',       // exclude NgModules if any exist
    '!src/main.ts',
    '!src/environments/**',
    '!src/**/*.d.ts',
  ],
  coverageThresholds: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
  coverageReporters: ['lcov', 'text-summary'],
};
```

### Test File Structure

- Test file lives **alongside the source file**: `my-component.component.spec.ts` next to `my-component.component.ts`
- One `describe` block per class; one `it` block per behaviour
- Import `TestBed` and `ComponentFixture` for component tests; plain `new Service()` for pure service tests

### Naming Convention

```typescript
describe('MyComponent', () => {
  describe('methodName', () => {
    it('should [expected behaviour] when [condition]', () => { ... });
    it('should [error behaviour] when [invalid condition]', () => { ... });
  });
});
```

### Component Test Template

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyComponent } from './my-component.component';

describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent],  // standalone component — import directly
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

### Service Test Template (with HTTP mock)

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MyService],
    });
    service = TestBed.inject(MyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should fetch items', () => {
    const mockItems = [{ id: 1, name: 'Test' }];
    service.getItems().subscribe(items => {
      expect(items).toEqual(mockItems);
    });
    const req = httpMock.expectOne('/api/items');
    expect(req.request.method).toBe('GET');
    req.flush(mockItems);
  });
});
```

### Signal-Based Component Testing

For components using Angular Signals:

```typescript
it('should update signal on action', () => {
  component.count.set(0);
  component.increment();
  expect(component.count()).toBe(1);
});
```

### What to Test (Angular)

| Source Type | Must Test |
|---|---|
| Component | Input/output bindings; conditional rendering; event handlers |
| Service | HTTP calls (happy + error path); business logic methods |
| Pipe | All value transformations including edge cases (null, empty, boundary values) |
| Guard | Allow and deny scenarios for each protected route |
| Resolver | Returns expected data; handles error state |

---

## 3. Angular — Cypress (E2E)

### Project Structure

```
cypress/
├── e2e/
│   ├── auth/
│   │   └── login.cy.ts
│   └── features/
│       └── permit-submission.cy.ts
├── fixtures/
│   └── permit.json           ← static test data
├── support/
│   ├── commands.ts           ← custom Cypress commands
│   └── e2e.ts                ← global setup
└── cypress.config.ts
```

### Naming Convention

- File: `[feature-name].cy.ts`
- `describe` maps to a **user story** or **feature area**
- `it` maps to an **acceptance criteria scenario** — use Gherkin-style names: `'should [action] when [condition]'`

### Custom Command Pattern

Define reusable auth and navigation actions in `support/commands.ts`:

```typescript
Cypress.Commands.add('login', (username: string, password: string) => {
  cy.visit('/login');
  cy.get('[data-testid="username"]').type(username);
  cy.get('[data-testid="password"]').type(password);
  cy.get('[data-testid="login-btn"]').click();
  cy.url().should('include', '/dashboard');
});
```

### Test Data Attribute Convention

All interactive elements must have `data-testid` attributes — **never select by CSS class or element type**:

```html
<button data-testid="submit-btn" type="submit">Submit</button>
```

### E2E Test Template

```typescript
describe('Permit Submission', () => {
  beforeEach(() => {
    cy.login('user@company.com', 'Password1!');
  });

  it('should submit a permit successfully when all fields are valid', () => {
    cy.visit('/permits/new');
    cy.get('[data-testid="permit-type"]').select('Hot Work');
    cy.get('[data-testid="location"]').type('Bay 3');
    cy.get('[data-testid="submit-btn"]').click();
    cy.get('[data-testid="success-toast"]').should('be.visible');
  });

  it('should show validation error when required fields are missing', () => {
    cy.visit('/permits/new');
    cy.get('[data-testid="submit-btn"]').click();
    cy.get('[data-testid="location-error"]').should('contain', 'Location is required');
  });
});
```

---

## 4. .NET — xUnit

### Project Structure

```
MySolution/
├── MyApp.API/
├── MyApp.Application/
├── MyApp.Domain/
├── MyApp.Infrastructure/
└── MyApp.Tests/
    ├── Unit/
    │   ├── Application/
    │   │   └── Handlers/
    │   │       └── CreatePermitCommandHandlerTests.cs
    │   └── Domain/
    │       └── PermitTests.cs
    ├── Integration/
    │   └── Repositories/
    │       └── PermitRepositoryTests.cs
    └── MyApp.Tests.csproj
```

### Test File and Class Naming

- File name: `[ClassUnderTest]Tests.cs`
- Class name: `[ClassUnderTest]Tests`
- Method name: `[MethodName]_[Scenario]_[ExpectedResult]`

```csharp
public class CreatePermitCommandHandlerTests
{
    [Fact]
    public async Task Handle_ValidCommand_ReturnsPermitId() { ... }

    [Fact]
    public async Task Handle_DuplicatePermit_ThrowsValidationException() { ... }
}
```

### Unit Test Template (MediatR Handler)

```csharp
public class CreatePermitCommandHandlerTests
{
    private readonly Mock<IPermitRepository> _repositoryMock;
    private readonly CreatePermitCommandHandler _handler;

    public CreatePermitCommandHandlerTests()
    {
        _repositoryMock = new Mock<IPermitRepository>();
        _handler = new CreatePermitCommandHandler(_repositoryMock.Object);
    }

    [Fact]
    public async Task Handle_ValidCommand_ReturnsNewPermitId()
    {
        // Arrange
        var command = new CreatePermitCommand { Location = "Bay 3", Type = PermitType.HotWork };
        var expectedId = Guid.NewGuid();
        _repositoryMock
            .Setup(r => r.AddAsync(It.IsAny<Permit>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().Be(expectedId);
        _repositoryMock.Verify(r => r.AddAsync(It.IsAny<Permit>(), CancellationToken.None), Times.Once);
    }
}
```

### Moq Rules

- **Always use `It.IsAny<T>()` for parameters you don't need to assert on** — never leave unmatched setups
- **Verify calls with `Times.Once` or `Times.Never`** for critical interactions
- **Never mock domain entities directly** — only mock interfaces and infrastructure dependencies
- Use `MockBehavior.Strict` when you need to enforce that only explicitly set up calls are made

### FluentAssertions

Use `FluentAssertions` for all assertions — not raw `Assert.Equal`:

```csharp
// Good
result.Should().NotBeNull();
result.Id.Should().NotBeEmpty();
result.Status.Should().Be(PermitStatus.Draft);

// Bad
Assert.NotNull(result);
Assert.NotEqual(Guid.Empty, result.Id);
```

### Integration Tests

Integration tests hit a **real SQLite database** (local dev) or **SQL Server test instance** (CI). Never mock the database in integration tests.

```csharp
public class PermitRepositoryTests : IClassFixture<DatabaseFixture>
{
    private readonly AppDbContext _context;
    private readonly PermitRepository _repository;

    public PermitRepositoryTests(DatabaseFixture fixture)
    {
        _context = fixture.Context;
        _repository = new PermitRepository(_context);
    }

    [Fact]
    public async Task AddAsync_ValidPermit_PersistsToDatabase()
    {
        // Arrange
        var permit = Permit.Create("Bay 3", PermitType.HotWork, Guid.NewGuid());

        // Act
        var id = await _repository.AddAsync(permit, CancellationToken.None);

        // Assert
        var saved = await _context.Permits.FindAsync(id);
        saved.Should().NotBeNull();
        saved!.Location.Should().Be("Bay 3");
    }
}
```

### Coverage Configuration

```xml
<!-- coverlet.runsettings -->
<RunSettings>
  <DataCollectionRunSettings>
    <DataCollectors>
      <DataCollector friendlyName="XPlat Code Coverage">
        <Configuration>
          <Format>lcov,cobertura</Format>
          <Exclude>[*.Tests]*,[*]*.Migrations.*,[*]*Dto</Exclude>
          <Threshold>80</Threshold>
          <ThresholdType>line</ThresholdType>
          <ThresholdStat>average</ThresholdStat>
        </Configuration>
      </DataCollector>
    </DataCollectors>
  </DataCollectionRunSettings>
</RunSettings>
```

---

## 5. CI Integration

### Angular Pipeline Step

```yaml
- task: Npm@1
  displayName: 'Run Jest unit tests'
  inputs:
    command: custom
    customCommand: 'run test -- --coverage --coverageReporters=lcov --watchAll=false'

- task: PublishCodeCoverageResults@1
  displayName: 'Publish coverage report'
  inputs:
    codeCoverageTool: Cobertura
    summaryFileLocation: coverage/cobertura-coverage.xml
```

### .NET Pipeline Step

```yaml
- task: DotNetCoreCLI@2
  displayName: 'Run xUnit tests with coverage'
  inputs:
    command: test
    projects: '**/*.Tests.csproj'
    arguments: '--collect:"XPlat Code Coverage" --settings coverlet.runsettings --no-build'

- task: PublishCodeCoverageResults@1
  displayName: 'Publish coverage report'
  inputs:
    codeCoverageTool: Cobertura
    summaryFileLocation: '**/coverage.cobertura.xml'
```

### CI Rules

- Tests must run on **every PR** — not just on merge to `develop`
- A failing test blocks merge — no `--force` or skip flags permitted
- Coverage drop below threshold blocks merge — treat it the same as a failing test
- Test results must be published as pipeline test attachments so they're visible in Azure DevOps PR view
