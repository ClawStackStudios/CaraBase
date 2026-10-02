---
name: ui-webdev
description: >-
  Comprehensive UX/UI and web development design skill for engineering intuitive, accessible,
  and aesthetically stunning user interfaces. Activate when developing, refactoring, or evaluating
  frontend layouts, components, design systems, typography, spacing, color tokens, and responsive web experiences.
---

# 🎨 UI & Web Development Design Skill

This skill provides an authoritative guide and design philosophy for crafting world-class, accessible, and high-performance user interfaces within the ShellGuard and ClawStack Studios ecosystem.

---

## 🧠 Cognitive & UX Design Foundations

Great interfaces do not merely arrange visual elements—they engineer the probability space in which a user succeeds effortlessly with minimal cognitive friction.

### 1. Structural Whitespace & Proximity
- **Active Structural Element:** Treat whitespace as active architecture, not empty void. Use negative space to isolate high-value primary actions.
- **Law of Proximity (Gestalt):** Group related concepts tightly (`stack-sm` / 8px) while clearly segregating distinct domains (`stack-lg` / 24–32px). The human eye must parse logical hierarchy instantly.
- **Progressive Disclosure:** Limit simultaneous choices. Reveal complexity only when context demands it (e.g. dropup menus, collapsible drawers, expandable detail panels).

### 2. Gestalt Coherence & Recognition Over Recall
- **Visual Continuity:** Direct the user's focus naturally along predictable eye paths (F-pattern for dashboards, centered vertical flow for modal forms).
- **Sharp Figure-Ground Separation:** Keep interactive surfaces visibly distinct from background floors via subtle borders, elevation levels, and backdrop blurs.
- **Recognition Over Recall:** Make current system states, filters, active accounts, and clipboard actions immediately visible. Never force users to memorize hidden state.

### 3. Architecture of Trust & Confidence UI
- **Live System Certainty:** Communicate asynchronous states with fluid spinners, glowing focus rings, and animated countdown rings (e.g. live TOTP countdowns).
- **Humanized Error Boundaries:** When errors occur, clearly explain *why* and provide an actionable, one-click remedy rather than cryptic technical codes.
- **Defensive Micro-Interactions:** Provide instant feedback on user actions (e.g. green checkmarks on copy, smooth hover states, tactile button active presses).

---

## 🎨 Reef Modernist Design System Integration

When building or modifying UI in this project, adhere strictly to the **Reef Modernist** design system defined in [`DESIGN.md`](file:///config/Documents/workspace-lucas/projects/Agents/ShellGuard/DESIGN.md):

### 1. Dual-Theme CSS Custom Properties
Always use theme tokens to guarantee seamless switching between **Ocean Mist** (Light Mode) and **Abyssal Dark** (Dark Mode):

```css
/* Backgrounds */
bg-theme-base     /* Global viewport floor */
bg-theme-surface  /* Cards, modals, sidebars */

/* Typography */
text-theme-main   /* High-contrast primary text */
text-theme-muted  /* Subdued secondary text and metadata */

/* Borders & Dividers */
border-theme-subtle /* Carapace borders and subtle separators */
```

### 2. Brand Colors
- **Lobster Red (`#e4048a`):** Primary action buttons ("Claw"), active status indicators, destructive confirmations.
- **Claw Cyan (`#06b6d4`):** Secondary buttons ("Vents"), focus rings, TOTP progress bars, link hovers.
- **ShellGuard Purple (`#3b0764`):** Header accent boundary in light mode.

### 3. Typography Matrix
- **Headlines:** `font-headline` (`Outfit`, bold 700 / extra bold 800) with `-0.02em` letter spacing.
- **Body & Interface:** `font-sans` (`Inter`, regular 400 / medium 500 / semi-bold 600).
- **Monospace Secrets:** `font-mono` (`JetBrains Mono`) for all passwords, encryption keys, tokens, and hashes.

---

## 🏛️ Layout Patterns & Blueprints

### 1. Master-Detail Tri-Pane Layout (Bitwarden-Style)
```
┌─────────────────┬─────────────────────────┬──────────────────────────────┐
│  Sidebar Tree   │     Item List Pane      │      Item Detail Pane        │
│  (Folder Pods)  │  (Search & Type Filter) │ (Secrets, Custom Fields, CF) │
└─────────────────┴─────────────────────────┴──────────────────────────────┘
```
- **Collapsible Sidebar:** Desktop collapse button to maximize horizontal working room.
- **Sticky Search & Filter:** Middle feed remains easily searchable with instant keystroke filtering.
- **High-Density Detail Surface:** Right pane organizes secrets, custom fields, dynamic linked properties, and attachment trays without page navigations.

### 2. Ergonomic Modal Architecture
```
┌─────────────────────────────────────────────────────────────┐
│  [Favicon] Pinned Dialog Header                         [X] │
├─────────────────────────────────────────────────────────────┤
│  ▲ SCROLLABLE FORM BODY (flex-1 overflow-y-auto)            │
│    Inputs, custom field editors, dropup menu                │
│  ▼                                                          │
├─────────────────────────────────────────────────────────────┤
│  Pinned Action Footer                [ Cancel ] [ Save Item ]│
└─────────────────────────────────────────────────────────────┘
```
- **Fixed Viewport Height:** Modals use fixed `h-[90vh] md:h-[85vh]` with spacious `max-w-3xl` width.
- **Pinned Headers & Footers:** Actions (Save, Cancel, Close) never scroll out of view.
- **Internal Element Scrolling:** Form fields scroll smoothly within `flex-1 overflow-y-auto custom-scrollbar`.
- **Upward-Expanding Dropups:** Menus at the bottom of modals expand upward (`bottom-full mb-2`) with click-outside backdrops.

---

## 🔐 Cryptographic Secret Presentation & Terminal Ergonomics

When building or refactoring interfaces that display or edit cryptographic credentials, keypairs, or compound secrets (e.g. SSH keys, TLS certificates):

### 1. Compound Secret Isolation (Zero-Leak Presentation)
- **Decoupled Data Presentation**: When compound secrets (such as an SSH keypair `{ publicKey, privateKey }`) are sealed under client-side Layer 1 encryption in a single vault column, the UI MUST unwrap the payload into distinct, dedicated components.
- **Zero-Leak Unmasking Invariant**: Unmasking a private key or credential MUST NEVER leak JSON brackets, escaped characters (`\n`), or composite metadata. The private key MUST render as pure, formatted text in a monospace `<pre>` block.
- **Strict RFC 7468 PEM Formatting**: Multi-line asymmetric keys MUST strictly preserve standard RFC 7468 framing:
  ```text
  -----BEGIN PRIVATE KEY-----
  [Base64 Encoded PKCS#8 Body]
  -----END PRIVATE KEY-----
  ```
- **Independent Form Inputs**: Creation and edit modals MUST provide separate input surfaces (e.g. dedicated textarea for Private Key PEM, dedicated text input for OpenSSH Public Key) to prevent users from corrupting composite envelopes during manual edits.

### 2. High-Velocity Terminal Ergonomics
Infrastructure secrets require instant, friction-free deployment shortcuts for server administrators:
- **Direct `.pem` File Download**: Provide a single-click download action producing a clean `.pem` file formatted with standard line endings (`\n`).
- **Raw Public Key Copy**: One-click clipboard copy of the pure OpenSSH public key line.
- **Terminal Append Command Copy**: One-click clipboard copy of the terminal-ready shell one-liner:
  ```bash
  echo "<public_key>" >> ~/.ssh/authorized_keys
  ```
- **Eye-Beside-Copy Alignment**: On all masked field rows, place the Unmask toggle (`Eye`/`EyeOff`) immediately to the left of the Copy button in the right-hand action cluster.

### 3. Headless Environment Safety for Shared Client Utilities
- Shared client utilities that interact with browser APIs (`localStorage`, `sessionStorage`, `window`, `navigator`) MUST defensively check `typeof <api> === "undefined"` and provide an in-memory fallback.
- This prevents headless test runners (Vitest, Jest) or server-side build steps from crashing with `ReferenceError`.

### 4. Reef Modernist Custom Modals over Native Browser Dialogs
- **Absolute Ban on Native Dialogs**: NEVER invoke `window.prompt()`, `window.confirm()`, or `window.alert()`.
- **Theme & Thread Fidelity**: Native browser dialogs block the JS main thread, break dark-mode/abyssal visual immersion, cannot be styled, and break automated headless testing suites.
- **Custom Modal Standard**:
  - Use accessible, theme-styled modal cards (e.g. `ConfirmDialog`) with clear primary/cancel buttons.
  - Use inline input cards or popovers with keyboard navigation (`Enter` to submit, `Escape` to dismiss).
  - Always guard action bars and modal triggers with vault state checks (e.g. `!isLocked`).

### 5. Client Mutation Field Preservation Invariant
- When constructing payloads for item update endpoints (`PUT /api/vault/:id`), client adapters MUST explicitly pass and preserve all existing metadata attributes (e.g. `tags: typeof item.tags === 'string' ? item.tags : JSON.stringify(item.tags || [])`).
- Partial payloads sent to full-row update endpoints will silently overwrite and clear unmentioned columns.

---

## ♿ Accessibility & Quality Checklist

Before finalizing any UI implementation:
- [ ] **Contrast Ratios:** Text and interactive elements meet WCAG AA contrast (minimum 4.5:1 for normal text).
- [ ] **Keyboard Navigation:** All interactive elements (`<button>`, `<a>`, `<input>`) are reachable via `Tab` with visible focus rings (`focus-visible:ring-2 ring-cyan-500`).
- [ ] **Semantic HTML:** Use proper semantic landmarks (`<header>`, `<nav>`, `<main>`, `<aside>`, `<section>`, `<footer>`).
- [ ] **State Feedback:** Provide accessible loading indicators, disabled button states during API requests, and live screen-reader announcements where appropriate.
- [ ] **Responsive Fluidity:** Layout scales smoothly from 360px mobile screens to 4K ultra-wide displays without horizontal blowout.
