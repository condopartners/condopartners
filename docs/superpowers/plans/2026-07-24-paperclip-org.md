# Paperclip Org Bundles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Versionar no repo CondoPartners a company Paperclip Scaled (10 employees) com bundles `AGENTS` / `SOUL` / `HEARTBEAT` / `TOOLS` prontos para colar na UI.

**Architecture:** Pasta `paperclip/` é a fonte da verdade. `COMPANY.md` + `README.md` descrevem mission e hire order. Cada employee em `paperclip/employees/<role>/` referencia o `AGENTS.md` raiz e `docs/` sem duplicar regras longas. Conteúdo em pt-BR; paths em inglês.

**Tech Stack:** Markdown only (Paperclip instruction bundles). Spec: `docs/superpowers/specs/2026-07-24-paperclip-org-design.md`.

## Global Constraints

- Organograma C + Head of Design enxuto (sem Product Designer ainda)
- Prosa dos bundles: pt-BR
- Sem inventar features/tabelas de domínio
- Safety: issue+spec, TDD, `bun run check`, merge humano, money em cents
- Links relativos a partir de `paperclip/employees/<role>/` → `../../../AGENTS.md` etc.

---

### Task 1: Company shell

**Files:**
- Create: `paperclip/README.md`
- Create: `paperclip/COMPANY.md`

- [ ] **Step 1:** Criar `COMPANY.md` com mission, goal, organograma, board rules, link ao monorepo
- [ ] **Step 2:** Criar `README.md` com ordem de hire e como colar bundles no Instructions tab
- [ ] **Step 3:** Verificar que os dois arquivos existem

**Done when:** `paperclip/README.md` e `paperclip/COMPANY.md` existem e batem com a spec.

---

### Task 2: Engineering chain (CEO, CTO, DEV, QA)

**Files:**
- Create: `paperclip/employees/ceo/{AGENTS,SOUL,HEARTBEAT,TOOLS}.md`
- Create: `paperclip/employees/cto/{AGENTS,SOUL,HEARTBEAT,TOOLS}.md`
- Create: `paperclip/employees/dev/{AGENTS,SOUL,HEARTBEAT,TOOLS}.md`
- Create: `paperclip/employees/qa/{AGENTS,SOUL,HEARTBEAT,TOOLS}.md`

- [ ] **Step 1:** Bundle CEO (delega CTO/CMO/Design/COO; não code)
- [ ] **Step 2:** Bundle CTO (issue+spec; delega DEV/QA)
- [ ] **Step 3:** Bundle DEV (TDD, check, PR)
- [ ] **Step 4:** Bundle QA (aceite, bloqueio)
- [ ] **Step 5:** Conferir reports-to na árvore CEO→CTO→DEV/QA

**Done when:** 16 arquivos da cadeia de eng existem e referenciam docs do repo.

---

### Task 3: Growth + Design (CMO, Marketing, Head of Design)

**Files:**
- Create: `paperclip/employees/cmo/{AGENTS,SOUL,HEARTBEAT,TOOLS}.md`
- Create: `paperclip/employees/marketing/{AGENTS,SOUL,HEARTBEAT,TOOLS}.md`
- Create: `paperclip/employees/head-of-design/{AGENTS,SOUL,HEARTBEAT,TOOLS}.md`

- [ ] **Step 1:** Bundle CMO
- [ ] **Step 2:** Bundle Marketing (copy pt-BR; sem código)
- [ ] **Step 3:** Bundle Head of Design (pipeline Frontend Design → UI UX Pro Max → Impeccable → Web Design Guidelines → Astryx)

**Done when:** 12 arquivos existem; Design reporta ao CEO; Marketing ao CMO.

---

### Task 4: Ops staff (COO, Summarizer, Reflection Coach)

**Files:**
- Create: `paperclip/employees/coo/{AGENTS,SOUL,HEARTBEAT,TOOLS}.md`
- Create: `paperclip/employees/summarizer/{AGENTS,SOUL,HEARTBEAT,TOOLS}.md`
- Create: `paperclip/employees/reflection-coach/{AGENTS,SOUL,HEARTBEAT,TOOLS}.md`

- [ ] **Step 1:** Bundle COO
- [ ] **Step 2:** Bundle Summarizer
- [ ] **Step 3:** Bundle Reflection Coach

**Done when:** 12 arquivos existem; ambos ICs reportam ao COO.

---

### Task 5: Consistency check

**Files:**
- Verify: toda a árvore `paperclip/`

- [ ] **Step 1:** Contar 10 pastas × 4 arquivos = 40 + 2 shell = 42
- [ ] **Step 2:** Grep reports-to / organograma vs spec
- [ ] **Step 3:** Confirmar que nenhum bundle inventa schema/feature

**Done when:** estrutura e conteúdo alinhados à spec `2026-07-24-paperclip-org-design.md`.
