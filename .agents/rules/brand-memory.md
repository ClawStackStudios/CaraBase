---
trigger: always_on
---

# Brand Memory

I maintain a brand memory. It holds the visual identity, voice, and design language of the product I am building. The Brain says *what the project is*. The Brand Memory says *what the project looks like, sounds like, and feels like*.

## What the Brand Memory Is

The Brand Memory is my aesthetic and identity anchor. It is not a style guide — it is the compressed, living essence of the brand that I carry into every UI decision, every user-facing string, every color choice, and every layout stroke. Without it, I make decisions that are technically correct but visually incoherent. With it, every surface I touch reinforces the same identity.

## Where It Lives

The Brand Memory lives at `.agents/brain/project/brandIdentity.md`.

It is a single file. Not a folder. Not a system. One file that holds:

| Section | What It Captures |
|---|---|
| **Brand Name & Tagline** | The canonical product name, any trademark symbols, and the one-line tagline that anchors the voice. |
| **Design Language** | The named design system (e.g. "Reef Modernist", "Material You", "Fluent") and its core principles in 2–3 sentences. |
| **Color Palette** | Primary, secondary, accent, surface, error, and border tokens as hex values. Theme variants if applicable. |
| **Typography** | Font families, weight conventions, and size scale principles (not pixel values — principles). |
| **Component DNA** | The defining visual traits that make this product recognizable: elevation rules, border treatments, corner radii, card styling. The things a designer would notice in a blind lineup. |
| **Voice & Tone** | How the product speaks to users: formal vs. casual, technical vs. approachable, terse vs. verbose. One sentence for each register (error messages, success states, empty states, onboarding). |
| **Iconography & Motion** | Icon style (outlined, filled, duotone), animation philosophy (spring physics, linear, none), and transition principles. |
| **Cross-Platform Parity Anchors** | If the brand spans multiple platforms (web, mobile, desktop, CLI), the canonical reference implementation and the parity rules that bind them. |

## How I Use It

When I am making any user-facing decision — choosing a color, writing a snackbar message, laying out a card, styling an error state, or building a new screen — I check `brandIdentity.md` first. Not the spec documents. Not the theme file. The brand memory. The spec tells me *how* to implement. The brand memory tells me *what it should feel like*.

## When I Update It

- When a new theme accent or color token is added to the design system.
- When the product voice shifts (e.g. from formal to conversational).
- When a cross-platform parity rule is established or violated and corrected.
- When a design decision is made that defines a new visual convention (e.g. "all cards use 1dp borders, zero elevation").

## When I Don't Update It

- For implementation details (those belong in `systemPatterns.md` or `techContext.md`).
- For individual screen layouts (those belong in design specs or code).
- For temporary experimental styles that haven't been ratified.

## Relationship to the Brain

The Brand Memory is a leaf file in `brain/project/`. It does not affect the Brain's core operation. If this rule is removed, the Brain continues to function — it simply loses aesthetic continuity.

| Brain File | How Brand Memory Relates |
|---|---|
| `productContext.md` | Brand Memory is the *visual expression* of what `productContext.md` describes as the product's purpose and UX goals. |
| `systemPatterns.md` | Brand Memory provides the *why* behind UI pattern choices documented in `systemPatterns.md`. |
| `techContext.md` | Theme engine configuration (Compose theming, Material 3 tokens) lives in `techContext.md`; Brand Memory holds the *values* those engines consume. |
| `progress.md` | When a new screen or UI component is built, Brand Memory ensures it ships with the right identity, which `progress.md` records. |

## Portability

This rule is project-agnostic. The structure of `brandIdentity.md` is the same whether the project is an Android app, a React web app, a CLI tool, or a design system library. Only the *content* changes. When carrying this rule into a new project, create a fresh `brain/project/brandIdentity.md` and populate it from whatever design sources exist.
