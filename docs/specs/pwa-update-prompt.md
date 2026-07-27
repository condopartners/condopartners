# Prompt PWA «nova versão disponível»

## Status

Aprovada (eng) — handoff Design done em [SIS-196](/SIS/issues/SIS-196)

## Issue

- Paperclip: [SIS-197](/SIS/issues/SIS-197) (orquestração CTO) · [SIS-203](/SIS/issues/SIS-203) (DEV)
- Pai: [SIS-194](/SIS/issues/SIS-194)
- Design: [SIS-196](/SIS/issues/SIS-196) · `docs/design/sis-196/HANDOFF.md`
- Fundação PWA: `docs/specs/auth-shell-pwa.md` · `docs/design/sis-66/HANDOFF.md`

## Resumo

Trocar o update silencioso do service worker (`registerType: "autoUpdate"`) por um prompt
explícito: barra de ação fixa no rodapé quando houver build novo pronto para ativar.
Copy e UX vêm do handoff SIS-196; sem inventar changelog nem tokens novos.

## Escopo

- Dentro:
  - `apps/web/vite.config.ts`: `registerType: "autoUpdate"` → `"prompt"`.
  - Registrar SW via API de prompt do `vite-plugin-pwa` (ex. `virtual:pwa-register/react`).
  - Componente `AppUpdateBanner` no root (cobre auth + shell), estados: disponível /
    atualizando / falha / dismissed (sessão).
  - Copy recomendada do handoff (§3); CTAs «Atualizar agora» / «Agora não».
  - Aceitar → `updateServiceWorker` + reload; rejeitar → `sessionStorage` dismiss.
  - A11y: `role="status"`, `aria-live="polite"`, sem roubar foco; `prefers-reduced-motion`.
  - Testes TDD do comportamento (disparo, dismiss, falha/timeout).
  - Incluir no PR o handoff `docs/design/sis-196/HANDOFF.md` se ainda não estiver no branch.
- Fora:
  - CD / deploy contínuo ([SIS-195](/SIS/issues/SIS-195)).
  - Toast/modal/sonner; libs novas só para isto.
  - Changelog, número de versão, re-prompt por timer na mesma sessão.
  - Tokens CSS novos; push notifications.
  - Merge de PRs (humano/CODEOWNERS).

## Comportamento

1. Quando o SW detectar build novo (`needRefresh` / waiting worker), o banner aparece em
   qualquer rota (auth e shell), uma única instância.
2. Primário «Atualizar agora» → estado atualizando (CTAs disabled) → aplica SW → reload
   preservando a URL atual.
3. Secundário «Agora não» → esconde o banner e grava dismiss em `sessionStorage`
   (`cp.pwaUpdate.dismissed`); não chama update.
4. Após dismiss na sessão, o banner não reaparece até novo page load / nova sessão de aba
   (com `needRefresh` ainda true).
5. Se `updateServiceWorker` falhar ou exceder ~15s → estado falha com copy do handoff;
   retry reativa o primário; secundário continua dismiss.
6. Sucesso não tem UI própria — o reload carrega a versão nova.
7. Layout: `position: fixed` no rodapé, safe-area, z-index acima do main; tokens `--cp-*`
   existentes; botões shadcn `Button`.

## Dados / API

Nenhum endpoint novo. Só client web + service worker gerado pelo plugin.

## UI

Fonte de verdade: `docs/design/sis-196/HANDOFF.md` (§1–5).

| Slot | Copy (recomendada) |
|------|--------------------|
| Título | Nova versão disponível |
| Corpo | Há uma atualização do CondoPartners. Atualize para usar a versão mais recente. |
| Primário | Atualizar agora |
| Secundário | Agora não |
| Atualizando | Atualizando… |
| Falha | Não foi possível atualizar. Tente de novo. |
| `aria-label` da região | Aviso de atualização do aplicativo |

## Riscos

- **Regressão PWA** — garantir que `prompt` ainda registra SW em build/preview.
- **CLS / cobertura** — banner fixed não deve esconder CTAs críticos (hoje sem FAB).
- **Loop de update** — dismiss e estados devem impedir reentrância / loading infinito.
- **Ambiente sem SW** — em dev sem PWA, banner não deve quebrar o app.

## Plano de teste

1. Testes unitários/componentes: needRefresh→visível; dismiss→sessionStorage; falha→retry.
2. `bun run check` verde.
3. Smoke: `bun run build` + preview; simular waiting worker / fluxo do plugin.
4. Checklist a11y do handoff §6 no PR.
5. QA: aceite visual + regressão shell/auth após PR.
