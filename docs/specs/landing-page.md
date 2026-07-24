# Landing page pública — CondoPartners

## Status

Rascunho (pronta para review de engenharia / CODEOWNERS)

## Issue

Paperclip [SIS-18](https://paperclip.econdos.net) / parent [SIS-16](https://paperclip.econdos.net) (plano aceito: abordagem A).  
GitHub: abrir PR `docs:` apontando para esta spec; implementação em issue/PR separada.

## Resumo

Publicar uma **landing estática** de marketing para o SaaS de indicação CondoPartners, isolada do shell autenticado (`apps/web`), com deploy via **GitHub Pages**, craft Impeccable e motion **anime.js**.

A página comunica o problema (rede de parceiros e comissões em planilha), a promessa do produto (sistema de registro compartilhado para hierarquia, atribuição e comissões), e captura interesse via **waitlist (e-mail)** e **“Fale conosco”** — sem auth, sem API de produto e sem inventar features fora do roadmap em [`docs/PRODUCT.md`](../PRODUCT.md) / [`docs/FEATURES.md`](../FEATURES.md).

## Escopo

### Dentro

- Novo workspace **`apps/landing`** (Vite + React estático, ou Vite vanilla se o time preferir o mínimo — default recomendado: React + Vite + CSS/Tailwind leve, **sem** Eden/API).
- Conteúdo **pt-BR**.
- Hero **brand-first** + seções mínimas (problema → solução → como funciona → CTA).
- Motion com **anime.js**: entrada no load + pelo menos uma animação ligada a scroll ou interação.
- Dual CTA padrão (até Marketing finalizar copy em SIS-19 / SIS-23):
  1. **Waitlist** — captura de e-mail (UI + validação client-side).
  2. **Fale conosco** — mailto ou link externo configurável (sem backend obrigatório nesta fase).
- Testes mínimos (smoke de build + asserts de seções/CTA).
- Workflow **GitHub Pages** (`.github/workflows/pages.yml`) com `base` path correto para o repo.
- Integração no monorepo: scripts/`package.json` workspace; `bun run check` continua verde.

### Fora

- Auth, multi-tenant, parceiros, comissões, catálogo, vendas, finanças (qualquer feature de [`FEATURES.md`](../FEATURES.md)).
- Chamadas à `apps/api` / Eden Treaty.
- Analytics pago, CRM, e-mail transacional em produção (waitlist pode ser **front-only** nesta fase: `mailto:`, Formspree/similar, ou stub que valida e mostra confirmação local — ver § Dados / API).
- White-label por tenant na LP (a marca pública é **CondoPartners**).
- Merge do pack `docs/fundacao-design` (referência de domínio apenas).
- Alterar regras de comissão ou pricing.

## Posicionamento (alinhado ao produto)

| Elemento | Conteúdo permitido |
|----------|-------------------|
| Quem | Operadores B2B que gerenciam **redes hierárquicas de parceiros** vendendo em condomínios/imóveis (ex.: Clique Retire, eCondos como tenants futuros). |
| Dor | Árvore de parceiros sem sistema de registro; comissão em planilha; disputa de atribuição. |
| Promessa | Plataforma multi-tenant para hierarquia, regras de comissão configuráveis, atribuição de venda e liberação pós-pagamento — **visão**; MVP da LP não afirma “já disponível em produção”. |
| Não prometer | Cascata completa, RLS, anti-harding, ecossistema cross-tenant, troca de stack Next/Supabase. |

Copy **final** é ownership de Marketing. Esta spec define estrutura, intents e placeholders aceitáveis.

## Comportamento (critérios de aceite)

1. **Hero (primeiro viewport)**
   - Marca **CondoPartners** é sinal hero-level (não só nav).
   - Exatamente: 1 headline, 1 frase de suporte, 1 grupo de CTA, 1 visual dominante (full-bleed / edge-to-edge; sem cards no hero).
   - Sem overlays flutuantes (badges, chips, stickers) sobre o visual.
   - Sem stats, agendas, endereços ou blocos secundários no primeiro viewport.
2. **Seções abaixo do hero (ordem)**
   - **Problema** — dor da rede/comissão em planilha.
   - **Solução** — o que CondoPartners oferece (visão alinhada a PRODUCT.md).
   - **Como funciona** — 3 passos curtos (ex.: cadastre a rede → registre vendas → libere comissões após pagamento).
   - **CTA final** — reforço dos mesmos CTAs do hero.
3. **CTAs**
   - Waitlist: campo e-mail + botão; validação básica (`required`, formato e-mail); feedback de sucesso/erro em pt-BR.
   - “Fale conosco”: link/botão visível no grupo de CTA (hero e seção final).
4. **Motion (anime.js)**
   - Animação de entrada (hero e/ou seções) no load.
   - Pelo menos 1 interação ou scroll-trigger.
   - Motion **não bloqueia** uso: `prefers-reduced-motion: reduce` desliga ou reduz drasticamente; conteúdo legível sem JS de animação.
5. **Responsivo**
   - Layout usável em mobile (~375px) e desktop (~1280px+); tipografia e CTA tocáveis.
6. **A11y mínima**
   - Hierarquia de headings; contraste adequado; foco visível; labels em formulários; landmarks básicos.
7. **Idioma**
   - Toda copy de UI em **pt-BR**.
8. **Deploy**
   - Build estático; Pages publica sem secrets de API; asset paths corretos com base path do Pages.
9. **Qualidade monorepo**
   - `bun run check` verde após incluir `apps/landing`.

## Dados / API

| Concern | Decisão nesta fase |
|---------|-------------------|
| Waitlist submit | **Sem** endpoint em `apps/api`. Opções permitidas (escolher a mais simples na implementação e documentar no PR): (A) confirmação local + `console`/stub; (B) `mailto:` com body pré-preenchido; (C) form action externo (ex. Formspree) via env **pública** `VITE_WAITLIST_ENDPOINT` — sem secrets. |
| Fale conosco | `mailto:` configurável (`VITE_CONTACT_EMAIL`) ou URL externa (`VITE_CONTACT_URL`). Default de desenvolvimento documentado em `.env.example` do landing (sem e-mails reais de clientes). |
| Persistência | Nenhuma tabela / migração. |

## UI

### Craft

- Seguir **Impeccable** (mode **Persuade**): design context dedicado sob `apps/landing/` (ex. `PRODUCT.md` / `DESIGN.md` de marketing) **sem** sobrescrever `docs/PRODUCT.md` do monorepo.
- Evitar “AI slop” (roxo genérico, cream+terracotta default, glow excessivo, pills demais, cards no hero) — ver regras de frontend design do time.
- Tipografia expressiva (não Inter/Roboto/Arial/system como face principal).
- Fundo com atmosfera (gradiente/padrão/imagem), não flat único.
- Pelo menos 2–3 motions intencionais (entrada + scroll/hover), não ruído.

### Estrutura de página (wire lógico)

```
[Nav mínima: logo CondoPartners]
[Hero: marca + headline + suporte + CTAs + visual full-bleed]
[Problema]
[Solução]
[Como funciona — 3 passos]
[CTA final + waitlist]
[Footer: marca + link contato + nota “em construção” se útil]
```

### Copy placeholder (até Marketing)

Usar textos provisórios claros; substituíveis sem mudar estrutura:

- Headline (ex.): “Indicação e comissão sem planilha.”
- Suporte (ex.): “CondoPartners organiza a rede de parceiros, a atribuição da venda e as regras de comissão — num só sistema.”
- CTA primário: “Entrar na lista de espera”
- CTA secundário: “Fale conosco”

Marketing pode trocar strings; não deve exigir reescrita de arquitetura.

## Arquitetura técnica

| Item | Escolha |
|------|---------|
| Package | `apps/landing` (`@condopartners/landing`) |
| Stack | Vite; React 19 alinhado ao monorepo **ou** HTML+TS mínimo — preferir React se reutilizar padrões de teste/Tailwind do repo |
| Dependência | `animejs` (v4) |
| Deploy | GitHub Actions → `actions/upload-pages-artifact` + `actions/deploy-pages` |
| Base path | `base: process.env.VITE_BASE_PATH ?? '/'` — em Pages project site tipicamente `/condopartners/` (nome do repo); documentar no workflow e README do app |
| Scripts root | `dev:landing`, incluir build/test no `bun run --filter '*'` existente |

### Notas GitHub Pages

1. Habilitar Pages **via GitHub Actions** no repo `condopartners/condopartners`.
2. Workflow dispara em push em `main` (paths `apps/landing/**` + workflow) e `workflow_dispatch`.
3. Não embutir tokens de API; só assets estáticos.
4. Smoke pós-deploy: URL Pages carrega hero + CTAs (QA).

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Base path quebra CSS/JS/imagens | Configurar `base` + checagem no CI/build; testar path relativo |
| Motion atrapalha a11y | Respeitar `prefers-reduced-motion` |
| Copy promete feature inexistente | Spec + Marketing; placeholders honestos (“lista de espera”, “em construção”) |
| Waitlist sem backend vira dead-end | Documentar opção escolhida; Marketing/CEO definem destino real depois |
| Diffs locais de infra (porta 5433) misturados | PR da spec **só** docs; implementação em PR separado |

## Plano de teste

### Nesta entrega (spec)

- [x] Spec cobre hero, seções, motion, CTAs, Pages, fora de escopo e alinhamento PRODUCT.md.
- [ ] Review humano / CODEOWNERS no PR `docs:`.

### Na implementação ([SIS-21](https://paperclip.econdos.net) / SIS-25)

1. Teste unitário/smoke: render (ou DOM) contém marca CondoPartners, seções nomeadas, ambos CTAs, form de e-mail.
2. `bun run --filter '@condopartners/landing' build` sucesso com `VITE_BASE_PATH=/condopartners/`.
3. `bun run check` no monorepo.
4. Manual: mobile + desktop; Tab order; reduced-motion.
5. QA (SIS-22 / SIS-27): checklist visual + Pages URL.

## Success condition (esta issue)

Arquivo `docs/specs/landing-page.md` no repo via PR revisável, cobrindo os critérios da Fase 1 do plano SIS-16 (abordagem A). Implementação **não** faz parte desta issue.
