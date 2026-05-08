---
description: "Testing — Use when: implementing full test suites for a completed story, verifying coverage targets, writing Cypress E2E tests from acceptance criteria, validating integration tests, or checking CI test configuration. Runs after Development and before SOC Review."
---

# Test Agent

This workflow takes a completed implementation as input and produces a fully verified test suite — unit tests, integration tests, and E2E tests — with confirmed coverage and passing CI integration. It runs after the Development Agent and before the SOC Review Agent.

---

## Entry Gate Check

Run this before anything else. If any hard gate fails, halt and list what is missing.

### Infer app name and artifact path
Derive `<app-name>` from the project root folder name, or find an existing `*-artifacts/` directory in the working tree.

### Hard gates (all must pass)

| Check | How to verify | Failure message |
|---|---|---|
| Active story specified | User has provided a story ID (US-XXX) | "Specify the story to test (e.g. US-003)." |
| Implementation summary exists | `<app-name>-artifacts/development/[name]_implementation_summary_[US-XXX]_*.md` exists | "Implementation summary missing. Run the Development workflow first." |
| Source code exists | `<app-name>-artifacts/development/<app-name>-ai/` contains frontend and/or backend source files | "Source code not found. Run the Development workflow first." |
| Acceptance criteria available | `<app-name>-artifacts/requirements/*_acceptance_criteria_*.csv` contains rows for the active story | "No acceptance criteria found for [US-XXX]. Cannot derive test scenarios without them." |
| Test stubs present | Test files exist alongside source files (`.spec.ts` for Angular, `*Tests.cs` for .NET) | "Test stubs missing. Development Agent should have created them. Proceeding to create from scratch." |

### State file cross-check (if present)
If `project_status.md` exists:
- Development row must be `✅ Done`. If not:
  > _"project_status.md shows Development as [status]. Test Agent requires completed implementation. Verify development is done before proceeding."_

### Context load
If `app-context.md` exists:
- Read Section 2 (Technical Inventory) — lists every component, handler, and endpoint that was designed and implemented. Use it to ensure no implemented unit is missed in the test plan.
- Read Section 3 (Security Posture) — data classification informs which scenarios need negative security tests.

---

## Prerequisite: Load Skills

Before starting any step, load the testing skill and relevant stack skills.

1. Always load:
   - `.agents/skills/testing/SKILL.md` — primary authority for test frameworks, naming conventions, coverage targets, mock patterns, CI integration
2. Detect stack and load accordingly:
   - `angular.json` or `@angular/core` in `package.json` → `.agents/skills/angular-frontend/SKILL.md`
   - `*.csproj` or `*.sln` → `.agents/skills/dotnet-backend/dotnet-core.md` (architecture + naming) and `.agents/skills/dotnet-backend/dotnet-infrastructure.md` (data access patterns for integration test setup)
3. All test code produced by this agent must follow the conventions in the loaded skill(s). The testing skill overrides any generic convention where there is a conflict.

---

## Step 1: Test Plan

Read the implementation and derive a complete test plan before writing a single test.

### Instructions

1. Read the implementation summary (`*_implementation_summary_[US-XXX]_*.md`) fully. Note every file created and modified.
2. Read the acceptance criteria CSV for the active story. Each Gherkin scenario maps to at least one test case.
3. Scan existing test stub files to understand what structure is already in place.
4. For each implemented unit, classify the test type needed:

| Implementation Unit | Test Type | Framework |
|---|---|---|
| Angular component | Unit — component rendering, input/output bindings, event handlers | Jest |
| Angular service | Unit — HTTP calls (happy + error), business logic | Jest + HttpClientTestingModule |
| Angular guard / resolver | Unit — allow/deny scenarios | Jest |
| Angular pipe | Unit — all value transformations, edge cases | Jest |
| Angular E2E acceptance scenario | E2E — user-visible acceptance criteria flows | Cypress |
| .NET command/query handler | Unit — valid input, invalid input, boundary cases | xUnit + Moq |
| .NET controller | Unit — route dispatches correctly, auth attribute present | xUnit + Moq |
| .NET FluentValidation validator | Unit — valid, missing required, out-of-range, invalid format | xUnit |
| .NET repository | Integration — actual DB CRUD, not mocked | xUnit + SQLite fixture |
| .NET domain entity | Unit — invariants, factory methods, business rules | xUnit |

5. Output a **Test Plan** before writing any code:

```
### Test Plan — [Story ID]: [Story Title]

| # | Unit Under Test | Test Type | Scenarios to Cover | File |
|---|---|---|---|---|
| 1 | PermitFormComponent | Unit | renders form fields; disables submit when invalid; emits on valid submit | permit-form.component.spec.ts |
| 2 | PermitsService | Unit | getPermits — happy path; getPermits — 404 error; createPermit — returns id | permits.service.spec.ts |
| 3 | CreatePermitCommandHandler | Unit | valid command returns id; duplicate throws; missing location throws | CreatePermitCommandHandlerTests.cs |
| 4 | PermitRepository | Integration | AddAsync persists; GetByIdAsync returns; GetAll returns all active | PermitRepositoryTests.cs |
| 5 | Permit Submission flow | E2E | user submits valid permit; user sees error on missing field | permit-submission.cy.ts |
```

6. Present the test plan to the user for confirmation before proceeding to implementation.

---

## Step 2: Unit Tests — Angular (Jest)

Implement full Jest unit test suites for every Angular unit in the test plan.

### Implementation Rules

- Follow the test structure, naming conventions, and templates from the Testing skill exactly.
- One `describe` block per class. One `it` block per distinct behaviour.
- Every `it` must follow the **Arrange–Act–Assert** (AAA) pattern with a blank line between each section.
- Use `HttpClientTestingModule` + `HttpTestingController` for all service HTTP tests — never mock `HttpClient` directly.
- Use `TestBed.configureTestingModule` with only the minimal providers needed — do not import the full `AppModule`.
- Signal-based components: test signals directly with `.set()` / `.()` calls — no DOM interaction needed for signal state.
- Verify `httpMock.verify()` in `afterEach` for all service tests.
- Coverage target: **≥80% statements and branches per file** (enforced in Step 5).

### Scenarios to Always Include

For every component:
- `should create` (smoke test)
- `should display [key content] when [condition]`
- `should emit [event] when [action]`
- `should disable [control] when [invalid state]`

For every service:
- Happy path for each public method
- HTTP error path (4xx, 5xx) for each method that calls the API
- Any business logic branch in the service

For every guard:
- `should allow access when [authorised condition]`
- `should redirect when [unauthorised condition]`

### Output path
Test files live **alongside their source files**:
`<app-name>-artifacts/development/<app-name>-ai/<app-name>-frontend/src/app/features/[feature]/[unit].spec.ts`

---

## Step 3: Unit Tests — .NET (xUnit)

Implement full xUnit test suites for every .NET unit in the test plan.

### Implementation Rules

- Follow the naming convention from the Testing skill: `[ClassUnderTest]Tests.cs` / `[MethodName]_[Scenario]_[ExpectedResult]`
- Use **FluentAssertions** for all assertions — never raw `Assert.Equal`.
- Use **Moq** for all interface/dependency mocking. Use `MockBehavior.Strict` for critical dependencies.
- Never mock domain entities — only mock interfaces and infrastructure dependencies.
- Verify mocked calls with `Times.Once` / `Times.Never` for critical interactions.
- Use `[Theory]` + `[InlineData]` for parameterised cases (multiple valid/invalid inputs for the same test logic).

### Scenarios to Always Include

For every command/query handler:
- `Handle_ValidCommand_Returns[ExpectedResult]`
- `Handle_[InvalidCondition]_Throws[ExceptionType]` (one case per validation rule)
- `Handle_[BoundaryCondition]_[ExpectedBehaviour]`

For every FluentValidation validator:
- `Validate_ValidModel_PassesValidation`
- `Validate_Missing[RequiredField]_FailsWithMessage`
- `Validate_[OutOfRangeField]_FailsWithMessage`

For every controller (unit, not integration):
- `[Action]_ValidRequest_ReturnsOk` — confirm MediatR `Send` was called with correct command
- `[Action]_UnauthorisedRequest_Returns401` — if `[Authorize]` is present, confirm it is applied

### Output path
`<app-name>-artifacts/development/<app-name>-ai/<app-name>-backend/tests/<App>.Tests/`

---

## Step 4: Integration Tests — .NET Repositories

Implement integration tests that hit a real database. Never mock the database in integration tests.

### Setup

Create (or reuse) a `DatabaseFixture` using SQLite in-memory for local execution and SQL Server for CI:

```csharp
public class DatabaseFixture : IDisposable
{
    public AppDbContext Context { get; }

    public DatabaseFixture()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite("DataSource=:memory:")
            .Options;
        Context = new AppDbContext(options);
        Context.Database.OpenConnection();
        Context.Database.EnsureCreated();
    }

    public void Dispose()
    {
        Context.Database.CloseConnection();
        Context.Dispose();
    }
}
```

### Scenarios to Always Include

For every repository:
- `AddAsync_ValidEntity_PersistsToDatabase`
- `GetByIdAsync_ExistingId_ReturnsEntity`
- `GetByIdAsync_NonExistentId_ReturnsNull`
- `UpdateAsync_ValidChange_PersistsChange`
- `DeleteAsync_ExistingEntity_RemovesFromDatabase` (if delete is in scope)
- `GetAllAsync_WithFilter_ReturnsFilteredResults` (if filtering is implemented)

### Output path
`<app-name>-artifacts/development/<app-name>-ai/<app-name>-backend/tests/<App>.Tests/Integration/`

---

## Step 5: E2E Tests — Cypress

Implement Cypress E2E tests that execute every acceptance criteria happy path and key error paths.

### Mapping Rule
Each Gherkin scenario in the acceptance criteria CSV maps to exactly one Cypress `it` block.

```
Given [precondition] → `beforeEach` setup or `cy.login()` custom command
When [action]        → `cy.get('[data-testid="..."]').click()` / `.type()` / `.select()`
Then [outcome]       → `cy.get('[data-testid="..."]').should('...')`
```

### Implementation Rules

- All element selectors use `data-testid` attributes — never CSS classes or element types.
- If a required `data-testid` is missing from a component, **do NOT silently add it here**. Instead, trigger a loop-back to Development:
  1. List every element that is missing a `data-testid` attribute (component file + line + element description).
  2. If invoked via the Orchestrator: stop, report the gap to the orchestrator — the orchestrator will set Development to `🔁 Needs Rework` and re-enter the Development phase to add the missing attributes.
  3. If invoked directly: update `project_status.md` — set Development to `🔁 Needs Rework`, add an entry to the Loop-Back Log describing the missing attributes, and halt this step. Notify the user: _"Cypress E2E blocked — [N] `data-testid` attributes missing. Development must be reworked to add them before E2E tests can run."_ Do not write Cypress tests that reference absent selectors.
- Reuse `cy.login()` and other shared commands from `cypress/support/commands.ts`.
- Use `cypress/fixtures/` for static test data — never hardcode test data inline.
- One `describe` block per user story. `it` blocks use Gherkin-style names.

### Scenarios to Always Include

For every story with a form submission:
- Happy path: fill all valid fields → submit → verify success state
- Validation error: submit empty form → verify error messages
- Auth gate: attempt to access the page unauthenticated → verify redirect

For every story with a list/display:
- Data loads and renders correctly
- Empty state is handled
- Auth-restricted data is not visible to unauthorised roles

### Output path
`<app-name>-artifacts/development/<app-name>-ai/<app-name>-frontend/cypress/e2e/features/[feature-name].cy.ts`

---

## Step 6: Coverage Verification & Gap Closure

Run coverage checks and close any gaps before declaring the test suite complete.

### Instructions

1. **Angular — run Jest with coverage:**
   ```bash
   cd "<app-name>-artifacts/development/<app-name>-ai/<app-name>-frontend"
   npm run test -- --coverage --watchAll=false
   ```
   Review the coverage summary. For any file below 80%, identify the untested branch or statement and add a targeted `it` block to cover it.

2. **.NET — run xUnit with coverlet:**
   ```bash
   cd "<app-name>-artifacts/development/<app-name>-ai/<app-name>-backend"
   dotnet test --collect:"XPlat Code Coverage" --settings coverlet.runsettings
   ```
   Open the generated `coverage.cobertura.xml` or `lcov.info`. Any class/method below threshold gets an additional test.

3. **Coverage exclusions** — do not chase coverage on:
   - EF Core migrations (`*Migrations*`)
   - Auto-generated DTOs (`*Dto.cs`)
   - `Program.cs` bootstrap
   - Angular environment files

4. **Gap closure rule:** If a gap cannot be closed without significant refactoring of the production code (e.g., a method has no seam for injection), document it in the test summary as a known gap with the reason. Do not modify production code structure for test coverage alone — surface it as a design feedback item.

5. Confirm final coverage meets the threshold before proceeding:

| Layer | Tool | Target |
|---|---|---|
| Angular unit | Jest | ≥80% statements + branches |
| .NET unit | xUnit + coverlet | ≥80% line coverage (excl. migrations + DTOs) |
| E2E acceptance | Cypress | 100% of acceptance criteria happy paths |

---

## Step 7: CI Test Configuration Validation

Verify the CI pipeline is correctly configured to run and gate on tests.

### Checklist

- [ ] `jest.config.ts` exists with `coverageThresholds` set to 80 (statements, branches, functions, lines)
- [ ] `coverlet.runsettings` exists with `<Threshold>80</Threshold>` and `<ThresholdType>line</ThresholdType>`
- [ ] Angular pipeline step (`npm run test -- --coverage`) is present in `azure-pipelines.yml`
- [ ] .NET pipeline step (`dotnet test --collect:"XPlat Code Coverage"`) is present in `azure-pipelines.yml`
- [ ] `PublishCodeCoverageResults` task is present in both Angular and .NET pipeline stages
- [ ] Both pipeline stages are configured to **fail on coverage drop** (enforced by threshold in jest.config.ts / coverlet.runsettings)
- [ ] Cypress E2E stage exists in the pipeline (can be post-deploy, not pre-merge)

If any item is missing, fix it now. Do not defer CI configuration gaps.

---

## Step 8: Test Summary Artifact

Generate the mandatory test summary artifact before marking the Testing phase complete.

### Output File Naming Convention

```
[app-name]_test_summary_[story-id]_[YYYY-MM-DD].md
```

**Output path:** `<app-name>-artifacts/testing/`

### Summary Format

```markdown
## Test Summary — [Story ID]: [Story Title]
**Date:** [YYYY-MM-DD]  |  **Story:** [US-XXX]  |  **Verdict:** ✅ Pass | 🔴 Fail

### Coverage Results
| Layer | Target | Achieved | Status |
|---|---|---|---|
| Angular unit (Jest) | ≥80% | [X]% | ✅ / 🔴 |
| .NET unit (xUnit) | ≥80% | [X]% | ✅ / 🔴 |
| E2E acceptance (Cypress) | 100% AC happy paths | [X]/[N] scenarios | ✅ / 🔴 |

### Test Files Created / Updated
| File | Type | Tests Added | Coverage |
|---|---|---|---|
| `permits.service.spec.ts` | Angular unit | 6 | 92% |
| `CreatePermitCommandHandlerTests.cs` | .NET unit | 4 | 88% |
| `PermitRepositoryTests.cs` | .NET integration | 3 | 100% |
| `permit-submission.cy.ts` | E2E | 3 scenarios | 3/3 AC |

### Acceptance Criteria Coverage
| Criterion | Test File | Test Case | Status |
|---|---|---|---|
| User can submit a valid permit | permit-submission.cy.ts | should submit permit when all fields valid | ✅ |
| Validation errors shown on empty submit | permit-submission.cy.ts | should show errors when fields missing | ✅ |
| Unauthorised user cannot access form | permit-submission.cy.ts | should redirect when unauthenticated | ✅ |

### Known Gaps (if any)
| File | Uncovered Area | Reason | Action |
|---|---|---|---|
| — | — | — | — |

### data-testid Additions (if any)
| Component File | Attribute Added | Purpose |
|---|---|---|
| permit-form.component.html | `data-testid="submit-btn"` | Cypress selector for submit button |
```

---

## Orchestrator Write-Back

> **If invoked via the Orchestrator:** Skip this section — the orchestrator handles all state updates itself.
> **If invoked directly:** Run this section after all other steps are complete.

### 1. Locate State Files

Search for `<app-name>-artifacts/orchestrator/project_status.md`.
If not found, skip — the orchestrator has not been initialised for this project.

### 2. Write handoff file

Write `<app-name>-artifacts/orchestrator/handoffs/testing-S{N}-{US-XXX}.md` using this schema:

```markdown
# Handoff: Testing → SOC Review — S[N] · [US-XXX] — [YYYY-MM-DD]
Story: [US-XXX] — [title]
Jest: [X]% stmts / [X]% branches | xUnit: [X]% line
E2E: [N]/[N] AC scenarios passing
Known gaps: [N — brief description | none]
Negative security tests: [ran / not needed]
Loop-backs triggered: [N | none]
Artifacts: testing/[test summary filename]
```

### 3. Update `project_status.md`

- Set the active story's **Test** column in Sprint Backlog to `⏸️ Awaiting Review` (or `🔁 Needs Rework` if gates not met)
- Set Testing row **Phase Status** to `⏸️ Awaiting Review` (or `🔁 Needs Rework`); set Handoff File to `handoffs/testing-S{N}-{US-XXX}.md`
- Set `Active Sub-Workflow` to `none`
- Update `Last Updated` timestamp
- If any coverage gate failed, record in Loop-Back Log

### 3. Update `app-context.md` — Section 2: Technical Inventory

- For each component and handler that now has tests: note `[tested S{N}]` in the Status column
- Do NOT touch Sections 1, 3, or 4
