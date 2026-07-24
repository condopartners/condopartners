# CondoPartners — product overview

English distillation of the product intent. Detailed design (PRD, data model, flows) lives on branch `docs/fundacao-design` and may be merged separately by the team.

## One sentence

CondoPartners is a **multi-tenant B2B platform** for managing hierarchical partner networks that sell products into condominiums and other properties, with configurable commission rules, sales tracking, and payment-gated payouts.

## Problem

- Partner networks grow into trees (partner → sub-partner) without a shared system of record.
- Commission math (overprice markup and/or percent-of-sale) is often done in spreadsheets and disputed.
- Multiple companies (e.g. Clique Retire and eCondos) want the **same operational skeleton** with **different rules, catalogs, and branding**.
- Attribution of “who brought the customer” must be explicit to avoid channel conflict.

## Core capabilities (future features — not built yet)

1. **Multi-level partner management** — tree of partners and sub-partners; invitations and hierarchy for commission distribution.
2. **Commission control** — automatic calculation from sold price and level rules; strategies include overprice (sale − base) and percent-of-sale; distribution across the chain.
3. **Products and per-product rules** — base price and commission configuration per product; multiple independent catalogs per tenant.
4. **Sales registration and attribution** — who originated the customer; final sold amount; audit trail.
5. **Finance integration** — mark payments received (API/automation); release commissions only after money is collected.
6. **Earnings reports** — each partner sees earnings and which sales they came from.
7. **Shared ecosystem (vision)** — multiple companies may share opportunities over time; MVP keeps **strict tenant isolation**.
8. **Commercial flexibility** — variable prices, discounts, volume/region conditions.

## Domain glossary

| Term | Meaning |
|------|---------|
| **Tenant / company** | A white-label customer of the platform (e.g. Clique, eCondos). Data is isolated by `tenant_id`. |
| **Partner** | A node in the referral/sales tree. May invite sub-partners. |
| **Hierarchy / tree** | Parent–child partner network used for commission split. |
| **Product** | Sellable item in a tenant’s catalog (not hardcoded to lockers). |
| **Base price** | Reference cost/floor used by some commission strategies. |
| **Sold price** | Actual negotiated sale amount — often the input that matters most. |
| **Overprice / markup** | Commission pool from `sold − base` (or chained markup along the tree). |
| **Percent-of-sale** | Commission as a percentage of sold price per level. |
| **Commission strategy** | Pluggable calculation model selected per tenant. |
| **Release** | Commission becomes payable only after customer payment is confirmed. |
| **White-label** | Per-tenant brand, theme, and domain over one codebase. |

## Non-goals for scaffolding

This repository currently ships **tooling and guardrails only**. No partner, commission, product, auth, or database features until approved specs exist under `docs/specs/`.
