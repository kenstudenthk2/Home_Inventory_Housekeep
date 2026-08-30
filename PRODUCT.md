# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user today is the project owner, managing their own home's inventory. The product is intended to later open up to other users/households — this is a confirmed future direction, not yet built (v1 has no login and operates as a single shared space). Mobile is the primary usage context: items get logged casually, in-home, phone-in-hand while standing in front of a room or piece of furniture; desktop use is secondary.

## Product Purpose

Lets a household track what physical items it owns and where they are, organized as Room → Furniture → (optional) Drawer → Item. Prevents duplicate purchases, surfaces items nearing or past their expiry date, and makes "where did I put X" answerable via global search.

## Positioning

Two shared, deduplicating global libraries — `furniture_types` and `categories` — sit independent of any specific room/furniture/item. Typing a new furniture type or category anywhere in the app inserts it into that shared library; typing an existing name reuses the existing record rather than creating a duplicate. Every picker/selector across the app draws from and contributes to these same libraries. This is the mechanism a flat notes app or spreadsheet doesn't have.

## Operating Context

- Mobile-first: the spec's mobile display rules treat phone width (<640px) as the baseline layout, with tablet/desktop as progressive enhancement (`sm:`/`lg:` breakpoints).
- v1 is a single shared space with no login/accounts — anyone with access to the deployment sees and edits the same inventory.
- Core flow: create a room → add furniture (optionally from room-type-suggested defaults) → optionally split that furniture into named drawers → log items on the furniture, or on one of its drawers once it has any (name, category, quantity, optional expiry date).
- Global search and the all-items overview page are the two ways to answer "where is X" or "what needs replacing soon."

## Capabilities and Constraints

- No auth/accounts in v1 (explicit scope cut) — this is expected to change: multi-user/multi-household support is a confirmed future direction, not yet designed or scheduled.
- No AI-driven placement suggestions in v1 — planned as an independent phase 2 project (LLM analyzes room dimensions + furniture + item counts to suggest better placement), with its own spec.
- No custom furniture photos/images in v1 — furniture types use a fixed icon set only.
- Room `width_cm`/`length_cm` are optional today specifically to support the future AI placement-suggestion feature; they are not used for anything else yet.
- Terminology: "Furniture" is an instance placed in a room (may have a custom name); "furniture type" is the shared library entry it's based on. "Category" is the shared library entry an item belongs to. "Drawer" is a free-text named sub-container scoped to one specific furniture instance (e.g. "襪褲格") — unlike furniture types/categories it is not a shared global library, since a drawer only makes sense in the context of the one piece of furniture it belongs to. A furniture piece with zero drawers behaves exactly as before (items attach to it directly); once it has any drawers, items must be placed in a specific one.

## Evidence on Hand

None. No customer testimonials, case studies, or press exist — this is a pre-multi-user personal project. Do not fabricate any.

## Product Principles

1. Reuse over duplication: shared furniture-type/category libraries mean a name typed once is findable and reusable everywhere, never re-entered as a duplicate.
2. Mobile is the real usage scene: item logging happens standing in a room, one-handed, phone in hand — not at a desk reviewing a spreadsheet.
3. Structure now, intelligence later: today's data model (room dimensions, furniture/item hierarchy) is deliberately shaped to support a planned phase-2 AI placement-suggestion feature, even though v1 doesn't use it yet.
4. Single-space today, multi-tenant tomorrow: v1's no-login/single-shared-space design is a scope cut, not a permanent architectural stance — future work should avoid decisions that would make adding accounts/households harder than necessary.

## Accessibility & Inclusion

No product-specific accessibility requirement established. Follow general web standards.
