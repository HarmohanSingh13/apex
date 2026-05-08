---
name: Mahindra UI/UX Design System — Components & Patterns
description: Component styling rules for Mahindra-branded applications — header, sidebar, buttons, forms, tables, cards, tabs, badges, icons, modals, tooltips, help patterns, login page, component states (empty/loading/success/error), accessibility, and motion. Load this file when implementing specific UI components. Load mahindra-theme-core.md first for base tokens and colors.
---

# UI/UX Design System — Mahindra Corporate Theme (Components)

> **Prerequisite:** `mahindra-theme-core.md` defines the color palette, typography, CSS custom properties, and layout tokens that all components below reference. Ensure those are applied globally first.

---

## 1. Header

The header is the most distinctive Mahindra brand element. **Do not deviate from this structure.**

### Visual structure

```
┌──────────────────────────────────────────────────────────────────┐
│  [Mahindra Rise logo]  Today  Work  Connect  Learn  ...    [🔍][🔔][⊞][avatar] │
│                        ─────                                     │
└──────────────────────────────────────────────────────────────────┘
  ╲ thin diagonal red slash accent line below header ╱
```

### Rules

- **Background:** Solid Mahindra Red (`#C41230`), full width, `56px` tall.
- **Logo:** Left-aligned, `filter: brightness(0) invert(1)` → renders white on red.
- **Navigation links:** Left-aligned after logo. White text (`#FFFFFF`), `font-weight: 500`, `font-size: 14px`.
- **Active nav link:** White text + `2px` solid white underline (`border-bottom: 2px solid #FFFFFF`). No background fill.
- **Inactive nav link:** White text at `opacity: 0.80`. On hover: full `opacity: 1`.
- **Right cluster:** Icon buttons (search, notifications, apps grid, user avatar). All white/light. `gap: 8px`.
- **Diagonal accent stripe:** Immediately below the header — `3px` tall, `#A00E26`, covers the left `40%` of the header width, clipped with a right-angled diagonal. Implemented as a CSS `::after` pseudo-element. This is the signature Mahindra brand motif — always include it.
- **No bottom border** on the header itself — the diagonal accent replaces it.

### SCSS implementation

```scss
.app-header {
  background: #C41230;
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 var(--space-6);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -3px;
    left: 0;
    width: 40%;
    height: 3px;
    background: #A00E26;
    clip-path: polygon(0 0, 100% 0, calc(100% - 20px) 100%, 0 100%);
  }
}

.nav-link {
  color: #fff;
  opacity: 0.8;
  font-weight: 500;
  font-size: 14px;
  padding: 0 var(--space-4);
  height: 56px;
  display: flex;
  align-items: center;
  border-bottom: 2px solid transparent;
  transition: opacity var(--duration-micro) var(--ease-out), border-color var(--duration-micro) var(--ease-out);

  &:hover { opacity: 1; }
  &.active {
    opacity: 1;
    border-bottom-color: #ffffff;
  }
}
```

---

## 2. Sidebar Navigation (where applicable)

Some apps use a left sidebar instead of top navigation.

- **Background:** White (`#FDFDFB`), `border-right: 1px solid #EBEBEB`.
- **Width:** `240px` expanded, `60px` collapsed (icon-only). Always provide tooltips on collapsed icon items.
- **Nav item:** Icon + label, `padding: 10px 16px`, `border-radius: 6px`.
- **Inactive:** Icon `#6B7280`, label `#1A1A1A`.
- **Hover:** Background `rgba(196,18,48, 0.05)`, icon turns `#C41230`.
- **Active:** Background `rgba(196,18,48, 0.10)`, icon and label both `#C41230`, `font-weight: 600`. No left border stripe — the background fill and color change are sufficient indicators.
- **Collapsed tooltip:** `position: fixed`, `left: 68px`, `background: #1A1A1A`, `color: #FFFFFF`, `font-size: 12px`, `padding: 4px 10px`, `border-radius: 4px`, appears on hover with `150ms` delay.
- **Version tag** (bottom of sidebar): `font-size: 11px`, color `#6B7280`.

---

## 3. UI Component Styling

### Buttons

| Variant | Style |
|---|---|
| **Primary** | `background: #C41230`, white text, `border-radius: 6px`, `padding: 9px 20px`, `font-weight: 600`, `font-size: 13px`. Hover: `#A00E26`. |
| **Ghost / Outline** | `border: 1.5px solid #C41230`, transparent bg, red text. Hover: fill red, white text. |
| **Text / Link** | No border, no bg. Red text, uppercase, `font-size: 12px`, `letter-spacing: 0.5px`. Used for actions like "DOWNLOAD SUMMARY", "VIEW MORE". |
| **Destructive** | `border: 1.5px solid #991B1B`, transparent bg, `color: #991B1B` (outline style, not filled). **Must include a warning icon** (trash / alert triangle). For permanent/irreversible actions, show a confirmation dialog before executing. Hover: fill `#991B1B`, white text. |
| **Disabled** | `opacity: 0.4`, `cursor: not-allowed`, `pointer-events: none`. Applied to all variants. |

> **Primary ≠ Destructive**: These are structurally distinct — filled red for primary actions, outlined darker-red for destructive ones. Never use a filled red button for delete/remove actions.

**Never use pill-shaped buttons** (`border-radius: 50px`) in the Mahindra theme. That belongs to Swaraj.

### Forms & Inputs

Use **floating label** style throughout:

```scss
.form-field {
  position: relative;

  input {
    width: 100%;
    padding: 20px 14px 8px;
    background: #F8F8F8;
    border: 1px solid #EBEBEB;
    border-radius: 6px;
    font-size: 14px;
    color: #1A1A1A;
    transition: border-color var(--duration-micro) var(--ease-out);

    &:focus {
      outline: none;
      border-color: #C41230;
      background: #FDFDFB;
      box-shadow: 0 0 0 3px rgba(196, 18, 48, 0.15);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  label {
    position: absolute;
    top: 14px;
    left: 14px;
    font-size: 14px;
    color: #6B7280;
    pointer-events: none;
    transition: top var(--duration-micro) var(--ease-out),
                font-size var(--duration-micro) var(--ease-out),
                color var(--duration-micro) var(--ease-out);
  }

  input:focus ~ label,
  input:not(:placeholder-shown) ~ label {
    top: 6px;
    font-size: 10px;
    color: #C41230;
    font-weight: 500;
  }

  &.has-error input {
    border-color: #C41230;
  }
  .error-msg {
    margin-top: 4px;
    font-size: 12px;
    color: #C41230;
  }
}
```

- No `*` suffix on placeholders — use floating label as the required indicator, or a small red dot beside the label.
- **Validation timing:** Validate on blur (not on keystroke). Show error messages only after the user has left the field or attempted to submit.

### Data Tables

- **Header row:** `background: #1A1A1A`, white text, `font-size: 12px`, uppercase, `letter-spacing: 0.5px`, bold.
- **Data rows:** `background: #FDFDFB`, `1px solid #EBEBEB` bottom border.
- **Hover row:** `background: rgba(196,18,48, 0.04)`.
- **Alternating rows:** Avoid — use hover state instead for a cleaner look.
- **Action icons in rows:** `#6B7280`, turns `#C41230` on hover.
- **Empty table state:** See Component States section below.

### Cards

```scss
.card {
  background: #FDFDFB;
  border-radius: 8px;
  border: 1px solid #EBEBEB;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  padding: var(--space-5) var(--space-6);
}
```

- For **metric / KPI cards**: large bold number in `#1A1A1A`, small label in `#6B7280` above, currency/unit in `#6B7280` below.
- For **highlighted cards**: `border-top: 3px solid #C41230` — draws the eye without being loud.

### Tabs

- Container: `border-bottom: 1px solid #EBEBEB`.
- Tab item: `padding: 12px 20px`, `font-size: 14px`, `font-weight: 500`.
- Inactive: `color: #6B7280`, no underline.
- Active: `color: #C41230`, `border-bottom: 2px solid #C41230`.
- Hover: `color: #1A1A1A`.

### Badges & Status Pills

- `border-radius: 4px` (not fully rounded — corporate feel).
- `padding: 2px 8px`, `font-size: 11px`, `font-weight: 600`.
- Use muted background tints from the status palette (e.g., `rgba(46,125,82,0.12)` background with `#2E7D52` text for Success).

### Icons

**Library:** [Heroicons](https://heroicons.com/) (MIT license, available as Angular SVG components via `@ng-icons/heroicons` or inlined SVG).

**Sizing:**

| Context | Size | Weight |
|---|---|---|
| Navigation (sidebar, header) | `20px` | outline |
| Action buttons (primary, ghost) | `16px` | outline |
| Table row actions | `16px` | outline |
| Status icons (success, error, warning) | `16px` | solid |
| Empty state illustration | `48px` | outline |
| Page-level error | `64px` | outline |

**Rules:**
- Always pair icons with a visible text label except in collapsed sidebar (60px mode) and table row icon-only actions — both of which require `aria-label` and a tooltip.
- Use `outline` variant for interactive icons, `solid` for static status/state indicators.
- Color: `currentColor` by default. Apply `color: #C41230` for active/brand states, `color: #6B7280` for inactive.
- Never scale icons outside the defined sizes.

### Modal / Dialog

Use for: irreversible destructive confirmations, complex multi-step forms, and information that requires a decision before the user can continue. **Do not use modals for success states, simple messages, or information that could live inline.**

```scss
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 300;
  animation: fade-in var(--duration-standard) var(--ease-out);
}

.modal {
  background: #FDFDFB;
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  padding: var(--space-6);
  width: min(480px, calc(100vw - 48px));
  animation: slide-up var(--duration-standard) var(--ease-out);

  &__header {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: var(--space-3);
    font-family: var(--font-display);
    font-size: 18px; font-weight: 600; color: #1A1A1A;
  }

  &__close {
    color: #6B7280; cursor: pointer;
    &:hover { color: #1A1A1A; }
  }

  &__body {
    font-size: 14px; color: #6B7280; line-height: 1.6;
    margin-bottom: var(--space-6);
  }

  &__footer {
    display: flex; justify-content: flex-end; gap: var(--space-3);
  }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

- **Close behavior:** `×` button, `Escape` key, and backdrop click all close non-destructive modals. Destructive confirmation modals close only via explicit button choice — not backdrop click.
- **Focus trap:** On open, focus moves to the modal. Tab cycles only within modal. On close, focus returns to the trigger element.
- **ARIA:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the heading id.

### Tooltip / Popover

**Tooltip** — short, non-interactive label for icon-only buttons and truncated text. Appears on hover/focus, disappears on blur/mouse-leave.

```scss
[data-tooltip] {
  position: relative;

  &::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%; transform: translateX(-50%);
    background: #1A1A1A; color: #FDFDFB;
    font-size: 12px; font-family: var(--font-body);
    padding: 4px 10px; border-radius: var(--radius-sm);
    white-space: nowrap; pointer-events: none;
    opacity: 0;
    transition: opacity var(--duration-micro) var(--ease-out);
  }

  &:hover::after,
  &:focus-visible::after { opacity: 1; }
}
```

- Max tooltip width: `240px`. Position: prefer `top`, fall back to `bottom` or `right` near viewport edge.
- ARIA: add `aria-describedby` pointing to a hidden `<span>` for screen readers.
- **Popover** (richer content, interactive): Use Angular CDK `Overlay`. White surface, `border-radius: 8px`, `box-shadow: 0 4px 16px rgba(0,0,0,0.12)`, max-width `320px`. Close on outside click or `Escape`.

### In-App Help Patterns

- **Field-level help:** A small `ⓘ` icon (Heroicons `information-circle`, 14px, `#6B7280`) placed inline after a form label. On click/hover, shows a tooltip or popover with 1–2 sentences.
- **Section-level help:** A "?" icon button in the top-right corner of a card or panel header. Opens a popover with guidance text and optionally a "Learn more" link.
- **No decorative help text:** Do not add paragraphs of explanatory text to a form by default. Reveal complexity only on demand via the ⓘ / ? patterns above.

---

## 4. Login Page

The login page uses a **horizontal split** layout. Both panels are flexible.

### Structure

```
┌─────────────────────────────┬──────────────────────────┐
│                             │                          │
│   LEFT PANEL (flex: 1.2)   │   RIGHT PANEL (flex: 0.8)│
│   Dark geometric CSS art    │   #FDFDFB background     │
│                             │                          │
│   • Abstract angular        │   ┌────────────────────┐ │
│     shapes in near-black    │   │ Mahindra Rise logo  │ │
│     and muted red           │   │ (as-is on white)   │ │
│                             │   │                    │ │
│   • App name / tagline      │   │ App title          │ │
│     in white (large, bold)  │   │ Short subtitle     │ │
│                             │   │                    │ │
│                             │   │ ── SSO VARIANT ──  │ │
│                             │   │ [Entity selector]  │ │
│                             │   │ [○ M&M  ○ Non-M&M] │ │
│                             │   │ [   LOGIN   ]      │ │
│                             │   │                    │ │
│                             │   │ ── U/P VARIANT ──  │ │
│                             │   │ [Username    ]     │ │
│                             │   │ [Password    ]     │ │
│                             │   │ [   LOGIN   ]      │ │
│                             │   └────────────────────┘ │
│                             │   Copyright footer       │
└─────────────────────────────┴──────────────────────────┘
```

### Rules

- **Left panel background:** `linear-gradient(145deg, #0D0D0D, #1A1A1A)` — near-black, not red. Red appears only as accents within the geometric shapes.
- **Left panel geometric art:** Pure CSS — angular shapes (rectangles, skewed divs, thin lines) in `rgba(196,18,48, 0.3–0.7)` and `rgba(255,255,255, 0.05–0.12)`. Sharp edges, diagonal lines, overlapping rectangles — architectural, not decorative.
- **App name on left panel:** White, `font-size: 36px`, `font-weight: 700`, `font-family: var(--font-display)`. Tagline below in `rgba(255,255,255,0.6)`, `font-size: 14px`.
- **Right panel:** `#FDFDFB`, vertically centered content.
- **Logo:** `mahindra-rise-logo.png`, `height: 36px`, above the form title. No filter on light background.
- **Form content width:** `320px`, centered. No card border — the panel is the surface.
- **Login button:** Full-width, `background: #C41230`, `border-radius: 6px`, `height: 44px`, `font-weight: 600`, `font-size: 14px`, uppercase, white text.
- **SSO variant:** Radio button group → single LOGIN button.
- **U/P variant:** Two floating-label inputs → LOGIN button. Optional "Forgot password?" text link in `#C41230` below.
- **Copyright:** `font-size: 11px`, `color: #6B7280`, bottom of right panel.
- **Mobile:** Left panel hides at `max-width: 768px`. Right panel becomes full screen.

### Left panel — CSS geometric art technique

```scss
.login-left {
  background: linear-gradient(145deg, #0D0D0D, #1A1A1A);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -10%;
    right: -5%;
    width: 60%;
    height: 120%;
    background: rgba(196, 18, 48, 0.18);
    transform: skewX(-12deg);
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 15%;
    left: -5%;
    width: 40%;
    height: 3px;
    background: #C41230;
    transform: skewX(-12deg);
  }
}

.geo-line-1 { position: absolute; top: 20%; left: 10%; width: 120px; height: 2px; background: rgba(255,255,255,0.08); transform: skewX(-12deg); }
.geo-line-2 { position: absolute; top: 24%; left: 10%; width: 60px;  height: 2px; background: rgba(196,18,48,0.5);    transform: skewX(-12deg); }
.geo-block   { position: absolute; bottom: 30%; right: 10%; width: 80px; height: 80px; border: 1.5px solid rgba(196,18,48,0.3); transform: rotate(15deg); }
```

---

## 5. Component States

Every component must implement all four states. Do not leave states unspecified.

### Empty States

When a list, table, or section has no data:

```
[Icon — relevant to the content type, #6B7280, 48px]
[Heading — "No [items] yet", 16px, font-weight 600, #1A1A1A]
[Body — 1–2 sentences explaining what will appear here, 14px, #6B7280]
[CTA button — Primary — only if there is a direct action to create the first item]
```

- Center the content block vertically and horizontally in the container.
- Minimum container height: `240px`.
- Do not use generic "No data found" text — explain what the user can do.

### Loading / Skeleton States

Use skeleton screens (not spinners) for content areas that load data.

```scss
.skeleton {
  background: linear-gradient(
    90deg,
    #EBEBEB 25%,
    #F5F5F5 50%,
    #EBEBEB 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
  border-radius: var(--radius-md);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background: #EBEBEB;
  }
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

- Match skeleton dimensions to the real content they represent.
- Show skeletons immediately on navigation — do not show blank screens.
- For tables: render 5 skeleton rows matching the column structure.

### Success States

- **Toast notification:** Fixed bottom-right, `background: #2E7D52`, white text, `border-radius: 6px`, `padding: 12px 20px`, auto-dismisses after `4000ms`. Include an `×` close button.
- **Undo-toast:** For soft destructive actions that don't require a confirmation dialog. Same dimensions as the success toast but `background: #1A1A1A`. Format: `"[Item] removed — Undo"` with "Undo" as a white underlined text link. Undo window: `5000ms`. If the user clicks Undo within the window, reverse the action and dismiss the toast immediately. If the timer expires, commit the action silently. Use the confirmation dialog only for truly irreversible actions (permanent delete, data overwrite).
- **Inline success:** Green checkmark icon + message below a form field or action.
- **Page-level success:** Replace the form/action area with a success block — icon, heading ("Submitted successfully"), and a next-action link. Do not use a modal for this.

### Error States

- **Form validation:** Red border + 12px message below the field (see Forms section). Validate on blur.
- **API / network error:** Inline error banner at the top of the affected section — `background: rgba(196,18,48,0.08)`, `border-radius: 6px`, warning icon + plain-language message + retry action if applicable.
- **Page-level error (500/404):** Full-page error layout with Mahindra header, centered content block: error code in large display type, plain explanation, primary button to go back or refresh. Never show raw stack traces.

---

## 6. Accessibility

**Target:** WCAG 2.1 Level AA minimum across all Mahindra applications.

### Contrast Requirements

| Context | Minimum ratio | Notes |
|---|---|---|
| Body text (≥14px) | 4.5:1 | `#6B7280` on `#FDFDFB` = 4.5:1 — acceptable, do not go lighter |
| Large text (≥18px bold or ≥24px) | 3:1 | H1–H2 on white background passes easily |
| UI components (borders, icons) | 3:1 | Input borders `#EBEBEB` on `#F8F8F8` — verify in context |
| Captions below 14px | 4.5:1 | Use `#595E6B` instead of `#6B7280` for captions under 12px |

### Focus Rings

All interactive elements must have a visible focus ring for keyboard navigation. Never use `outline: none` without a replacement.

```scss
:focus-visible {
  outline: 2px solid #C41230;
  outline-offset: 2px;
  border-radius: 2px;
}

// On red backgrounds (header, primary buttons)
.app-header :focus-visible,
.btn-primary:focus-visible {
  outline-color: #FFFFFF;
}
```

### ARIA & Semantic HTML

- Use `role="alert"` for toast notifications and error banners so they are announced by screen readers.
- Use `aria-label` on icon-only buttons (collapsed sidebar icons, icon action buttons in table rows).
- Use `aria-current="page"` on the active navigation link.
- Use `aria-busy="true"` on sections displaying skeleton loading state.

### Reduced Motion

```scss
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

---

## 7. Motion & Animation

The Mahindra brand is precise and restrained — motion should feel purposeful, not decorative.

### Duration Scale

| Type | Duration | When to use |
|---|---|---|
| Micro-interaction | `150ms` | Hover states, focus rings, active button press |
| Standard transition | `220ms` | Panel slides, tab switches, dropdown open |
| Page-level | `300ms` | Route transitions, modal entrance/exit |

### Easing

Always use deceleration easing for entrances and acceleration for exits. Never use bounce or elastic easing.

```css
--ease-out:     cubic-bezier(0.25, 0, 0, 1);     /* entrances — ease-out-quart */
--ease-in:      cubic-bezier(0.55, 0, 1, 0.45);  /* exits */
--ease-in-out:  cubic-bezier(0.45, 0, 0.55, 1);  /* in-place state changes */
```

### Rules

- **Animate only `transform` and `opacity`** — never animate `width`, `height`, `padding`, or `margin` directly (causes layout recalculation).
- **Height animations:** Use `grid-template-rows: 0fr` → `1fr` transition instead of animating `height`.
- **Skeleton shimmer** is the only continuous (looping) animation permitted in a loaded state.
- **Stagger entrance animations** by `30ms` per item for list reveals — creates rhythm without feeling slow.

### Reference transitions

```scss
// Sidebar item hover
.nav-item {
  transition: background var(--duration-micro) var(--ease-out),
              color var(--duration-micro) var(--ease-out);
}

// Dropdown/panel open
.panel {
  transition: opacity var(--duration-standard) var(--ease-out),
              transform var(--duration-standard) var(--ease-out);
  &.entering { opacity: 0; transform: translateY(-4px); }
  &.entered  { opacity: 1; transform: translateY(0); }
}

// Toast entrance
.toast {
  transition: transform var(--duration-standard) var(--ease-out),
              opacity var(--duration-standard) var(--ease-out);
  &.entering { transform: translateX(100%); opacity: 0; }
  &.entered  { transform: translateX(0);    opacity: 1; }
}
```
