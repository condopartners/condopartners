# Specs

No product feature may be implemented without an **approved GitHub issue** and a matching **spec file** in this directory.

## Process

1. Open / claim an approved issue.
2. Write `docs/specs/<slug>.md` using superpowers brainstorming / writing-plans.
3. Get human approval when the issue or complexity requires it.
4. Implement with TDD.
5. Link the spec path in the PR.

## Spec template

```md
# <Title>

## Status
Draft | Approved

## Issue
#123

## Summary
What changes and why (2–5 sentences).

## Scope
- In:
- Out:

## Behavior
Acceptance criteria as testable bullets.

## Data / API
Contracts, types, endpoints (if any).

## UI
Screens/states (if any). Link design-system notes.

## Risks
Edge cases, security, tenancy.

## Test plan
How we prove it works.
```

## Note on foundation docs

Branch `docs/fundacao-design` contains deeper Portuguese design artifacts (PRD, data model, flows). Treat them as product source material. Specs in this folder are the English, implementation-ready contracts agents execute against.
