# Paperclip — CondoPartners

Bundles de instrução para montar a company autônoma no [Paperclip](https://docs.paperclip.ing/guides/org/org-structure/).

Cada pasta em `employees/<role>/` tem o quarteto recomendado:

| Arquivo | Função |
|---------|--------|
| `AGENTS.md` | Entry file — o que o agente faz |
| `SOUL.md` | Persona / como pensa |
| `HEARTBEAT.md` | Checklist mecânico a cada wake |
| `TOOLS.md` | Toolbox e notas de uso |

## Ordem de hire

1. **CEO** (primeiro agente — obrigatório)
2. Managers: **CTO**, **CMO**, **Head of Design**, **COO** (Reports to: CEO)
3. ICs:
   - DEV, QA → Reports to: **CTO**
   - Marketing → Reports to: **CMO**
   - Summarizer, Reflection Coach → Reports to: **COO**

Head of Design fica sem reports no início (executa UI/UX sozinho).

## Como colar no Paperclip

Para cada agente:

1. **Agents** → criar (ou abrir) o agente
2. Aba **Instructions**
3. Garantir entry file = `AGENTS.md`
4. Criar/colar `SOUL.md`, `HEARTBEAT.md`, `TOOLS.md` com o conteúdo desta pasta
5. Em `AGENTS.md`, manter a seção **References** apontando para os outros três
6. Aba **Configuration** → **Reports to** igual ao organograma em `COMPANY.md`
7. Aba **Skills** → marcar skills listadas no `TOOLS.md` do papel
8. **Run Heartbeat** para validar

Adapters (Claude / Cursor / Codex / etc.) ficam a critério do board — este repo não fixa o runtime.

## Conteúdo relacionado

- [`COMPANY.md`](./COMPANY.md) — mission, goals, organograma
- [`../AGENTS.md`](../AGENTS.md) — manual técnico do monorepo
- Spec: [`../docs/superpowers/specs/2026-07-24-paperclip-org-design.md`](../docs/superpowers/specs/2026-07-24-paperclip-org-design.md)
