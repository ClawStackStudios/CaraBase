---
# CaraBase Design System

brand:
  name: "CaraBase"
  tagline: "The Core You Actually Use — Your LAN-First, Self-Hosted SQLite DBaaS"
  theme: "ClawStack Slate & Cyber Accent"
  mascot: "🦞 CrustAgent©™ / Lobster"
  copyright: "©™"

colors:
  light:
    background: "hsl(210 20% 98%)"
    foreground: "hsl(222 47% 11%)"
    card: "hsl(0 0% 100%)"
    cardForeground: "hsl(222 47% 11%)"
    popover: "hsl(0 0% 100%)"
    popoverForeground: "hsl(222 47% 11%)"
    primary: "hsl(180 100% 25%)"
    primaryForeground: "hsl(180 100% 97%)"
    secondary: "hsl(210 40% 96.1%)"
    secondaryForeground: "hsl(222 47% 11%)"
    muted: "hsl(210 40% 96.1%)"
    mutedForeground: "hsl(215.4 16.3% 46.9%)"
    accent: "hsl(210 40% 96.1%)"
    accentForeground: "hsl(222 47% 11%)"
    destructive: "hsl(346.8 84.2% 49.8%)"
    destructiveForeground: "hsl(210 20% 98%)"
    border: "hsl(214.3 31.8% 91.4%)"
    input: "hsl(214.3 31.8% 91.4%)"
    ring: "hsl(180 100% 25%)"

  dark:
    background: "hsl(210 24% 4.5%)"
    foreground: "hsl(210 40% 98%)"
    card: "hsl(210 24% 4.5%)"
    cardForeground: "hsl(210 40% 98%)"
    popover: "hsl(222.2 84% 4.9%)"
    popoverForeground: "hsl(210 40% 98%)"
    primary: "hsl(175 75% 42%)"
    primaryForeground: "hsl(222.2 47.4% 11.2%)"
    secondary: "hsl(217.2 32.6% 17.5%)"
    secondaryForeground: "hsl(210 40% 98%)"
    muted: "hsl(217.2 32.6% 17.5%)"
    mutedForeground: "hsl(215 20.2% 65.1%)"
    accent: "hsl(217.2 32.6% 17.5%)"
    accentForeground: "hsl(210 40% 98%)"
    destructive: "hsl(346.8 62.8% 30.6%)"
    destructiveForeground: "hsl(210 40% 98%)"
    border: "hsl(217.2 32.6% 17.5%)"
    input: "hsl(217.2 32.6% 17.5%)"
    ring: "hsl(175 75% 42%)"

  brand:
    teal:
      50: "#f0fdfa"
      100: "#ccfbf1"
      200: "#99f6e4"
      300: "#5eead4"
      400: "#2dd4bf"
      500: "#14b8a6"
      600: "#0d9488"
      700: "#0f766e"
      800: "#115e59"
      900: "#134e4a"
    emerald:
      50: "#ecfdf5"
      100: "#d1fae5"
      200: "#a7f3d0"
      300: "#6ee7b7"
      400: "#34d399"
      500: "#10b981"
      600: "#059669"
      700: "#047857"
      800: "#065f46"
      900: "#064e3b"
    red:
      50: "#fef2f2"
      100: "#fee2e2"
      200: "#fecaca"
      300: "#fca5a5"
      400: "#f87171"
      500: "#ef4444"
      600: "#dc2626"
      700: "#b91c1c"
      800: "#991b1b"
      900: "#7f1d1d"
    slate:
      50: "#f8fafc"
      100: "#f1f5f9"
      200: "#e2e8f0"
      300: "#cbd5e1"
      400: "#94a3b8"
      500: "#64748b"
      600: "#475569"
      700: "#334155"
      800: "#1e293b"
      900: "#0f172a"
      950: "#020617"

  gradients:
    heroLight: "from-slate-50 via-teal-50 to-emerald-50"
    heroDark: "from-slate-950 via-slate-900 to-slate-950"
    primary: "from-teal-500 to-teal-700"
    secondary: "from-teal-600 to-teal-800"
    tertiary: "from-red-600 to-red-700"
    accent: "from-teal-400 to-emerald-400"
    action: "from-amber-500 to-amber-600"

  semantic:
    success: "hsl(142 76% 36%)"
    warning: "hsl(38 92% 50%)"
    info: "hsl(199 89% 48%)"
    error: "hsl(0 84% 60%)"
    neutral: "hsl(215 25% 27%)"

  chart:
    1: "hsl(175 75% 42%)"
    2: "hsl(142 76% 36%)"
    3: "hsl(38 92% 50%)"
    4: "hsl(0 84% 60%)"
    5: "hsl(215 25% 27%)"

typography:
  fontFamily:
    sans: ["Inter", "Outfit", "system-ui", "sans-serif"]
    mono: ["JetBrains Mono", "Fira Code", "monospace"]

  fontSize:
    xs: "0.75rem"
    sm: "0.875rem"
    base: "1rem"
    lg: "1.125rem"
    xl: "1.25rem"
    "2xl": "1.5rem"
    "3xl": "1.875rem"
    "4xl": "2.25rem"
    "5xl": "3rem"

  fontWeight:
    normal: "400"
    medium: "500"
    semibold: "600"
    bold: "700"

  lineHeight:
    none: "1"
    tight: "1.2"
    snug: "1.35"
    normal: "1.5"
    relaxed: "1.6"

  letterSpacing:
    tighter: "-0.05em"
    tight: "-0.025em"
    normal: "0em"
    wide: "0.025em"

spacing:
  0: "0"
  1: "0.25rem"
  2: "0.5rem"
  3: "0.75rem"
  4: "1rem"
  5: "1.25rem"
  6: "1.5rem"
  8: "2rem"
  10: "2.5rem"
  12: "3rem"
  16: "4rem"

  section:
    vertical: "5rem"
    horizontal: "1rem"

borderRadius:
  none: "0"
  sm: "calc(0.375rem - 1px)"
  DEFAULT: "0.375rem"
  md: "calc(0.375rem - 2px)"
  lg: "0.5rem"
  xl: "0.75rem"
  "2xl": "1rem"
  full: "9999px"

shadows:
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
  DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1)"
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)"
  inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)"

elevation:
  none: "0"
  1: "z-10"
  10: "z-10"
  20: "z-20"
  modal: "z-50"
  dropdown: "z-50"
  tooltip: "z-50"

motion:
  duration:
    150: "150ms"
    200: "200ms"
    300: "300ms"
    500: "500ms"

  easing:
    DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)"
    "in-out": "cubic-bezier(0.4, 0, 0.2, 1)"
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)"

  viewTransition:
    duration: "500ms"
    easing: "ease-in-out"

components:
  button:
    height:
      sm: "2rem"
      DEFAULT: "2.25rem"
      lg: "2.5rem"
    padding:
      sm: "0.5rem 0.75rem"
      DEFAULT: "0.5rem 1rem"
      lg: "1rem 2rem"
    fontSize:
      sm: "0.75rem"
      DEFAULT: "0.875rem"
      lg: "1.125rem"
    borderRadius: "0.375rem"
    transition: "all 150ms ease-in-out"

    variants:
      default:
        background: "var(--primary)"
        foreground: "var(--primary-foreground)"
        hover: "var(--primary) / 0.9"
      destructive:
        background: "var(--destructive)"
        foreground: "var(--destructive-foreground)"
        hover: "var(--destructive) / 0.9"
      outline:
        background: "var(--background)"
        border: "1px solid var(--input)"
        hover: "var(--accent)"
      ghost:
        background: "transparent"
        hover: "var(--accent)"

  card:
    borderRadius: "0.75rem"
    border: "1px solid var(--border)"
    background: "var(--card)"
    shadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)"
    padding: "1.5rem"

    header:
      title:
        fontSize: "1.125rem"
        fontWeight: "600"
      description:
        fontSize: "0.875rem"
        color: "var(--muted-foreground)"

  input:
    height: "2.25rem"
    padding: "0.25rem 0.75rem"
    fontSize: "1rem"
    borderRadius: "0.375rem"
    border: "1px solid var(--input)"
    background: "transparent"

  modal:
    backdrop: "rgba(0, 0, 0, 0.6) blur(4px)"
    borderRadius: "1rem"
    shadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)"
    maxWidth: "40rem"

    header:
      borderBottom: "2px solid"
      title:
        fontSize: "1.25rem"
        fontWeight: "700"

  badge:
    fontSize: "0.75rem"
    fontWeight: "500"
    padding: "0.125rem 0.5rem"
    borderRadius: "9999px"

  scrollbar:
    width: "8px"
    height: "8px"
    track: "transparent"
    thumb:
      background: "rgba(148, 163, 184, 0.3)"
      borderRadius: "4px"

brandAnimation:
  letterBounce:
    subtle:
      translateY: "-0.5rem"
      scale: "1.05"
      stiffness: "400"
      damping: "10"

---

# Design Intent

CaraBase embodies the spirit of a sovereign developer vault — a secure, high-performance database workspace where developers and autonomous machine agents delegate authority cleanly. The design system balances developer utility, high-density visualization, and visual aesthetics.

## Visual Philosophy

The design system is built on three core principles:

### 1. Sovereign Vault (Carapace Security)
Like a lobster's armored carapace, the interface communicates robustness and cryptographic validation. High-contrast grid frames, semi-transparent overlays (`backdrop-blur-md`), and rigorous outline structures emphasize data stability. The carbon backgrounds (`bg-[#0f1419]` / `bg-slate-950`) provide a clean environment that anchors glowing cyber accent colors.

### 2. High-Density Parity
CaraBase organizes its UI around high-density technical workspaces rather than sweeping layouts. The Data Grid handles thousands of records with tiny, crisp sticky headers, while the Schema view renders visual metadata constraints (PK, NOT NULL, DEFAULT badges) immediately, ensuring maximum efficiency.

### 3. Cybernetic Micro-Interactions
The interface responds dynamically to all activities. Column sorting triggers directional motion cues, real-time Server-Sent Event feeds slide into console blocks with micro-scale entries, and active cryptographic keys glow subtly. The "Liquid Metal" circular wipe transition on theme toggling gives an organic, premium feel when molting between Light and Dark modes.

## Color Psychology

**Teal / Cyber Green** represents human database administration — systematic planning, REST endpoint mapping, and secure schema structures. Used for primary controls, healthy indicators, and active workspace nodes.

**Red / Ruby Accent** represents machine-level agent entities (`lb-`) and timing comparison processes. Used for revocable agent credentials, direct ALTER TABLE schema operations, and critical database deletions.

**Amber / Alert Yellow** represents pending states, transactional rollbacks, and security warning flags. Used for confirmation checks, policy conflicts, and audit trail warning indicators.

**Slate / Carbon Gray** forms the neutral framework — representing the physical storage, the database layout, and the environment volume mounts. Light and dark variants guarantee a high-contrast ratio that exceeds WCAG AA guidelines in all states.

## Typography

The type system values clean geometry and monospace accuracy. Outfit and Inter form the primary sans-serif layers, offering outstanding legibility for dense tables, sidebars, and control inputs. JetBrains Mono handles all database values, SQL queries, dynamic API endpoints, and JSON inspection blocks with pincer-like precision.

Line heights are tightened for tables (`leading-tight`) to optimize rows per viewport, while body text uses a relaxed layout (`leading-normal`) for comfortable reading. Muted colors indicate columns containing null values or secondary configuration parameters.

## Spatial Design

A unified 4px/8px spacer grid governs all layout boundaries. View workspaces utilize high-density spacing margins to ensure complex interfaces (like the custom REST API Builder) remain visible without overflow scrolling. 

Sidebar sections utilize collapsible partitions that persist via localStorage, and layout cards maintain standard `rounded-xl` structures to feel modern yet extremely robust.

## Component Personality

**Buttons** are tactile and clean. Standard button states scale subtly and transition with a 150ms ease curve.

**Interactive Tables & Cells** react instantly. Sticky column headers freeze during vertical scrolling, and cell hover parameters provide clear, reactive feedback.

**Inline Badges** convey detailed constraints at a glance. Primary keys display green `PK` badges, not-null constraints render in teal, and default evaluations show in secondary slate borders.

**Audit LED Timelines** display event status outcomes visually. A green status LED signifies successful transaction operations, while amber and red indicators flag immediate policy rejections and route rollbacks.

## Accessibility

All default states strictly satisfy WCAG AA contrast expectations. Focus states present clear `ring-1` custom indicator outlines. Minimum font sizes never slide below `xs` (12px), and inputs enforce standard tap heights for touchscreen LAN environments.

## The Lobster Ethos

Every design asset celebrates the sovereign CaraBase brand:

- **ShellCryption** — isolated, encrypted SQLCipher data vaults protecting critical storage assets.
- **Pincer Routing** — rigorous dual-layer API gates parsing apikey credentials and volatile human/agent tokens.
- **Scuttling Streams** — live database mutations broadcasted instantly via Server-Sent Events.
- **Molting Migrations** — visual ALTER TABLE schema modifications that evolve database shape without data loss.

The resulting experience is highly technical, premium, and designed to make LAN-first database administration a visual delight.
