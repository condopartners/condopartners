# Landing page pública — CondoPartners

## Status

Pronta para implementação (copy Marketing **final** em [SIS-23](https://paperclip.econdos.net); PR de spec revisável).

## Issue

- Spec: Paperclip [SIS-24](https://paperclip.econdos.net) / canônica [SIS-18](https://paperclip.econdos.net) (parent [SIS-16](https://paperclip.econdos.net), plano aceito: abordagem **A**).
- Copy fonte da verdade: [SIS-23](https://paperclip.econdos.net) documento `brief`.
- Implementação: [SIS-25](https://paperclip.econdos.net) / canônica [SIS-21](https://paperclip.econdos.net).
- QA: [SIS-27](https://paperclip.econdos.net) / canônica [SIS-22](https://paperclip.econdos.net).

## Resumo

Publicar uma **landing estática** de marketing para o SaaS de indicação CondoPartners, isolada do shell autenticado (`apps/web`), com deploy via **GitHub Pages**, craft **Impeccable** (mode Persuade) e motion **anime.js**.

A página comunica o problema (rede de parceiros e comissões em planilha), a promessa do produto (sistema multi-tenant para hierarquia, atribuição e comissões) e captura interesse via **waitlist (e-mail)** e **Fale conosco** — sem auth, sem API de produto e sem inventar features fora de [`docs/PRODUCT.md`](../PRODUCT.md) / [`docs/FEATURES.md`](../FEATURES.md).

**Nota de produto (obrigatória na LP):** app ainda sem parceiros/comissões no ar; LP = captura + posicionamento (waitlist/contato).

## Escopo

### Dentro

- Novo workspace **`apps/landing`** (`@condopartners/landing`): Vite + React alinhado ao monorepo + CSS/Tailwind leve, **sem** Eden/API.
- Conteúdo **pt-BR** colado do brief Marketing (SIS-23) — ver § Copy canônica.
- Hero **brand-first** + seções na ordem do brief.
- Motion com **anime.js**: entrada no load + ≥1 animação de scroll ou interação.
- Dual CTA:
  1. **Entrar na lista de espera** — captura de e-mail (UI + validação client-side).
  2. **Fale conosco** — `mailto:` ou formulário `#contato` (sem backend obrigatório).
- Testes mínimos (smoke de build + asserts de seções/CTA/copy-chave).
- Workflow **GitHub Pages** (`.github/workflows/pages.yml`) com `base` path correto (pode ser PR da implementação ou issue Pages dedicada).
- Integração no monorepo: scripts root; `bun run check` verde.

### Fora

- Auth, multi-tenant operacional, parceiros, comissões, catálogo, vendas, finanças (qualquer feature de [`FEATURES.md`](../FEATURES.md)).
- Chamadas à `apps/api` / Eden Treaty.
- Analytics pago, CRM, e-mail transacional em produção (waitlist front-only nesta fase — ver § Dados / API).
- White-label por tenant na LP (marca pública = **CondoPartners**).
- Merge do pack `docs/fundacao-design` (referência de domínio apenas).
- Alterar regras de comissão ou pricing.
- Claims proibidos: “já disponível”, “assine agora”, preços, SLAs, integrações financeiras prontas, números/logos de clientes sem autorização do board.

## Posicionamento (1 linha — Marketing)

**CondoPartners** é o sistema de indicação B2B para redes de parceiros que vendem em condomínios — com hierarquia, atribuição e comissões fora da planilha.

| Elemento | Conteúdo permitido |
|----------|-------------------|
| Quem | Operadores B2B de canal/indicação no segmento condominial; grupos multi-marca (ex.: Clique / eCondos) como tenants futuros. |
| Dor | Árvore sem sistema único; comissão em planilha; atribuição ambígua. |
| Promessa | Plataforma multi-tenant: hierarquia, regras configuráveis, indicação com dono, isolamento — **visão**; LP não afirma “já disponível em produção”. |
| Não prometer | Cascata completa live, RLS, anti-hardcoding, ecossistema cross-tenant live, stack Next/Supabase. |

## Copy canônica (colar — fonte SIS-23)

> Strings abaixo são **obrigatórias** na implementação salvo override explícito do board/Marketing. Não inventar headlines alternativas.

### Meta / SEO

| Campo | Valor |
|-------|-------|
| `<title>` / OG title | CondoPartners — Sistema de Indicação para redes de parceiros |
| meta description / OG description | Organize hierarquia, indicação e comissões para quem vende em condomínios. Entre na lista de espera do CondoPartners. |

### Nav mínima

- Logo texto: `CondoPartners`
- Links: `Como funciona` → `#como-funciona` · `Para quem` → `#para-quem` · `Lista de espera` → `#waitlist`
- CTA nav (opcional): `Entrar na lista` → `#waitlist`

### Hero (1º viewport — budget estrito Impeccable)

- **Marca (hero-level):** `CondoPartners`
- **Linha de marca (opcional, menor):** `Sistema de Indicação`
- **Headline:** Rede de parceiros e comissões — sem planilha.
- **Suporte:** CondoPartners organiza hierarquia, indicação e regras de comissão para empresas que vendem em condomínios — um sistema, vários tenants, dados isolados.
- **CTA primário:** Entrar na lista de espera → `#waitlist` (ou form inline no hero)
- **CTA secundário:** Fale conosco → `mailto:` operacional **ou** `#contato`
- **Visual dominante:** cena de produto/operação — **rede hierárquica de parceiros** (nós pai→filho) + **resumo de comissão por indicação**; atmosfera condominial B2B (fachada/entrada residencial suave no fundo). Full-bleed; **sem** card flutuante sobre a mídia; **sem** badges/chips/stats no hero.

### Microcopy waitlist

| Elemento | Texto |
|----------|-------|
| Label | Seu e-mail corporativo |
| Placeholder | nome@empresa.com.br |
| Submit | Quero acesso antecipado |
| Sucesso | Pronto. Avisamos você quando a vaga abrir. |
| Erro | Não foi possível enviar. Tente de novo em instantes. |

### Microcopy contato (se formulário, não só mailto)

| Elemento | Texto |
|----------|-------|
| Campos | Nome, Empresa, E-mail, Mensagem (opcional) |
| Submit | Enviar mensagem |
| Sucesso | Recebemos. Retornamos em breve. |

### Seção Problema — `#problema`

- **Headline:** Sua rede cresce. A planilha não acompanha.
- **Suporte:** Quando parceiro indica subparceiro, a comissão vira disputa: quem trouxe o cliente, qual regra vale, o que já pode pagar.
- **Bullets (máx. 3, lista limpa — não cards de hero):**
  1. Árvore de parceiros sem sistema único de registro
  2. Comissão (markup e/ou % da venda) calculada à mão e contestada
  3. Atribuição de indicação ambígua — conflito de canal entre times e parceiros

### Seção Solução — `#como-funciona`

- **Headline:** Um sistema de indicação para a operação inteira.
- **Suporte:** CondoPartners é a plataforma multi-tenant onde cada empresa (tenant) gerencia sua rede, seu catálogo e suas regras — com isolamento de dados e UI em português.
- **Pilares (coluna/fluxo; evitar “feature cards” genéricos se Impeccable puder):**

| # | Título | Frase |
|---|--------|-------|
| 1 | Rede hierárquica | Parceiros e subparceiros em árvore clara, pronta para crescer sem perder a conta. |
| 2 | Regras de comissão | Estratégias configuráveis (markup e/ou percentual da venda) por tenant — fora da planilha. |
| 3 | Indicação com dono | Atribuição explícita de quem trouxe o cliente, para reduzir conflito de canal. |

- **Disclaimer (obrigatório, discreto):** CondoPartners está em construção. Esta página é para lista de espera e conversa com early adopters — o produto operacional entra por etapas após a landing.

### Seção Para quem — `#para-quem`

- **Headline:** Feito para quem opera canal em condomínios.
- **Suporte:** Empresas que precisam do mesmo esqueleto operacional com regras, catálogo e marca diferentes — sem misturar dados entre tenants.
- **Audiências (1 linha cada):**
  - Operadores de rede de parceiros / indicação no segmento condominial
  - Times comerciais que pagam comissão só depois da confirmação de pagamento do cliente
  - Grupos multi-marca (ex.: ecossistema Clique / eCondos) que querem white-label sobre a mesma base
- **Fecho + echo CTA:** Menos planilha. Mais clareza na indicação. · [Entrar na lista de espera] · [Fale conosco]

### Objeções — `#duvidas` (3)

1. **Já existe um CRM / planilha que “funciona”.**  
   Funciona até a rede ramificar. CondoPartners nasce para hierarquia, atribuição e comissão como sistema de registro — não como mais uma aba no Excel.
2. **Vai servir só para armários / um produto?**  
   Não. O catálogo é do tenant: produtos e regras por item, sem hardcode de categoria.
3. **Preciso migrar tudo agora?**  
   Não. Entre na lista, converse conosco e entre quando a fatia do produto fizer sentido para a sua operação.

### Bloco final / waitlist — `#waitlist`

- **Headline:** Quer ser dos primeiros a operar indicação sem planilha?
- **Suporte:** Deixe o e-mail corporativo. Avisamos quando liberar acesso e conversamos se fizer sentido para o seu canal.
- **CTAs:** mesmos do hero.

### Rodapé

- Marca: `CondoPartners` — Sistema de Indicação
- Link: `condopartners.com.br` (quando Pages apontar)
- Nota: `© CondoPartners. Produto em desenvolvimento.`

## Comportamento (critérios de aceite)

1. **Hero (primeiro viewport)**
   - Marca **CondoPartners** é sinal hero-level (não só nav).
   - Exatamente: 1 headline, 1 suporte, 1 grupo de CTA, 1 visual dominante full-bleed.
   - Sem overlays flutuantes; sem stats/agendas/clutter no 1º viewport.
2. **Seções (ordem)**
   - `#problema` → `#como-funciona` → `#para-quem` → `#duvidas` → `#waitlist` (+ `#contato` se form).
3. **CTAs**
   - Waitlist: e-mail + botão; validação básica; feedback pt-BR (microcopy acima).
   - Fale conosco: visível no hero e no fecho.
4. **Motion (anime.js)**
   - Entrada no load (marca/headline e/ou rede em cascata).
   - ≥1 scroll-trigger ou interação.
   - `prefers-reduced-motion: reduce` desliga/reduz; conteúdo legível sem JS de animação.
5. **Responsivo** — usável ~375px e ~1280px+; CTAs tocáveis.
6. **A11y mínima** — headings, contraste, foco, labels, landmarks.
7. **Idioma** — UI pt-BR.
8. **Deploy** — build estático; Pages sem secrets de API; base path correto.
9. **Monorepo** — `bun run check` verde com `apps/landing`.

## Dados / API

| Concern | Decisão nesta fase |
|---------|-------------------|
| Waitlist submit | **Sem** endpoint em `apps/api`. Escolher a opção mais simples e documentar no PR: (A) confirmação local + stub; (B) `mailto:` pré-preenchido; (C) form action externo via env **pública** `VITE_WAITLIST_ENDPOINT` — sem secrets. |
| Fale conosco | `mailto:` (`VITE_CONTACT_EMAIL`) ou URL (`VITE_CONTACT_URL`). Defaults de dev em `.env.example` do landing (sem e-mails de clientes). |
| Persistência | Nenhuma tabela / migração. |

## UI / craft

- **Impeccable** mode **Persuade**; context local sob `apps/landing/` (ex. `DESIGN.md` de marketing) **sem** sobrescrever `docs/PRODUCT.md`.
- Evitar AI slop (roxo genérico, cream+terracotta default, glow, pills demais, cards no hero).
- Tipografia expressiva (não Inter/Roboto/Arial/system como face principal).
- Fundo com atmosfera real (produto/rede/condomínio), não flat único nem só gradiente abstrato.
- ≥2–3 motions intencionais (entrada + scroll/hover).

### Wire lógico

```
[Nav: CondoPartners + Como funciona · Para quem · Lista de espera]
[Hero: marca + headline + suporte + CTAs + visual full-bleed rede/comissão]
[#problema]
[#como-funciona + disclaimer em construção]
[#para-quem + echo CTA]
[#duvidas]
[#waitlist (+ #contato)]
[Footer]
```

## Arquitetura técnica

| Item | Escolha |
|------|---------|
| Package | `apps/landing` (`@condopartners/landing`) |
| Stack | Vite + React 19 alinhado ao monorepo; Tailwind leve OK |
| Dependência | `animejs` (v4) |
| Deploy | GitHub Actions → `upload-pages-artifact` + `deploy-pages` |
| Base path | `base: process.env.VITE_BASE_PATH ?? '/'` — project site tipicamente `/condopartners/`; documentar no workflow e README do app |
| Scripts root | `dev:landing`; incluir build/test no `bun run --filter '*'` |

### Notas GitHub Pages

1. Habilitar Pages **via GitHub Actions** no repo `condopartners/condopartners`.
2. Workflow: push em `main` (paths `apps/landing/**` + workflow) + `workflow_dispatch`.
3. Sem tokens de API; só assets estáticos.
4. Smoke pós-deploy: URL Pages carrega hero + CTAs (QA).

## Skills

| Skill | Uso |
|-------|-----|
| Impeccable | Craft da LP (Persuade); shape/new-work na implementação; craft-floor antes de editar UI |
| Superpowers (TDD / verification) | Testes mínimos + evidência antes de reivindicar done na implementação |
| Paperclip | Heartbeat / handoff QA e issues filhas |

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Base path quebra assets | `base` + CI/build; paths relativos |
| Motion atrapalha a11y | `prefers-reduced-motion` |
| Copy promete feature live | Copy canônica + disclaimer; claims guardrail SIS-23 §8 |
| Waitlist sem backend | Documentar opção A/B/C no PR; CEO/Marketing definem destino real depois |
| Cadeia duplicada SIS-18..22 vs SIS-24..27 | Mesma entrega; preferir fechar ambas as issues com o mesmo PR |

## Plano de teste

### Nesta entrega (spec)

- [x] Spec cobre hero, seções, motion, CTAs, Pages, fora de escopo e PRODUCT.md.
- [x] Copy final Marketing (SIS-23) embutida como canônica.
- [ ] Review humano / CODEOWNERS no PR `docs:`.

### Na implementação (SIS-25 / SIS-21)

1. Teste smoke/DOM: marca CondoPartners; seções `#problema`, `#como-funciona`, `#para-quem`, `#duvidas`, `#waitlist`; ambos CTAs; form e-mail; headline canônica presente.
2. `bun run --filter '@condopartners/landing' build` com `VITE_BASE_PATH=/condopartners/`.
3. `bun run check` no monorepo.
4. Manual: mobile + desktop; Tab order; reduced-motion.
5. QA: checklist visual + Pages URL.

## Success condition (esta issue de spec)

Arquivo `docs/specs/landing-page.md` no repo via PR revisável, com **copy Marketing final** e critérios da Fase 1 (abordagem A). Implementação **não** faz parte desta issue — segue em SIS-25 / SIS-21 após merge ou aceite de engenharia da spec.
