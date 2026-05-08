---
name: Swaraj UI/UX Design System
description: Corporate UI/UX, styling, and branding guidelines based on the Swaraj StoreTAT application. Covers color palettes, component styling, layout structures, typography, branding assets, and the login page layout.
---

# UI/UX Design System Skill (Swaraj Standard)

When designing interfaces, writing frontend code (HTML/SCSS, Angular components), or evaluating UX, **always follow these design standards**. This ensures a consistent, unified look and feel across all corporate applications.

---

## 0. Shared Branding Assets

All brand assets are stored in the shared agent assets directory:

```
.agents/assets/
├── Swaraj-Logo.png     ← Official Swaraj wordmark (green on black background)
└── mahindra-brd.css    ← CSS for BRD document generation
```

### Rules for using assets in Angular projects

1. **Always copy** `Swaraj-Logo.png` from `.agents/assets/` into the project's `src/assets/` folder as `swaraj-logo.png` before referencing it.
2. Reference in HTML as: `<img src="assets/swaraj-logo.png" alt="Swaraj" />`
3. The logo has a **black background** — apply the following CSS based on context:
   - **On white/light backgrounds (login card):** `mix-blend-mode: multiply` — makes the black transparent.
   - **On green header backgrounds:** `filter: brightness(0) invert(1)` — renders it white.

---

## 1. Color Palette

Use exact or approximate values that match the Swaraj corporate identity.

| Role | Color / Hex | Usage |
|---|---|---|
| **Primary Brand** | Swaraj Green (`#009B42`) | Top header backgrounds, primary action buttons, active tab indicators, stepper progress lines, successful status icons. |
| **App Background** | Light Grey (`#F4F5F7`) | The primary background color encompassing the main application frame outside of cards. |
| **Surface/Card** | Pure White (`#FFFFFF`) | Background for all data tables, forms, and analytical charts. |
| **Text (Dark)** | Dark Charcoal (`#2C3E50`) | Primary headings, table data, and form labels. |
| **Text (Light)** | White (`#FFFFFF`) | Text on top of primary green headers or colored metric blocks. |
| **Destructive/Clear** | Red (`#E74C3C`) | "Clear Search" buttons, >5 HRS alerts, Waiting/Stop status blocks. |

### Analytics & Status Dashboard Colors
- **< 30 Mins / Inside Plant / Done:** Green
- **> 30 Mins / Waiting for GATE-IN:** Blue
- **Waiting for PCS:** Orange / Dark Yellow
- **Reported for the Day:** Yellow / Gold
- **> 5 HRS / Waiting Outside:** Red

---

## 2. Typography

- **Font Family:** `Inter` (preferred), `Roboto`, or `Montserrat` — clean, modern Sans-Serif.
- **Headings (H1/H2):** Bold (600–700 weight), high contrast dark gray (`#2C3E50`).
- **Form Labels & Table Text:** Regular weight (400), highly legible.
- **Button Text:** Medium/Bold weight (500–600).

---

## 3. UI Component Styling

### Buttons
1. **Authentication / Hero Buttons (e.g., Login):**
   - Pill shape: `border-radius: 50px`.
   - Full-width in form context.
   - Solid Swaraj Green fill, white text, bold (600).
2. **Application Action Buttons (e.g., Search, Clear, Save):**
   - Rectangular with soft corners (`border-radius: 4px–6px`).
   - Leading icon (🔍 Search, ✖ Clear, 💾 Save).
   - Search/Save: Swaraj Green. Clear/Delete: Red.

### Forms and Inputs
- **Input Fields:** White background, `1.5px` border in light gray, `border-radius: 8px`, padding `12px 16px`.
- **Focus state:** Border switches to Swaraj Green (`#009B42`).
- **Placeholders:** Include `*` suffix for required fields (e.g., `Username *`).
- **Error messages:** Small red text (`12px`, `#E74C3C`) below the field.

### Data Tables
- **Header Row:** Light grey background (`#F9FAFB`). Bold, uppercase, `12px`, letter-spaced.
- **Data Rows:** White background, subtle horizontal `1px` dividers (`#E5E7EB`).
- **Hover:** Light grey row highlight (`#F9FAFB`).

### Steppers & Process Trackers
- Horizontal stepper with circular icons connected by lines.
- Active/complete steps use Swaraj Green heavily.

---

## 4. Layout & Structure

### Navigation Hierarchy
1. **Top Header (`56px` tall):** Solid Swaraj Green background.
   - **Left:** `<img src="assets/swaraj-logo.png">` with `filter: brightness(0) invert(1)` + app name + division subtitle.
   - **Right:** Welcome text + role badge + Sign Out button.
2. **Main Navigation Bar:** White background below header, `1px` bottom border.
   - Icon + label tabs. Active tab: green text + `3px` green bottom border.
3. **Filter/Action Bar:** Above data tables — search inputs, date pickers, primary action buttons.

### Surfacing Structure
- **Global Background:** `#F4F5F7` (slightly grey).
- **Cards/Containers:** White (`#FFFFFF`), `border-radius: 8px`, `box-shadow: 0px 4px 12px rgba(0,0,0,0.05)`.

---

## 5. Login Page Layout

The login page **must** use a split-screen layout matching the Swaraj StoreTAT reference design.

### Structure
```
┌─────────────────────────────┬──────────────────────────┐
│                             │                          │
│   LEFT PANEL (flex: 1.1)   │   RIGHT PANEL (flex: 0.9)│
│   Green gradient background │   #F4F5F7 background     │
│                             │                          │
│   • "MAHINDRA & MAHINDRA    │   White card (rounded)   │
│      LTD" white banner      │   ┌────────────────────┐ │
│                             │   │ Swaraj Logo img    │ │
│   • Warehouse/truck         │   │ (mix-blend-mode:   │ │
│     illustration            │   │  multiply)         │ │
│                             │   │                    │ │
│   • Tagline text (white)    │   │ Login              │ │
│                             │   │ Please enter your  │ │
│                             │   │ details            │ │
│                             │   │                    │ │
│                             │   │ [Username *      ] │ │
│                             │   │ [Password *      ] │ │
│                             │   │                    │ │
│                             │   │ [   Login        ] │ │
│                             │   │  (green pill btn)  │ │
│                             │   └────────────────────┘ │
│                             │   Copyright footer       │
└─────────────────────────────┴──────────────────────────┘
```

### Rules
- Left panel gradient: `linear-gradient(160deg, #b8f0c8, #7dd4a0, #3aad6a)`.
- Right panel background: `#F4F5F7`.
- Form card: white, `border-radius: 16px`, `box-shadow: 0 4px 24px rgba(0,0,0,0.08)`, padding `40px 44px`.
- **Logo placement:** Above the "Login" heading inside the card. Use `mix-blend-mode: multiply` so black background disappears on white.
- Login button: full-width, `border-radius: 50px`, Swaraj Green.
- **Demo accounts section:** Below the login button — show clickable cards for each user persona (Admin, QualityInspector, Supplier) with one-click auto-login for development/testing environments.
- Copyright line at very bottom: `Copyright ©[year] Mahindra & Mahindra, All Rights Reserved`.
- Hide left panel on mobile (`@media max-width: 768px`).

---

### 5a. Left Panel — Domain-Themed CSS Illustration (MANDATORY)

**The illustration on the left panel MUST reflect the specific domain and purpose of the application being built.** Never use a generic factory/truck/building scene. Before writing a single line of CSS, read the BRD or design documents to understand the application's core domain, then map it to illustration elements using the guide below.

#### How to determine the illustration theme

1. Read the application's BRD/design docs.
2. Identify the **primary domain** (what industry / function does it serve?).
3. Identify the **core workflow** (what does the user actually do in the app?).
4. Identify the **key personas** (who uses it — inspector, supplier, manager, driver, etc.).
5. Compose the illustration from the **element palette** for that domain (see table below).

#### Domain → Element mapping

| Application Domain | Hero Element | Process Element | Identity Tag |
|---|---|---|---|
| **Engineering / Quality Audit** | Interlocked gears (CSS cogs) | Audit checklist clipboard with ✓ rows + "APPROVED" stamp | Part number badge (e.g. `ES-7420`) |
| **Logistics / Fleet / Dispatch** | Truck silhouette (CSS shapes) | Route timeline with waypoint dots | Consignment / Trip ID tag |
| **Supply Chain / Procurement** | Warehouse building | Purchase order / invoice card | PO number tag |
| **HR / Payroll** | Person silhouette + org chart nodes | Approval workflow steps | Employee ID tag |
| **Finance / Accounts** | Bar chart / trend line | Invoice or ledger rows | GL account tag |
| **Production / Manufacturing** | Conveyor belt + assembly arm | Production order card with completion % | Work order tag |
| **Sales / CRM** | Handshake / deal funnel | Pipeline stages with status dots | Deal / quote ID tag |
| **Inventory / WMS** | Shelves / bins | Stock level bars | SKU tag |
| **Compliance / Audit** | Magnifying glass over document | Checklist with pass/fail indicators | Audit ref tag |
| **IoT / Telematics** | Sensor / antenna | Live signal waveform | Device ID tag |

#### Required illustration structure (always 3 layers)

```
Layer 1 — Background texture
  └── CSS repeating-linear-gradient grid (subtle dots/lines, opacity 0.08)
      Gives an "engineering blueprint" or "graph paper" feel.

Layer 2 — Domain illustration (2–3 CSS elements)
  ├── HERO element   — largest, represents the industry (gear, truck, chart…)
  ├── PROCESS element — medium, represents the core workflow (clipboard, form, pipeline…)
  └── INSPECT element — floating, represents review/audit/verification (magnifier, tick, alert…)

Layer 3 — Identity badge
  └── Small tag / label in bottom-right corner
      Shows a representative ID, code, or number from the domain
      (e.g. part no., order no., employee ID, SKU)
```

#### CSS technique rules

- **All elements are pure CSS** — `div` + SCSS only. No external images for the illustration.
- Use **`rgba(255,255,255, 0.15–0.55)`** fills to give frosted-glass appearance on the green gradient.
- Use **`rgba(255,255,255, 0.4–0.75)`** for borders and outlines.
- Use **`var(--color-primary)`** (`#009B42`) for any solid filled elements (e.g. header stripe on clipboard).
- Gear/cog technique — 3 rotated rectangles (0°, 60°, 120°) + circle overlay + centre hole:
  ```scss
  .cog-r { width: 100%; height: 24%; background: rgba(255,255,255,0.28); border-radius: 5px; }
  .r1 { transform: rotate(0deg); }
  .r2 { transform: rotate(60deg); }
  .r3 { transform: rotate(120deg); }
  .cog-body { width: 72%; height: 72%; border-radius: 50%; background: rgba(255,255,255,0.22); }
  .cog-hole { width: 26%; height: 26%; border-radius: 50%; background: linear-gradient(160deg,#7dd4a0,#3aad6a); }
  ```
- Clipboard/card technique — white card (`background: #fff; border-radius: 4px; box-shadow: 4px 6px 20px rgba(0,0,0,0.22)`) with green header stripe and row items.
- Magnifier technique — circle with thick border + angled handle rect.
- **Scene canvas size:** `width: 340px; height: 290px; position: relative`.
- **Tagline below illustration** (white text, bold): should name the application's exact function (e.g. `"Engineering Specification & Audit Portal"`), not a generic phrase.

#### Reference implementation (ES-Portal — Engineering Spec Audit)

```
Scene elements:
  ├── .eng-grid          — subtle CSS grid background
  ├── .cog.cog-large     — 96×96px gear, bottom-left (manufacturing)
  ├── .cog.cog-small     — 52×52px gear, interlocked above-right of large gear
  ├── .audit-clip        — 144px wide clipboard card, top-right (audit workflow)
  │     ├── .clip-fastener
  │     ├── .cp-header   "SPEC AUDIT" (green bar)
  │     ├── .cp-row ×5   (4× ✓ done, 1× pending)
  │     └── .cp-approved "APPROVED" stamp (rotated −6°)
  ├── .magnifier         — floating top-left of clipboard (inspection)
  └── .spec-tag          — "PART NO. ES-7420" badge, bottom-right
```
