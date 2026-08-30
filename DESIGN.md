---
name: "家居物品管理 (Home Inventory Housekeep)"
description: "The Quiet Pantry — a calm, mobile-first forest-sage system for logging what's in every room, furniture piece, and drawer"
colors:
  accent: "#2d5e3a"
  accent-light: "#4a8c5e"
  bg: "#f5f3ee"
  surface: "#ffffff"
  surface-sage: "#c8dbbc"
  surface-mist: "#d6e4e8"
  border: "#dce5d6"
  border-input: "#c3d4bb"
  ink: "#1b3a28"
  ink-muted: "#4a6b52"
  ink-faint: "#8aa290"
  status-expired-bg: "#fee2e2"
  status-expired-text: "#991b1b"
  status-expiring-bg: "#fef3c7"
  status-expiring-text: "#92400e"
  danger: "#dc2626"
  danger-surface: "#fef2f2"
typography:
  heading:
    fontFamily: "Funnel Sans, sans-serif"
  body:
    fontFamily: "Inter, sans-serif"
  caption:
    fontFamily: "Geist, sans-serif"
rounded:
  sm: "4px"
  md: "6px"
  lg: "6px"
  full: "9999px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.accent-light}"
  button-icon-ghost:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.sm}"
    height: "44px"
    width: "44px"
  chip-neutral:
    backgroundColor: "{colors.surface-mist}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  input-text:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "16px"
  nav-link:
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 8px"
---

# Design System: 家居物品管理 (Home Inventory Housekeep)

## Overview

**Creative North Star: "The Quiet Pantry"**

This is a system for a tool you reach for one-handed, standing in a room, phone in the other hand — not a dashboard you sit down to review. Everything about it reads as a calm, well-organized household ledger: warm linen background, deep forest-green accent used sparingly, sage-tinted neutrals instead of clinical grays, and borders that do the work shadows would do elsewhere. Nothing competes for attention; the room card, the furniture list, the item row all sit at the same quiet volume so the one thing that should stand out — an expiring item, the active furniture selection — actually does.

The system is decisively flat and border-led, not layered. Depth is used exactly twice, for exactly two roles (see Elevation & Depth), and nowhere else. Typography is functional, not expressive: three font roles, no display-scale drama, weight and a heading font are what carry hierarchy. Every piece of copy in the shipped UI is Cantonese/Traditional Chinese; CJK sets the baseline sizing logic (16px minimum on inputs, no reliance on italics or letter-spacing tricks for emphasis).

**Key Characteristics:**
- Warm-linen background with sage-tinted neutrals, not cool gray
- One accent color (Deep Forest), used only for primary actions and the active/selected state
- Border-first surfaces; shadow is reserved for exactly two elevated roles
- Small, consistent radii (4–6px) everywhere except pills (fully round)
- Three font roles doing distinct jobs: heading, body, caption — no bespoke type scale

## Colors

A warm, sage-tinted neutral field with a single confident forest-green accent; status colors borrow directly from Tailwind's stock red/amber rather than custom tokens, since they're used narrowly and consistently.

### Primary
- **Deep Forest** (`#2d5e3a`, `colors.accent`): the one accent color in the system. Primary buttons, the active/selected furniture state, links that mean "do the main thing." Used sparingly — most of any screen carries no accent at all, which is what makes it register when it appears.
- **Fern Green** (`#4a8c5e`, `colors.accent-light`): Deep Forest's hover/pressed state only. Never used as a resting color.

### Neutral
- **Warm Linen** (`#f5f3ee`, `colors.bg`): page background and the resting color for ghost icon buttons (header search toggle, hamburger menu).
- **Paper Surface** (`#ffffff`, `colors.surface`): cards, forms, the header bar, the sidebar drawer panel — anything that reads as "a distinct object sitting on the page."
- **Spring Sage** (`#c8dbbc`, `colors.surface-sage`): defined in the theme but not yet applied anywhere in the shipped UI. Reserved — reach for it before inventing a new greenish surface tone.
- **Morning Mist** (`#d6e4e8`, `colors.surface-mist`): the hover/selected background for list rows and nav links, and the fill for neutral chips (category tags, item-count pills).
- **Sage Border** (`#dce5d6`, `colors.border`): default border for cards, containers, dividers, dashed empty-state boxes.
- **Sage Input Border** (`#c3d4bb`, `colors.border-input`): every text input, select, and textarea border — slightly more saturated than the container border so form fields read as distinctly interactive.
- **Pine Ink** (`#1b3a28`, `colors.ink`): primary text color.
- **Moss Muted** (`#4a6b52`, `colors.ink-muted`): labels, field captions, secondary metadata (room type, item counts).
- **Faint Sage** (`#8aa290`, `colors.ink-faint`): placeholder-weight text — empty-state copy, "no matching options."

### Status & Danger (Tailwind stock colors, used as a consistent vocabulary)
- **Alert Red** (bg `#fee2e2` / text `#991b1b`, `colors.status-expired-bg` / `status-expired-text`): an item's expiry date has passed.
- **Amber Caution** (bg `#fef3c7` / text `#92400e`, `colors.status-expiring-bg` / `status-expiring-text`): an item is expiring soon.
- **Danger Red** (`#dc2626`, `colors.danger`, with `#fef2f2` / `colors.danger-surface` as its hover fill): delete actions — always rendered as a plain text/icon affordance, never a filled danger button.

### Named Rules
**The Forest-Only Rule.** Every color in the shipped UI should resolve to a token above. `app/error.tsx` and `app/not-found.tsx` currently reach for raw Tailwind `red-*`/`slate-*` instead — that's a drift to close, not a second palette to extend.

## Typography

**Heading Font:** Funnel Sans (`font-heading`)
**Body Font:** Inter (`font-body`, applied via `body { font-family: var(--font-sans) }`)
**Caption/Label Font:** Geist (`font-caption`)

**Character:** Functional, not decorative — the system carries hierarchy through font-role switching and weight, not through a bespoke size scale. There is no custom `fontSize`/`lineHeight` token set; every size comes straight from Tailwind's default text utilities (`text-xs` through `text-xl`), applied contextually.

### Hierarchy
- **Heading** (Funnel Sans, `font-semibold`/`font-bold`/`font-extrabold`, sized `text-base`–`text-xl` by context): page titles (`h1`), section titles (`h2`), the sidebar drawer title, the brand mark in the header.
- **Body** (Inter, regular weight): the default for prose content — room type + dimensions line on dashboard cards is the one place it's applied explicitly (`font-sans`).
- **Caption** (Geist, `text-xs`–`text-sm`, often `font-medium`/`font-semibold`): form labels, muted metadata, button labels, nav links, chip text — the workhorse role; most visible UI text outside headings is Caption.
- **Item/entity names** (`font-medium`, `text-ink`, no explicit font-role class — inherits Body): item names in `ItemRow`, room names, furniture display names.

### Named Rules
**The No-Zoom Rule.** Form inputs stay at `text-base` (16px) on mobile and only drop to `text-sm` at `sm:` and wider (`className="... text-base sm:text-sm"`). Anything smaller than 16px on an unzoomed mobile input triggers iOS Safari's auto-zoom-on-focus — every text/number/date input in this codebase follows this pattern without exception.

## Layout

Mobile-first, single-column by default, widening only via `sm:`/`lg:` prefixes — never the reverse. There is no custom spacing scale; every gap, padding, and margin value comes from Tailwind's default 4px-based scale, applied consistently rather than arbitrarily:

- `gap-1`/`gap-2` for tight inline clusters (chip + label, icon + text)
- `gap-3`/`gap-4` for stacked form fields and list items
- `gap-6`/`gap-8` for separating major page sections
- `p-3` for compact list-item cards (furniture picker rows), `p-4` for standard cards and forms, `p-6`/`p-8` for empty-state placeholders

Page content sits in `main` with `px-4 py-6` on mobile, widening to `px-8` at `lg:`. The two-column room workspace (`RoomWorkspace`) is the one layout that goes wide: `grid gap-6 lg:grid-cols-[1fr_320px]` with the item list first in markup but visually reordered to lead on desktop (`order-2 lg:order-1`) while furniture stays first on mobile (`order-1`) — mobile sees "pick furniture" before "see its items," desktop sees both side by side.

Breakpoints follow Tailwind defaults: `sm` (≥640px) is the mobile→tablet hinge where search bars, filter panels, and hidden nav items reveal themselves; `lg` (≥1024px) is where multi-column grids (room cards, the workspace split) engage.

## Elevation & Depth

Flat and border-led by default — the large majority of surfaces (cards, forms, list rows, chips) use only a `border-border` outline against the `surface`/`bg` fields, no shadow at all. Shadow is reserved for exactly two structural roles, not used as ambient decoration.

### Shadow Vocabulary
- **Dashboard card lift** (`shadow-sm`): applied only to the clickable room cards on the dashboard, signaling "this whole card is a link."
- **Overlay drawer** (`shadow-lg`): applied only to the sidebar's slide-out navigation panel, separating it from the `bg-black/40` scrim behind it.

### Named Rules
**The Flat-by-Default Rule.** If a surface isn't a dashboard room card or the sidebar drawer, it gets a border, not a shadow. Adding shadow anywhere else is a deviation, not a variant.

## Shapes

Small, consistent radii carry the whole system — nothing rounds past 6px except full pills.

- **`rounded-sm` (4px):** every interactive control — buttons, text inputs, selects, icon-only buttons, individual furniture-list rows.
- **`rounded-md` (6px):** containers that hold interactive controls or content — cards, empty-state placeholders, the dashed "nothing here yet" boxes, the error banner.
- **`rounded-lg` (6px, same value as `md`):** used on the two form-shell wrappers (`ItemForm`, `InventoryFilters`) and the dashboard room cards — visually identical to `rounded-md` today; the codebase hasn't yet differentiated them.
- **`rounded-full`:** exclusively for pills — the expiry badge, category/count chips, and the search input's implicit pill affordance.

No sharp corners anywhere in the shipped UI, and no radius above 6px other than full pills — there's no "large card" radius tier.

## Components

Buttons, inputs, and cards all share one voice: quiet and utilitarian. Radius stays small, color is used only to mark the primary action or a status, and every interactive control keeps a real border or a real background — nothing relies on shadow alone to read as clickable.

### Buttons
- **Shape:** `rounded-sm` (4px), no exceptions.
- **Primary:** `bg-accent` / white text / `font-caption font-semibold` / `hover:bg-accent-light`. Full-width (`w-full`) and `h-11` (44px) when it's the main action on a mobile form (submit, "new room," "new furniture").
- **Icon-only / ghost:** `bg-bg` background, `text-ink-muted`, `h-11 w-11` — the header's search toggle and the sidebar's hamburger trigger. Always exactly 44×44px; this is a hard rule, not a default that happens to measure that.
- **Text-link buttons:** no chrome at all — `text-accent`/`text-ink-muted`/`text-red-600` with `hover:underline`, used for low-emphasis actions (cancel, save-inline, delete). Delete always renders this way or as a ghost icon button with `hover:bg-red-50 hover:text-red-600` — never as a filled danger button.

### Chips
- **Neutral tag** (`bg-surface-mist`, `text-ink`/`text-ink-muted`, `rounded-full`): category labels on item rows, the item-count summary chips on the room page.
- **Status badge** (`rounded-full`, paired bg/text from the Status palette): the expiry badge is the only status chip in the system — `status-expired-*` or `status-expiring-*`, nothing else uses this pairing.

### Cards / Containers
- **Corner Style:** `rounded-md` (see Shapes — `rounded-lg` is used interchangeably today).
- **Background:** `bg-surface` against the `bg-bg` page.
- **Border:** always `border-border`; dashed (`border-dashed`) specifically for empty states.
- **Shadow Strategy:** none, except the dashboard room card (`shadow-sm`) — see Elevation & Depth.
- **Internal Padding:** `p-4` standard, `p-3` for denser list-style cards (furniture rows), `p-6`/`p-8` for empty-state placeholders.
- **Selected state:** swap `border-border`/`bg-surface` for `border-accent`/`bg-surface-mist` — this is the only place accent touches a container background rather than a button.

### Inputs / Fields
- **Style:** `border-border-input` (a step more saturated than the container border), `rounded-sm`, `px-3 py-2`, `text-base sm:text-sm` (see the No-Zoom Rule).
- **Label:** always a separate `<label>` above the field, `text-sm font-caption font-medium text-ink-muted` — never a placeholder-only field.
- **Combobox / searchable select:** typed text filters a `role="listbox"` dropdown (`border-border`, `rounded-sm`, options `hover:bg-surface-mist`); an unmatched typed value surfaces a "新增「…」" (create new) row in `text-accent`, making the shared-library create-or-reuse mechanism visible at the input level.

### Navigation
- **Header:** `bg-surface` with a bottom `border-border`, sticky content row (`px-4 py-3`, `lg:px-8`). Brand mark uses `font-heading font-bold`; search collapses to an icon-only toggle below `sm:`.
- **Sidebar (drawer):** hamburger trigger opens a `fixed inset-0` overlay — `bg-black/40` scrim behind a `w-72 max-w-[80vw]` `bg-surface` panel with `shadow-lg`. Nav links and room links share one style: `rounded-sm px-2 py-2 text-sm font-caption`, `hover:bg-surface-mist`, an `lucide-react` icon in `text-ink-muted` leading each label.

## Do's and Don'ts

### Do:
- **Do** keep every icon-only button at exactly 44×44px (`h-11 w-11`) — this is a tap-target commitment, not a visual default.
- **Do** keep form inputs at `text-base` on mobile, dropping to `text-sm` only at `sm:` and above (the No-Zoom Rule).
- **Do** reuse the Sage Border / Sage Input Border pair for anything bordered instead of introducing a plain Tailwind gray.
- **Do** use `rounded-full` exclusively for pills (badges, chips) and `rounded-sm`/`rounded-md` for everything else.
- **Do** treat the accent color (Deep Forest) as a scarce resource — primary actions and the one active/selected state only.

### Don't:
- **Don't** add a shadow anywhere except the dashboard room card (`shadow-sm`) and the sidebar drawer (`shadow-lg`) — the system is flat/border-led everywhere else.
- **Don't** introduce a new accent or a second "brand" color; there is exactly one accent in this system.
- **Don't** copy `app/error.tsx`'s or `app/not-found.tsx`'s raw Tailwind `red-*`/`slate-*` classes into new work — they predate the token system and should migrate to it, not spread further.
- **Don't** invent a custom spacing or type-size scale; this project deliberately relies on Tailwind's default scales rather than bespoke tokens.
- **Don't** render a delete/destructive action as a filled button — it's always a text-link or ghost-icon treatment with red text/hover, never a solid `bg-red-*` button.
