---
name: Mahindra UI/UX Design System — Core Tokens & Layout
description: Core design tokens for Mahindra-branded applications — color palette, typography, CSS custom properties, spacing scale, responsive breakpoints, and branding assets. Load this file whenever starting Design or Development for a Mahindra-branded app. Load mahindra-theme-components.md when implementing specific UI components (header, sidebar, forms, login page, states).
---

# UI/UX Design System — Mahindra Corporate Theme (Core)

When designing interfaces, writing Angular components/SCSS, or evaluating UX for **Mahindra-branded applications**, follow these standards precisely. The Mahindra theme is modern, authoritative, and precise — red is used purposefully, not everywhere.

> **Choosing between themes:** Use this skill for apps under the **Mahindra** brand. Use `swaraj-theme-skill.md` for **Swaraj**-branded apps.

---

## 0. Branding Assets

```
.agents/assets/
├── mahindra-rise-logo.png    ← Mahindra Rise wordmark (for light backgrounds)
└── mahindra-brd.css          ← CSS for BRD document generation
```

### Logo usage rules

1. Copy `mahindra-rise-logo.png` into `src/assets/mahindra-rise-logo.png` before referencing it.
2. Reference as: `<img src="assets/mahindra-rise-logo.png" alt="Mahindra Rise" />`
3. On **red header background**: `filter: brightness(0) invert(1)` — renders white.
4. On **white/light backgrounds** (login card, splash): use as-is — no filter.

---

## 1. Color Palette

> **Color space**: Specify all new custom properties in **OKLCH** (`oklch(L% C H)`). OKLCH is perceptually uniform — equal lightness steps look equal. Hex values are retained below as reference for legacy compatibility.

| Role | OKLCH | Hex | Usage |
|---|---|---|---|
| **Mahindra Red** | `oklch(40.5% 0.207 22)` | `#C41230` | Header background, primary buttons, active indicators, key accents |
| **Near-Black** | `oklch(15.5% 0.005 250)` | `#1A1A1A` | Primary text, icon fills, dark overlays |
| **App Background** | `oklch(98.5% 0.002 250)` | `#FAFAFA` | Global page background outside cards |
| **Surface / Card** | `oklch(99% 0.003 80)` | `#FDFDFB` | Cards, panels, form containers (warm near-white, not pure `#FFFFFF`) |
| **Border** | `oklch(93% 0.003 250)` | `#EBEBEB` | Card edges, input borders, dividers |
| **Text Primary** | `oklch(15.5% 0.005 250)` | `#1A1A1A` | Headings, table data, labels |
| **Text Secondary** | `oklch(52% 0.008 250)` | `#6B7280` | Captions, metadata, placeholder hints (min 14px for AA compliance) |
| **Red Tint** | `color-mix(in oklch, oklch(40.5% 0.207 22) 10%, white)` | `rgba(196,18,48,0.10)` | Active sidebar background, hover states |
| **Destructive** | `oklch(33% 0.18 22)` | `#991B1B` | Delete buttons, permanent-action alerts — **structurally distinct from Primary** (see Buttons) |

### Status / Analytics Colors

Keep muted and professional — avoid loud saturated hues.

| Status | OKLCH | Hex |
|---|---|---|
| Success / Approved | `oklch(45% 0.12 155)` | `#2E7D52` |
| In Progress / Pending | `oklch(38% 0.14 240)` | `#1565C0` |
| Warning / Review | `oklch(48% 0.12 55)` | `#B45309` |
| Critical / Overdue | `oklch(40.5% 0.207 22)` | `#C41230` |
| Neutral / Draft | `oklch(52% 0.008 250)` | `#6B7280` |

---

## 2. Typography

### New Applications — Aspirational Stack

Mahindra brand voice: **authoritative · precise · engineered**. These fonts reflect that without defaulting to the Inter/DM Sans monoculture.

- **Display / Headings:** `Exo 2` — geometric sans-serif with a technical, manufactured quality that maps to Mahindra's industrial DNA. Narrow proportions suit data-dense enterprise UIs.
- **Body / UI text:** `Mulish` — clean humanist sans, highly legible at small sizes, less ubiquitous than Inter.
- **Google Fonts import:**
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700&family=Mulish:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  ```
- **CSS custom property stack:**
  ```css
  --font-display: 'Exo 2', 'Barlow', sans-serif;
  --font-body:    'Mulish', 'Karla', sans-serif;
  ```

### Existing Applications — Legacy Stack

Apps already deployed with the following stack should not be migrated mid-project. New projects should use the aspirational stack above.

- **Legacy font:** `Plus Jakarta Sans` / `DM Sans` / `Inter` fallback
- **Legacy import:** `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap`

### Type Scale

Apply `--font-display` for H1–H3, `--font-body` for everything else.

| Element | Font | Weight | Size | Color |
|---|---|---|---|---|
| Page title (H1) | display | 700 | `28px` | `#1A1A1A` |
| Section heading (H2) | display | 600 | `22px` | `#1A1A1A` |
| Sub-heading (H3) | display | 600 | `17px` | `#1A1A1A` |
| Body / table data | body | 400 | `14px` | `#1A1A1A` |
| Label / caption | body | 400 | `12px` | `#6B7280` (min 14px for inline body use) |
| Button text | display | 600 | `13px` | `#FFFFFF` |
| Nav link | display | 500 | `14px` | `#FFFFFF` (on red header) |

> **H3 → body gap**: H3 is 17px to create a minimum 1.2× ratio between heading and body.

---

## 3. Layout & Design Tokens

### CSS Custom Properties

Define these at `:root` in your global stylesheet. Use token names, not raw values, in components.

```css
:root {
  /* Colors */
  --color-primary:      oklch(40.5% 0.207 22);
  --color-primary-dark: oklch(33.5% 0.19 22);
  --color-destructive:  oklch(33% 0.18 22);
  --color-surface:      oklch(99% 0.003 80);
  --color-bg:           oklch(98.5% 0.002 250);
  --color-border:       oklch(93% 0.003 250);
  --color-text:         oklch(15.5% 0.005 250);
  --color-text-muted:   oklch(52% 0.008 250);
  --color-tint:         color-mix(in oklch, var(--color-primary) 10%, white);

  /* Typography */
  --font-display: 'Exo 2', 'Barlow', sans-serif;
  --font-body:    'Mulish', 'Karla', sans-serif;

  /* Spacing — 4pt scale */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-12: 48px;
  --space-16: 64px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;

  /* Motion */
  --duration-micro:    150ms;
  --duration-standard: 220ms;
  --duration-page:     300ms;
  --ease-out: cubic-bezier(0.25, 0, 0, 1);
}
```

### Surfacing Rules

- **Global background:** `var(--color-bg)` (`#FAFAFA`).
- **Content area padding:** `var(--space-6)` on all sides.
- **Max content width:** `1280px`, centered.
- **Card grid gap:** `var(--space-4)`.
- **Section spacing:** `var(--space-8)` between major sections.

---

## 4. Responsive Breakpoints

| Breakpoint | Width | Behaviour |
|---|---|---|
| **Mobile** | `< 768px` | Single column. Sidebar hidden (drawer pattern or bottom nav). Login left panel hidden. |
| **Tablet** | `768px – 1024px` | Sidebar collapses to 60px icon-only (with tooltips). Content area stretches. |
| **Desktop** | `≥ 1024px` | Sidebar 240px expanded. Standard layout. |
| **Wide** | `≥ 1440px` | Content max-width `1280px`, centered. Sidebar remains 240px. |

### Mobile sidebar pattern

On mobile (`< 768px`), the sidebar becomes an off-canvas drawer triggered by a hamburger button in the header's right cluster:

```scss
@media (max-width: 767px) {
  .app-sidebar {
    position: fixed;
    left: 0; top: 56px; bottom: 0;
    transform: translateX(-100%);
    transition: transform var(--duration-standard) var(--ease-out);
    z-index: 200;

    &.open { transform: translateX(0); }
  }

  .sidebar-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 199;
    opacity: 0;
    transition: opacity var(--duration-standard) var(--ease-out);
    &.visible { opacity: 1; }
  }
}
```

### Content grid

Use container queries for card grids so they reflow based on available space, not viewport width:

```scss
.card-grid {
  container-type: inline-size;
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}
```

---

## 5. Key Differences from Swaraj Theme

| Element | Swaraj | Mahindra |
|---|---|---|
| Primary color | Green `#009B42` | Red `#C41230` |
| Destructive color | Red `#E74C3C` (separate) | Darker red `#991B1B` (outlined, structurally distinct) |
| Header bg | Solid Swaraj Green | Solid Mahindra Red |
| Header nav | Below header (separate bar) | Inline in the header bar |
| Active nav indicator | Green bottom border on white bar | **White** bottom border on red header |
| Button shape | Pill (`border-radius: 50px`) for login | Rectangular (`border-radius: 6px`) always |
| Form inputs | White bg, grey border, no floating label | Filled grey bg, floating label |
| Login left panel | Green gradient + domain CSS illustration | Dark near-black + geometric angular CSS shapes |
| Login right panel | White card on grey bg | Near-white panel, no card wrapper |
| Typography (new apps) | `Inter` / `Roboto` | `Exo 2` (headings) / `Mulish` (body) |
| Table header | Light grey bg, dark text | **Near-black** bg (`#1A1A1A`), white text |
| Sidebar active | Green text + bg tint | Red text + bg tint (no left border stripe) |
| Diagonal accent | Not used | Signature motif — always below header and in login |
| Color space | Hex / rgba | OKLCH (with hex fallback) |
| States | Not specified | Empty, loading, success, undo-toast, error — all defined |
| Accessibility | Not specified | WCAG 2.1 AA target, focus rings, ARIA rules |
| Motion | Not specified | Duration scale, easing curves, reduced-motion |
| Responsive | Login hide at 768px only | Full breakpoint system — 4 tiers |
| Icons | Not specified | Heroicons, sizing scale, outline/solid rules |
| Modal / Dialog | Not specified | Defined — focus trap, ARIA, close behavior |
| Tooltip / Popover | Not specified | Defined — CSS tooltip + CDK overlay popover |
| In-app help | Not specified | Field ⓘ + section ? patterns defined |
