---
name: Mahindra–Swaraj Hybrid UI/UX Design System
description: A hybrid theme that takes the warm, expressive Swaraj layout structure (split login with domain CSS illustration, separate nav bar, pill login buttons, white border inputs) and applies Mahindra brand colors (red primary, near-black dark). Use when you want Mahindra branding but a friendlier, more expressive feel than the strict Mahindra corporate theme.
---

# UI/UX Design System — Mahindra × Swaraj Hybrid Theme

This theme inherits the **structural warmth and personality of the Swaraj design system** but replaces every green with Mahindra Red. The result is a Mahindra-branded application that feels expressive and human — compared to the more minimal, corporate Mahindra theme.

> **When to choose this theme:**
> - App is Mahindra-branded but not a dry enterprise tool — it has users who log in daily and benefit from a friendlier feel.
> - You want domain storytelling on the login page (CSS illustration) rather than abstract geometry.
> - Compare with the other two skills before deciding:
>   - `swaraj-theme-skill.md` — Swaraj brand, green palette.
>   - `mahindra-theme-core.md` + `mahindra-theme-components.md` — Mahindra brand, modern/minimal, inline nav, geometric login.
>   - **This file** — Mahindra brand, Swaraj warmth, expressive login illustration.

---

## 0. Branding Assets

```
.agents/assets/
├── mahindra-rise-logo.png    ← Mahindra Rise wordmark
└── mahindra-brd.css          ← CSS for BRD document generation
```

### Logo usage rules

1. Copy `mahindra-rise-logo.png` into `src/assets/mahindra-rise-logo.png`.
2. Reference as: `<img src="assets/mahindra-rise-logo.png" alt="Mahindra Rise" />`
3. **On red header background:** `filter: brightness(0) invert(1)` → renders white.
4. **On white/light backgrounds (login card):** use as-is — no filter.

---

## 1. Color Palette

Direct swap: every Swaraj Green → Mahindra Red. Everything else follows the same structural roles.

| Role | Hex | Usage |
|---|---|---|
| **Primary Brand** | `#C41230` | Header background, primary buttons, active tab indicators, stepper lines, success-adjacent icons |
| **App Background** | `#F4F5F7` | Global page background outside cards |
| **Surface / Card** | `#FFFFFF` | Data tables, forms, charts |
| **Text (Dark)** | `#1A1A1A` | Headings, table data, form labels |
| **Text (Light)** | `#FFFFFF` | Text on red headers or colored metric blocks |
| **Destructive / Clear** | `#C41230` | "Clear Search", delete buttons, critical alerts (same red — label/icon distinguishes intent) |
| **Border / Divider** | `#E5E7EB` | Table row dividers, card borders, input borders |
| **Red Tint** | `rgba(196,18,48, 0.07)` | Hover states, active sidebar item background |

### Analytics & Status Colors

| Status | Color | Hex |
|---|---|---|
| Complete / Inside / Done | Green | `#27AE60` |
| Pending / In Progress | Blue | `#2980B9` |
| Warning / Review | Amber | `#E67E22` |
| Critical / Overdue | Red | `#C41230` |
| Neutral / Draft | Grey | `#95A5A6` |

---

## 2. Typography

Matches Swaraj's clean and modern approach — same font stack.

- **Font Family:** `Inter` (preferred), `Roboto`, or `Montserrat`.
- **Headings (H1/H2):** Bold (600–700), `#1A1A1A`.
- **Form Labels & Table Text:** Regular (400), highly legible.
- **Button Text:** Medium/Bold (500–600).

---

## 3. UI Component Styling

### Buttons

1. **Authentication / Hero Buttons (Login):**
   - Pill shape: `border-radius: 50px`.
   - Full-width in form context.
   - Solid Mahindra Red fill, white text, bold 600.

2. **Application Action Buttons (Search, Save, Clear):**
   - Rectangular with soft corners: `border-radius: 4px–6px`.
   - Leading icon (🔍 Search, 💾 Save, ✖ Clear).
   - Search / Save: Mahindra Red. Clear / Delete: Mahindra Red (same color — icon and label clarify).

### Forms and Inputs

- **Input Fields:** White background, `1.5px solid #E5E7EB` border, `border-radius: 8px`, `padding: 12px 16px`.
- **Focus state:** Border switches to Mahindra Red (`#C41230`).
- **Placeholders:** Include `*` suffix for required fields (e.g., `Username *`).
- **Error messages:** Small red text (`12px`, `#C41230`) below the field.

### Data Tables

- **Header Row:** Light grey background (`#F9FAFB`). Bold, uppercase, `12px`, letter-spaced, dark text.
- **Data Rows:** White background, `1px solid #E5E7EB` horizontal dividers.
- **Hover:** Light grey row highlight (`#F9FAFB`).

### Cards

```scss
.card {
  background: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.05);
  padding: 20px 24px;
}
```

- **Highlighted / metric cards:** `border-top: 3px solid #C41230` optional accent.

### Steppers & Process Trackers

- Horizontal stepper, circular icons connected by lines.
- Active / complete steps: Mahindra Red (`#C41230`).
- Pending: `#E5E7EB`.

### Tabs

- Active tab: `color: #C41230`, `border-bottom: 2px solid #C41230`.
- Inactive: `color: #6B7280`.

---

## 4. Layout & Structure

### Navigation Hierarchy

1. **Top Header (`56px`):** Solid Mahindra Red background.
   - **Left:** Logo (`filter: brightness(0) invert(1)` → white) + app name + division subtitle in white.
   - **Right:** Welcome text + role badge + Sign Out button (white text, outlined).

2. **Main Navigation Bar:** White background immediately below the header, `1px solid #E5E7EB` bottom border.
   - Icon + label tabs. Active tab: Mahindra Red text + `3px solid #C41230` bottom border.
   - Inactive: `#6B7280`. Hover: `#1A1A1A`.

3. **Filter / Action Bar:** Sits above data tables — search inputs, date pickers, primary action buttons.

### Sidebar (where applicable)

- White background, `border-right: 1px solid #E5E7EB`.
- Active item: `border-left: 3px solid #C41230`, background `rgba(196,18,48,0.07)`, icon and label `#C41230`.
- Inactive icon: `#6B7280`. Hover: background `rgba(196,18,48,0.04)`, icon `#C41230`.

### Surfacing

- Global background: `#F4F5F7`.
- Cards: white, `border-radius: 8px`, `box-shadow: 0 4px 12px rgba(0,0,0,0.05)`.

---

## 5. Login Page Layout

Same split-screen structure as Swaraj — left panel with domain CSS illustration, right panel with the login form.

### Structure

```
┌─────────────────────────────┬──────────────────────────┐
│                             │                          │
│   LEFT PANEL (flex: 1.1)   │   RIGHT PANEL (flex: 0.9)│
│   Dark-red gradient bg      │   #F4F5F7 background     │
│                             │                          │
│   • "MAHINDRA & MAHINDRA    │   White card (rounded)   │
│      LTD" white banner      │   ┌────────────────────┐ │
│                             │   │ Mahindra Rise logo  │ │
│   • Domain CSS illustration │   │ (as-is on white)   │ │
│     (3-layer technique —    │   │                    │ │
│      see section 5a)        │   │ Login              │ │
│                             │   │ Please enter your  │ │
│   • Tagline text (white)    │   │ details            │ │
│                             │   │                    │ │
│                             │   │ ── SSO VARIANT ──  │ │
│                             │   │ [○ M&M  ○ Non-M&M] │ │
│                             │   │ [   LOGIN   ]      │ │
│                             │   │                    │ │
│                             │   │ ── U/P VARIANT ──  │ │
│                             │   │ [Username *      ] │ │
│                             │   │ [Password *      ] │ │
│                             │   │ [   Login        ] │ │
│                             │   │  (red pill button) │ │
│                             │   └────────────────────┘ │
│                             │   Copyright footer       │
└─────────────────────────────┴──────────────────────────┘
```

### Rules

- **Left panel gradient:** `linear-gradient(160deg, #4a0a18, #8b1a2e, #C41230)` — deep crimson to Mahindra Red (mirrors Swaraj's light-to-dark green direction).
- **Right panel background:** `#F4F5F7`.
- **Form card:** White, `border-radius: 16px`, `box-shadow: 0 4px 24px rgba(0,0,0,0.08)`, padding `40px 44px`.
- **Logo:** Above the "Login" heading, `height: 36px`. Use as-is on white — no filter.
- **Login button:** Full-width pill (`border-radius: 50px`), Mahindra Red, white bold text.
- **SSO variant:** Entity radio-button group → single LOGIN button. No credentials.
- **U/P variant:** Two white-background inputs with `*` placeholders → pill LOGIN button. Optional "Forgot password?" red text link.
- **Copyright:** `Copyright ©[year] Mahindra & Mahindra Ltd, All Rights Reserved`. `11px`, `#6B7280`, bottom of right panel.
- **Mobile:** Left panel hides at `max-width: 768px`.

---

### 5a. Left Panel — Domain-Themed CSS Illustration (MANDATORY)

**Same 3-layer technique as the Swaraj theme — but rendered on a dark-red gradient instead of a green one.**

The illustration must reflect the specific domain of the application. Read BRD/design docs first.

#### Domain → Element mapping

| Application Domain | Hero Element | Process Element | Identity Tag |
|---|---|---|---|
| **Engineering / Quality Audit** | Interlocked gears (CSS cogs) | Audit checklist clipboard with ✓ rows + "APPROVED" stamp | Part number badge |
| **Logistics / Fleet / Dispatch** | Truck silhouette | Route timeline with waypoint dots | Trip ID tag |
| **Supply Chain / Procurement** | Warehouse building | Purchase order card | PO number tag |
| **HR / Payroll** | Person silhouette + org chart | Approval workflow steps | Employee ID tag |
| **Finance / Accounts** | Bar chart / trend line | Invoice or ledger rows | GL account tag |
| **Production / Manufacturing** | Conveyor belt + assembly arm | Production order with completion % | Work order tag |
| **Sales / CRM** | Handshake / deal funnel | Pipeline stages with status dots | Deal / quote ID tag |
| **Inventory / WMS** | Shelves / bins | Stock level bars | SKU tag |
| **Compliance / Audit** | Magnifying glass over document | Checklist with pass/fail indicators | Audit ref tag |
| **IoT / Telematics** | Sensor / antenna | Live signal waveform | Device ID tag |
| **ESOP / Finance / Stock** | Rising bar chart + upward arrow | Grant table with date rows | Option grant ID tag |
| **Learning / Training** | Open book / graduation cap | Course progress modules | Certificate ID tag |

#### Required illustration structure (always 3 layers)

```
Layer 1 — Background texture
  └── CSS repeating-linear-gradient grid (subtle dots/lines, opacity 0.08)

Layer 2 — Domain illustration (2–3 CSS elements)
  ├── HERO element    — largest, represents the industry
  ├── PROCESS element — medium, represents the core workflow
  └── INSPECT element — floating, represents review/verification

Layer 3 — Identity badge
  └── Small tag in bottom-right — a representative ID from the domain
```

#### CSS technique rules

- **All elements are pure CSS** — `div` + SCSS only. No external images for the illustration.
- Use **`rgba(255,255,255, 0.15–0.55)`** fills for frosted-glass appearance on the dark-red gradient.
- Use **`rgba(255,255,255, 0.4–0.75)`** for borders and outlines.
- Clipboard/card header stripe: `#C41230` (Mahindra Red) — same technique as Swaraj but red instead of green.
- Gear cog-hole gradient: `linear-gradient(160deg, #4a0a18, #C41230)` — matches the left panel gradient.
- **Scene canvas:** `width: 340px; height: 290px; position: relative`.
- **Tagline below illustration:** White, bold — names the application's exact function.

#### Gear / cog SCSS (adapted for red gradient)

```scss
.cog-r { width: 100%; height: 24%; background: rgba(255,255,255,0.28); border-radius: 5px; }
.r1 { transform: rotate(0deg); }
.r2 { transform: rotate(60deg); }
.r3 { transform: rotate(120deg); }
.cog-body { width: 72%; height: 72%; border-radius: 50%; background: rgba(255,255,255,0.22); }
.cog-hole  { width: 26%; height: 26%; border-radius: 50%; background: linear-gradient(160deg, #4a0a18, #C41230); }
```

---

## 6. Comparison Across All Three Themes

| Element | Swaraj | Mahindra (Corporate) | **This theme (Hybrid)** |
|---|---|---|---|
| Brand color | Green `#009B42` | Red `#C41230` | Red `#C41230` |
| Header | Solid green, separate white nav bar below | Solid red, **nav inline** in header | Solid red, **separate white nav bar** below |
| Active nav indicator | Green underline on white bar | White underline on red header | **Red underline on white bar** |
| Login left panel | Green gradient + domain illustration | Dark near-black + geometric shapes | **Dark-red gradient + domain illustration** |
| Login button | Pill, green | Rectangular, red | **Pill, red** |
| Form inputs | White bg, grey border | Floating label, filled grey bg | **White bg, grey border** |
| Diagonal slash motif | No | Yes — signature element | No |
| Feel | Warm, agricultural, expressive | Corporate, minimal, modern | **Mahindra brand + Swaraj warmth** |
