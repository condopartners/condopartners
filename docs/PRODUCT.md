# CondoPartners — product overview

English distillation of the product intent. Detailed design (PRD, data model, flows) lives on branch `docs/fundacao-design` and may be merged separately by the team.

## One sentence

CondoPartners is a **multi-tenant B2B platform** for managing hierarchical partner networks that sell products into condominiums and other properties, with configurable commission rules, sales tracking, and payment-gated payouts.

**Product UI language: pt-BR.**

## Problem

- Partner networks grow into trees (partner → sub-partner) without a shared system of record.
- Commission math (overprice markup and/or percent-of-sale) is often done in spreadsheets and disputed.
- Multiple companies (e.g. Clique Retire and eCondos) want the **same operational skeleton** with **different rules, catalogs, and branding**.
- Attribution of “who brought the customer” must be explicit to avoid channel conflict.

## Core capabilities (future features — not built yet)

See [`FEATURES.md`](FEATURES.md) for the full organized list. Summary:

1. Multi-level partner management
2. Commission control (overprice and/or percent-of-sale)
3. Products and per-product rules
4. Sales registration and attribution
5. Finance integration (pay only after receipt)
6. Earnings reports
7. Shared ecosystem (vision; MVP stays tenant-isolated)
8. Commercial flexibility (price, discount, volume/region)

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
