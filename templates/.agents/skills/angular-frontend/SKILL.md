---
name: Angular Frontend
description: Angular 18 development standards — standalone components, Signals-first state management, feature-based structure, SCSS, reactive forms, Jest/Cypress testing, and company naming conventions.
---

# Angular Frontend Skill

When developing Angular frontend code, **always follow these standards**. These rules apply automatically whenever you create, modify, or scaffold Angular components, services, pages, or features.

---

## 1. Framework Version & Component Model

- **Angular 18** (latest LTS)
- **Standalone Components by default** — every new component, directive, and pipe must be standalone
- **Do NOT create NgModules** for new development
- Use `@Component({ standalone: true, imports: [...] })` pattern

### Example — Standalone Component

```typescript
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'company-orders-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.page.html',
  styleUrl: './orders.page.scss',
})
export class OrdersPageComponent {
  readonly title = signal('Orders');
}
```

---

## 2. State Management — Signals First

Use a **tiered approach** — choose the simplest option that fits:

| Tier | When to Use | Tool |
|---|---|---|
| **Tier 1** | Local component state, simple toggles/counters | `signal()`, `computed()`, `effect()` |
| **Tier 2** | Shared feature state (2–5 components) | Injectable services with `signal()` |
| **Tier 3** | Complex, multi-component features | NgRx Signal Store |
| **Tier 4** | HTTP calls, WebSockets, async streams | RxJS (`Observable`, `Subject`) |

### Rules

- **Signals first** — always prefer Signals over BehaviorSubject/ReplaySubject
- **RxJS only** when stream semantics are needed (HTTP, WebSocket, debounce, merge)
- **Never** mix BehaviorSubject and Signal for the same state
- Use `toSignal()` and `toObservable()` for interop when needed

### Example — Feature Store (Tier 2)

```typescript
import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OrdersStore {
  private readonly _orders = signal<Order[]>([]);
  private readonly _loading = signal(false);

  readonly orders = this._orders.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly orderCount = computed(() => this._orders().length);

  setOrders(orders: Order[]) {
    this._orders.set(orders);
  }

  setLoading(loading: boolean) {
    this._loading.set(loading);
  }
}
```

---

## 3. Styling

- **SCSS** as the default stylesheet preprocessor — never plain CSS
- **Component library selection** based on project type:

| Project Type | Library |
|---|---|
| Enterprise / internal tools | Angular Material |
| Business dashboards | PrimeNG |
| Custom UI / public-facing | Tailwind CSS (with SCSS design tokens) |

### Rules

- Use component-scoped SCSS (`.page.scss`, `.component.scss`)
- Define shared variables and mixins in `src/styles/` (e.g., `_variables.scss`, `_mixins.scss`)
- Avoid inline styles
- Use CSS custom properties for theming

---

## 4. Project Structure — Feature-Based

```
src/app/
├── core/                          # App-wide concerns (singleton)
│   ├── auth/
│   │   ├── auth.service.ts
│   │   ├── auth.guard.ts
│   │   └── auth.interceptor.ts
│   ├── interceptors/
│   │   ├── error.interceptor.ts
│   │   └── correlation-id.interceptor.ts
│   └── services/
│       └── notification.service.ts
│
├── features/                      # Business features (self-contained)
│   ├── orders/
│   │   ├── orders.page.ts         # Page component
│   │   ├── orders.page.html
│   │   ├── orders.page.scss
│   │   ├── orders.store.ts        # Feature state
│   │   ├── orders.service.ts      # API calls
│   │   ├── orders.routes.ts       # Feature routes
│   │   ├── orders.model.ts        # Interfaces/types
│   │   └── components/            # Feature-specific child components
│   │       ├── order-card.component.ts
│   │       └── order-filter.component.ts
│   └── dashboard/
│       ├── dashboard.page.ts
│       └── ...
│
├── shared/                        # Minimal reusable UI & utilities
│   ├── components/
│   │   ├── data-table/
│   │   └── confirm-dialog/
│   ├── pipes/
│   ├── directives/
│   └── utils/
│
├── app.component.ts
├── app.config.ts
└── app.routes.ts
```

### Rules

- **No** generic `components/`, `services/`, or `models/` folders at root level
- Everything grouped by **business capability**
- `core/` contains app-wide singleton concerns only
- `shared/` is minimal — only truly reusable UI primitives
- Each feature is self-contained and independently lazy-loadable

---

## 5. API Communication

### Rules

- **All HTTP** calls live in feature services, never in components
- Use `HttpClient` directly — no wrapper classes
- Use **global interceptors** for cross-cutting concerns

### Standard Feature Service

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Order } from './orders.model';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/orders';

  getAll() {
    return this.http.get<Order[]>(this.baseUrl);
  }

  getById(id: string) {
    return this.http.get<Order>(`${this.baseUrl}/${id}`);
  }

  create(order: Partial<Order>) {
    return this.http.post<Order>(this.baseUrl, order);
  }

  update(id: string, order: Partial<Order>) {
    return this.http.put<Order>(`${this.baseUrl}/${id}`, order);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
```

### Required Interceptors

| Interceptor | Purpose |
|---|---|
| `auth.interceptor.ts` | Attach JWT Bearer token to requests |
| `error.interceptor.ts` | Global error handling, toast notifications, 401 redirect |
| `correlation-id.interceptor.ts` | Add `X-Correlation-Id` header for request tracing |

---

## 6. Routing

- **Lazy loading** using `loadComponent()` — never `loadChildren()` with NgModules
- **Route-level providers** for feature-scoped services
- **Guards** for authentication and authorization
- Each feature owns its own routing file

### Example — App Routes

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const APP_ROUTES: Routes = [
  {
    path: 'orders',
    loadComponent: () => import('./features/orders/orders.page').then(m => m.OrdersPageComponent),
    canActivate: [authGuard],
    loadChildren: () => import('./features/orders/orders.routes').then(m => m.ORDERS_ROUTES),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.page').then(m => m.DashboardPageComponent),
    canActivate: [authGuard],
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
```

---

## 7. Forms

- **Reactive Forms only** — never template-driven forms
- Use **typed forms** (`FormGroup<T>`, `FormControl<T>`)
- Form setup lives in the component, not in a service

### Example — Typed Reactive Form

```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'company-order-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './order-form.component.html',
})
export class OrderFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    customerName: this.fb.control('', { validators: [Validators.required] }),
    quantity: this.fb.control<number>(0, { validators: [Validators.required, Validators.min(1)] }),
    notes: this.fb.control(''),
  });

  onSubmit() {
    if (this.form.valid) {
      const values = this.form.getRawValue();
      // submit logic
    }
  }
}
```

---

## 8. Testing

| Type | Tool | Location |
|---|---|---|
| Unit & component tests | **Jest** | Co-located: `*.spec.ts` next to source |
| E2E tests | **Cypress** | `cypress/e2e/` |

### Coverage Target
- **70–80% minimum** coverage
- Focus on: **state, logic, and behaviors**
- **Do NOT** test HTML snapshots or template structure

### What to Test

| Test | Example |
|---|---|
| ✅ Signal/store logic | State transitions, computed values |
| ✅ Service methods | API calls with mocked HttpClient |
| ✅ Guard behavior | Auth/role checks |
| ✅ Form validation | Required fields, custom validators |
| ✅ Component interaction | Inputs, outputs, user events |
| ❌ HTML structure | Snapshot tests of templates |
| ❌ Style details | CSS class presence |

---

## 9. Naming Conventions

### Component Selectors

All selectors must use a **company prefix**:

```
company-[feature]-[name]
```

Examples:
- `company-orders-page`
- `company-order-card`
- `company-button`
- `company-data-table`

### File Naming

```
[name].page.ts          ← page components
[name].component.ts     ← child/shared components
[name].service.ts       ← services
[name].store.ts         ← state stores
[name].guard.ts         ← route guards
[name].interceptor.ts   ← HTTP interceptors
[name].model.ts         ← interfaces/types
[name].pipe.ts          ← pipes
[name].directive.ts     ← directives
[name].spec.ts          ← tests (co-located)
[name].routes.ts        ← routing
```

### General Rules
- Use **kebab-case** for file names
- Use **PascalCase** for class names
- Use **camelCase** for methods and properties

---

## 10. Login Page — Branding & Illustration Standards

Every application's login page **must** follow the Swaraj split-screen layout and domain-theming rules. These are non-negotiable for all projects.

### Asset setup (do this first, before writing any login component)

1. Copy the logo from the shared agent assets into the project's Angular `public/assets/` folder:
   ```
   .agents/assets/Swaraj-Logo.png  →  <project>/public/assets/swaraj-logo.png
   ```
   > **Angular 18 note:** Assets must live under `public/` (not `src/assets/`). The `angular.json` default maps `public/**` → served at root. So `public/assets/swaraj-logo.png` is accessible at `assets/swaraj-logo.png` in the browser.

### Azure App Service IIS Deployment — `public/web.config` (required)

When deploying to Azure App Service (Windows/IIS), `public/web.config` serves two mandatory purposes:

1. **Security headers on static files** — The .NET middleware pipeline only covers API responses. Angular's compiled `.js` and `.css` chunk files are served directly by IIS and bypass the middleware entirely. Without a `web.config`, DAST tools will report X-Content-Type-Options, CSP, Permissions-Policy, and HSTS as missing on those assets (Medium/Informational findings).

2. **Routing isolation** — Rewrite rules must be wrapped in `<location path="." inheritInChildApplications="false">`. Without this, the Angular catch-all rule intercepts requests destined for a co-hosted backend virtual application and returns the Angular 404 page instead.

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <!-- Security headers applied to ALL responses including static JS/CSS chunks -->
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
    </httpProtocol>
  </system.webServer>

  <!-- Routing isolation: prevent Angular rewrite from intercepting backend virtual app routes -->
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <rewrite>
        <rules>
          <rule name="Angular SPA Routes" stopProcessing="true">
            <match url=".*" />
            <conditions logicalGrouping="MatchAll">
              <add input="{REQUEST_FILENAME}" matchType="IsFile"      negate="true" />
              <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            </conditions>
            <action type="Rewrite" url="/index.html" />
          </rule>
        </rules>
      </rewrite>
      <staticContent>
        <mimeMap fileExtension=".json" mimeType="application/json" />
      </staticContent>
    </system.webServer>
  </location>
</configuration>
```

Also ensure `environment.dev.ts` / `environment.prod.ts` `apiUrl` includes the full backend path with virtual directory (e.g. `https://<webapp>.azurewebsites.net/gyro`), not just the root domain.

2. Reference the logo in the login card:
   ```html
   <img src="assets/swaraj-logo.png" alt="Swaraj" class="brand-logo-img" />
   ```
   ```scss
   .brand-logo-img { height: 44px; mix-blend-mode: multiply; }
   ```

3. In the shell header use the white-inverted version:
   ```html
   <img src="assets/swaraj-logo.png" class="header-logo-img" />
   ```
   ```scss
   .header-logo-img { height: 28px; filter: brightness(0) invert(1); }
   ```

### Left panel — domain-themed CSS illustration (MANDATORY)

**Read the application's BRD/design documents first.** The illustration must depict the specific domain and workflow of the application — never a generic placeholder scene.

**Composition rules:**
- Scene canvas: `width: 340px; height: 290px; position: relative`
- Layer 1: `eng-grid` — subtle CSS repeating-linear-gradient (opacity 0.08) for blueprint texture
- Layer 2: 2–3 domain illustration elements (hero + process + inspect), all in pure CSS divs with SCSS — no external images
- Layer 3: identity badge in bottom-right corner (part no., order no., employee ID, etc.)

**Domain → illustration element mapping:**

| Domain | Hero element | Process element | Badge |
|---|---|---|---|
| Engineering / Quality Audit | CSS gear (3 rotated rects + circle) | Audit clipboard with ✓ rows + "APPROVED" stamp | Part no. tag |
| Logistics / Fleet | CSS truck silhouette | Route timeline with waypoints | Trip / consignment ID |
| HR / Payroll | Person + org-chart nodes | Approval flow steps | Employee ID |
| Finance | Bar chart bars | Invoice/ledger rows | GL account |
| Production | Conveyor + assembly arm | Production order card | Work order no. |
| Inventory | Shelf/bin shapes | Stock level bars | SKU tag |

**CSS style rules for illustration elements:**
- Fills: `rgba(255,255,255,0.15–0.55)` (frosted glass on green gradient)
- Borders/outlines: `rgba(255,255,255,0.4–0.75)`
- Solid fills (e.g. clipboard header): `var(--color-primary)` (#009B42)
- Gear cog technique:
  ```scss
  .cog-r { width:100%; height:24%; background:rgba(255,255,255,0.28); border-radius:5px; }
  .r1 { transform:rotate(0deg); } .r2 { transform:rotate(60deg); } .r3 { transform:rotate(120deg); }
  .cog-body { width:72%; height:72%; border-radius:50%; background:rgba(255,255,255,0.22); }
  .cog-hole { width:26%; height:26%; border-radius:50%; background:linear-gradient(160deg,#7dd4a0,#3aad6a); }
  ```

**Tagline** (below illustration, white bold text): use the application's exact function name — e.g. `"Engineering Specification & Audit Portal"`, not a generic phrase.

### Demo accounts section (MANDATORY for all apps)

Below the login button, always add a **Demo Accounts** section with one-click login cards for every user persona defined in the BRD. Each card shows: icon, role label, role description, and credentials (username / password).

```typescript
readonly demoUsers = [
  { label: 'Admin',     username: 'admin',     password: 'Admin@1234',    role: 'Full access',         icon: '🛡️' },
  { label: 'Inspector', username: 'inspector', password: 'Inspect@1234',  role: 'Create & review plans', icon: '🔍' },
  { label: 'Supplier',  username: 'supplier',  password: 'Supplier@1234', role: 'View assigned plans',  icon: '🏭' },
];
loginAs(user: typeof this.demoUsers[0]) {
  this.loginForm.setValue({ username: user.username, password: user.password });
  this.onSubmit();
}
```

> Adjust personas and seed credentials to match the BRD for each application.
- Use **UPPER_SNAKE_CASE** for constants
