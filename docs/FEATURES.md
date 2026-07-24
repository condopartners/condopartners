# Core features

Target capability set for CondoPartners. Nothing listed here is implemented yet — each item needs an approved issue and a spec under [`docs/specs/`](specs/).

For product context and glossary, see [`PRODUCT.md`](PRODUCT.md). Deeper design artifacts may land from branch `docs/fundacao-design`.

---

## 1. Multi-level partner management

- Register partners and sub-partners in a **tree** (parent → children).
- Any partner may invite others and participate in the sales chain.
- The hierarchy is the source of truth for **who earns what** when a sale closes.

## 2. Commission control

Automatic commission calculation from:

- **Sold price** (final negotiated amount)
- **Per-level rules** along the partner chain

Supported models (tenant-configurable later):

| Model | Idea |
|-------|------|
| **Overprice / markup** | Pool = sold price − base price (or chained markup along the tree) |
| **Percent-of-sale** | Each level takes a configured % of the sold price |

Commissions are **distributed across levels** of the partner network according to those rules.

## 3. Products and per-product rules

Each product in a tenant catalog may define:

- Base price
- Commission rules specific to that product

Multiple products are first-class — configurations are independent (not a single hard-coded SKU).

## 4. Sales registration and attribution

Track, per sale:

- **Who originated the customer** (attribution)
- **Final sold amount**

Goal: reduce disputes over “whose client is this?”

## 5. Finance integration

Integrate (API and/or automation) to:

- Detect when customer payments are received
- **Release commissions only after receipt**

Hard rule: **no commission payout if the customer has not paid**.

## 6. Earnings reports

Each partner can see:

- How much they are earning
- Which sales / origins produced each commission

## 7. Shared partner ecosystem (vision)

Longer-term: companies may share partner bases and opportunities (“ecosystem exchange”) to generate more business for everyone.

**MVP stance:** strict **tenant isolation** — no cross-company data reads until a dedicated, approved design exists.

## 8. Commercial flexibility

Support real-world negotiation:

- Variable prices
- Discounts
- Conditions by volume or region

---

## Implementation note

These features are **out of scope for scaffolding**. Implement only via:

1. Approved GitHub issue  
2. Spec in `docs/specs/`  
3. TDD + `bun run check` + engineer-reviewed PR  
