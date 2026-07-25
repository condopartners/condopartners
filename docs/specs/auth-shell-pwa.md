# Shell SaaS autenticado + PWA

## Status

Aprovada

## Issue

- GitHub: [condopartners#16](https://github.com/condopartners/condopartners/issues/16)
- Paperclip: [SIS-65](/SIS/issues/SIS-65) · [SIS-68](/SIS/issues/SIS-68) (eng) · [SIS-74](/SIS/issues/SIS-74) (DEV)
- Design handoff: [SIS-66](/SIS/issues/SIS-66) · `docs/design/sis-66/HANDOFF.md`
- Fundação (pré-requisito): [condopartners#14](https://github.com/condopartners/condopartners/issues/14) · `docs/specs/auth-better-auth.md` · [PR #15](https://github.com/condopartners/condopartners/pull/15)

## Resumo

Aplicar o handoff de Design no app web autenticado: telas de login/cadastro com **AuthLayout**
(placa de portaria), **AppShell** logado (sidebar desktop / drawer mobile) e **PWA** básica
(manifest + service worker + ícones + theme-color). Reutiliza a fundação Better Auth já entregue;
não altera contratos de API de auth.

## Escopo

- Dentro:
  - Tokens e tipografia Public Sans conforme handoff §1 (`apps/web/src/index.css` + font load).
  - `AuthLayout` split (rail ink + form) em desktop; marca compacta no topo em mobile.
  - Forms de auth pt-BR sobre o client Better Auth existente (copy da tabela em
    `docs/specs/auth-better-auth.md` § UI — não divergir).
  - Shell logado: sidebar 240px com item **Início** apenas; header com e-mail truncável + **Sair**;
    home placeholder sem métricas fake.
  - Drawer mobile (<1024px) com `prefers-reduced-motion`.
  - Skip link “Ir para o conteúdo”; focus-visible; labels clicáveis; loading de submit; erro genérico
    com `role="alert"` / `aria-live`.
  - PWA: `vite-plugin-pwa` (ou equivalente), manifest (`name`/`short_name` CondoPartners,
    `lang: pt-BR`, `display: standalone`, `start_url: /`), ícones 192/512,
    `theme-color` e `background_color` `#0B1F33`.
  - Copiar `docs/design/sis-66/icons/icon-{192,512}.png` → `apps/web/public/icons/`
    (não bundlear `icon-master.png`).
  - Commitar artefatos de handoff em `docs/design/sis-66/` se ainda não estiverem no repo.
  - Checklist visual vs handoff §7–8 no corpo do PR.
- Fora:
  - Mudanças de API/schema Better Auth (já na fundação).
  - OAuth, verificação obrigatória de e-mail, reset por e-mail.
  - RBAC, roles, convites, multi-tenant.
  - Nav de domínio inventada (Partners, Comissões…).
  - Push notifications, landing marketing.
  - Merge de PRs (humano/CODEOWNERS).

## Comportamento

1. Visitante vê login/cadastro com AuthLayout; copy pt-BR idêntica à spec de fundação.
2. Após sessão válida, shell com **Início**, e-mail do usuário e **Sair**; home com
   **Bem-vindo ao CondoPartners** + frase secundária do handoff.
3. Em ~375px: marca compacta na auth; drawer no shell; sem scroll horizontal crítico.
4. Em ≥1024px: rail de marca (~40–44%) na auth; sidebar fixa 240px no shell.
5. Submit mostra loading no botão; falha de auth mostra erro genérico acessível.
6. Build/preview: PWA instalável com ícones 192/512 e theme-color `#0B1F33`; zoom não bloqueado.
7. `prefers-reduced-motion: reduce` remove slide do drawer.
8. Sem purple/glass/AI-slop; sem cards/métricas fake.

## Dados / API

Nenhum endpoint novo. Consome `/api/auth/*` da fundação. Env inalterado
(`.env.example` da fatia anterior).

## UI

Fonte de verdade visual: `docs/design/sis-66/HANDOFF.md` (§1 tokens, §2 shell, §3 auth, §6–8 PWA/aceite).

Mapa de arquivos (handoff §9):

| Entrega | Alvo |
|---------|------|
| Tokens | `apps/web/src/index.css` |
| Font | `index.html` ou CSS `@import` |
| AuthLayout | `apps/web/src/components/layout/auth-layout.tsx` |
| Forms | `apps/web/src/components/auth/*` |
| AppShell / Sidebar / Header | `apps/web/src/components/layout/*` |
| Ícones PWA | `apps/web/public/icons/` |
| theme-color / manifest | `index.html` + plugin PWA |

## Riscos

- **Sobreposição com PR #15** — trabalhar em branch a partir de `feat/auth-better-auth-foundation`
  (ou reabrir fatia no mesmo PR só se o revisor pedir); não reverter wiring de auth.
- **Assets untracked** — garantir que `docs/design/sis-66/` e ícones públicos entrem no PR.
- **Acessibilidade PWA standalone** — safe-area insets; não usar `user-scalable=no`.
- **Escopo visual** — não inventar nav de produto além de **Início**.

## Plano de teste

1. `bun run check` verde.
2. Smoke web: cadastro → shell home → Sair → login; 375px e desktop.
3. Smoke PWA: `bun run build` + preview; manifest/ícones/theme-color presentes.
4. Checklist handoff §7–8 anexado ao PR (marcar itens cumpridos).
5. Não regressar testes API de auth da fundação.
