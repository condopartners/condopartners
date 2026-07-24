# Landing — design system (marketing)

Mode: **Persuade**. Product truth stays in `docs/PRODUCT.md`. This file is the marketing surface only.

## Direction contract

**THESIS:** The partner hierarchy is the product proof — a living lobby directory of pai→filho nodes plus a commission strip — not a generic SaaS dashboard hero.

**OWN-WORLD:** Cool residential stone (not cream), ink facade charcoal, courtyard green accent, late-afternoon lobby light. Display face *Bricolage Grotesque*; body *Albert Sans*. Components feel like a building directory: clear rules, quiet brass for money figures only.

**STORY:** Visitor recognizes planilha pain → sees one system for rede/indicação/comissão → joins waitlist or contacts.

**FIRST VIEWPORT:** Full-bleed lobby/facade atmosphere; oversized brand `CondoPartners`; one headline; one support line; dual CTA group; dominant SVG network+comissão visual edge-to-edge in the hero plane (no floating cards/badges).

**FORM:** “Árvore no lobby” — directory-board staging of the referral tree; seed: unattended Paperclip heartbeat (spec-locked copy; visual world committed here).

## Palette

| Token | Value | Role |
|-------|-------|------|
| `--ink` | `#102028` | text, facade |
| `--paper` | `#EEF1F3` | page ground (cool stone) |
| `--mist` | `#D7DEE4` | secondary surfaces |
| `--courtyard` | `#1F6B4F` | primary CTA / accent |
| `--courtyard-ink` | `#E8F5EF` | CTA text on green |
| `--brass` | `#9A7340` | commission figures only |
| `--sky` | `#A8BCC8` | hero wash |

## Type

- Display / brand: **Bricolage Grotesque**
- Body / UI: **Albert Sans**
- Avoid Inter, Roboto, Arial, system as primary; avoid cream+terracotta and purple glow defaults.

## Motion (anime.js)

1. Load: brand + headline settle; network nodes cascade pai→filho.
2. Scroll: section reveal on `#problema` / pillars (IntersectionObserver + anime).
3. Hover: CTA underline/ink shift (CSS).
4. `prefers-reduced-motion: reduce` → skip JS motion; content visible by default.

## Layout rules

- Hero budget strict: brand, headline, support, CTA group, one dominant visual.
- No cards in hero; section lists are clean, not icon-card grids.
- pt-BR copy only — strings from `docs/specs/landing-page.md`.
