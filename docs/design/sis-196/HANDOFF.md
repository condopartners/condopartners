# Handoff de Design — Prompt PWA «nova versão disponível»

**Issue:** [SIS-196](/SIS/issues/SIS-196) · pai [SIS-194](/SIS/issues/SIS-194) · implementação [SIS-197](/SIS/issues/SIS-197)  
**Fundação:** `docs/design/sis-66/HANDOFF.md` (tokens, shell, PWA) · `docs/specs/auth-shell-pwa.md`  
**Papel:** Head of Design · **Data:** 2026-07-26  
**Pipeline:** Frontend Design → UI UX Pro Max → Impeccable (Operate / clarify+harden) → Web Interface Guidelines → Sistema (Astryx indisponível; registro local §7)

**Escopo:** copy pt-BR + UX do prompt. **Fora:** código de produção (CTO/DEV em [SIS-197](/SIS/issues/SIS-197)).

---

## 0. Contrato de direção

**Modo:** Operate — operador no meio de uma tarefa; o prompt não deve sequestrar o fluxo.  
**Público:** operadores B2B no web/PWA CondoPartners (desktop e mobile standalone).  
**Job único:** avisar que há versão nova e oferecer recarregar agora ou adiar.  
**Mundo herdado (SIS-66):** papel frio, tinta slate, azul-aço, Public Sans, raio 0.5rem, sombra máxima `0 1px 2px rgb(11 31 51 / 0.06)`. **Zero token novo.**  
**Assinatura desta fatia:** barra de ação persistente no rodapé (não modal, não toast que some sozinho) — tom de aviso operacional, não marketing.

### Anti-padrões proibidos

- Modal/dialog central que bloqueia o app só para “há update”
- Toast que auto-dismiss em 3–5s (Pro Max recomenda isso para info **não-crítica**; aqui a decisão do usuário é necessária → banner persistente até ação)
- Copy em inglês; “OK” / “Sim” / “Cancelar” genéricos
- Roxo / glow / glass / emoji como ícone
- Inventar changelog, número de versão ou “novidades” sem dado real
- `user-scalable=no`

---

## 1. Base visual (Frontend Design)

| Elemento | Decisão |
|----------|---------|
| Superfície | `--cp-surface` `#FFFFFF` + borda superior `--cp-border` |
| Texto | `--cp-ink` título; `--cp-muted` corpo |
| CTA primário | Botão filled `--cp-primary` / `--cp-primary-fg` |
| CTA secundário | Botão ghost/texto `--cp-ink` ou `--cp-muted` hover |
| Tipo | Public Sans: título 16px/600; corpo 14px/400; botões 14px/500 |
| Ícone (opcional) | Lucide `RefreshCw` 20px, `aria-hidden`, cor `--cp-accent` — não obrigatório |
| Motion | Entrada: `translateY(8px)` → 0 + opacity 150–200ms; `prefers-reduced-motion: reduce` → só opacity ou estático |
| Sombra | `0 1px 2px rgb(11 31 51 / 0.06)` no container; sem glow |

---

## 2. Planejamento UX (UI UX Pro Max)

### Padrão escolhido: **barra de ação no rodapé** (persistent action banner)

| Alternativa | Por que não |
|-------------|-------------|
| Modal | Interrompe tarefa sem necessidade; update pode esperar segundos |
| Toast auto-dismiss | Some antes da decisão; viola necessidade de ação |
| Top bar | Conflita com header sticky / drawer mobile do shell |

### Wireframes

**Desktop (≥1024px)**

```
┌────────────────────────────────────────────────────────────┐
│  Sidebar │  Header …                                       │
│          │  Main (trabalho do operador continua)           │
│          │                                                 │
│          │                                                 │
├──────────┴─────────────────────────────────────────────────┤
│  ↻  Nova versão disponível                    [Agora não]  │
│     Há uma atualização do CondoPartners.      [Atualizar   │
│     Atualize para usar a versão mais recente.   agora]     │
└────────────────────────────────────────────────────────────┘
  fixed bottom, full viewport width, padding 16px 24px,
  + env(safe-area-inset-bottom); z-index acima do main,
  abaixo de overlays futuros de dialog
```

**Mobile (<1024px)**

```
┌──────────────────────────┐
│ Top bar / conteúdo       │
│                          │
│                          │
├──────────────────────────┤
│ Nova versão disponível   │
│ Há uma atualização…      │
│ [Agora não] [Atualizar   │
│              agora]      │
└──────────────────────────┘
  CTAs em linha (secundário à esquerda, primário à direita);
  alvos ≥44×44px; safe-area
```

### Hierarquia

1. Título (fato)  
2. Uma frase de apoio (consequência)  
3. Primário: atualizar  
4. Secundário: adiar  

Sem lista de mudanças. Sem “saber mais”.

### Quando mostrar

- Disparar quando o service worker detectar build novo pronto para ativar (`needRefresh` / waiting worker).
- Mostrar em **qualquer rota** (auth e shell) — o SW afeta o app inteiro.
- Não empilhar múltiplos banners; um só.

### Quando não mostrar

- Se o usuário acabou de dismissar nesta sessão (ver §5).
- Se já está no estado “atualizando”.

---

## 3. Copy pt-BR (Impeccable clarify)

### Recomendada (usar esta)

| Slot | Texto |
|------|-------|
| Título | Nova versão disponível |
| Corpo | Há uma atualização do CondoPartners. Atualize para usar a versão mais recente. |
| Primário | Atualizar agora |
| Secundário | Agora não |
| Atualizando (botão / status) | Atualizando… |
| Falha | Não foi possível atualizar. Tente de novo. |
| `aria-label` da região | Aviso de atualização do aplicativo |

### Alternativa (se board preferir tom mais curto)

| Slot | Texto |
|------|-------|
| Título | Atualização disponível |
| Corpo | Existem atualizações. Atualize o app para continuar. |
| Primário | Atualizar |
| Secundário | Depois |
| Atualizando | Atualizando… |
| Falha | Não foi possível atualizar. Tente de novo. |

**Tom:** factual, ativo, sem desculpas, sem hype. Sentence case (padrão produto pt-BR; prevalece sobre Title Case das Web Interface Guidelines em inglês).

---

## 4. Estados

| Estado | UI | Interação |
|--------|----|-----------|
| **Disponível** | Banner visível; primário + secundário ativos | Primário → atualizando; secundário → dismiss |
| **Atualizando** | Primário com spinner + label “Atualizando…”; ambos CTAs `disabled` | Aguarda `updateServiceWorker` + reload |
| **Falha** | Mesmo banner; texto de falha substitui o corpo (ou abaixo); primário volta a “Atualizar agora” | Retry; secundário ainda dismiss |
| **Dismissed (sessão)** | Banner oculto | Não reaparece até novo ciclo de detecção após reload/nova sessão (ver eng) |

Não há estado “sucesso” separado — o sucesso é o reload da página nova.

---

## 5. Notas para engenharia ([SIS-197](/SIS/issues/SIS-197))

### Disparo

1. Hoje: `vite-plugin-pwa` com `registerType: "autoUpdate"` (silencioso) em `apps/web/vite.config.ts`.  
2. Mudar para **`registerType: "prompt"`** (ou equivalente) e UI que consome `needRefresh` / `updateServiceWorker` (ex.: `virtual:pwa-register/react`).  
3. Quando `needRefresh === true` → montar o banner.

### Aceitar (“Atualizar agora”)

1. Entrar em estado **Atualizando**.  
2. Chamar `updateServiceWorker(true)` (ou skipWaiting + claim conforme API do plugin).  
3. **Reload completo** da página (`location.reload()` após apply — o plugin costuma fazer isso).  
4. Não navegar para outra rota; preservar URL atual no reload.

### Rejeitar (“Agora não”)

1. Esconder o banner.  
2. Persistir dismiss **só na sessão** (`sessionStorage` key sugerida: `cp.pwaUpdate.dismissed`).  
3. Não chamar update. App continua na versão em cache até o próximo ciclo.  
4. Reexibir se, **após novo page load** (nova sessão de aba) ou limpeza da flag, `needRefresh` ainda for true.  
5. Opcional (não obrigatório neste handoff): re-prompt após N minutos na mesma sessão — **não** implementar sem necessidade; sessão basta.

### Falha

- Se `updateServiceWorker` rejeitar / timeout razoável (~15s): estado **Falha** + retry.  
- Não deixar botão preso em loading infinito.

### A11y

- Container: `role="status"` + `aria-live="polite"` (não `assertive` — não interromper leitor no meio da tarefa).  
- Não roubar foco ao aparecer.  
- Botões: `<button>`, labels visíveis (não icon-only sem `aria-label`).  
- Focus ring: `focus-visible` com `--cp-primary`.  
- `touch-action: manipulation` nos CTAs.  
- Respeitar `prefers-reduced-motion`.

### Layout / CLS

- Reservar espaço ou overlayar o rodapé com `position: fixed` (preferido: fixed, sem empurrar layout do main — evita CLS).  
- Padding bottom do main **não** é obrigatório se o banner for overlay curto; garantir que CTAs flutuantes da página (se houver) não fiquem cobertos — hoje o shell não tem FAB.

### Dependências

- Reusar `Button` shadcn existente (`apps/web/src/components/ui/button.tsx`).  
- **Não** adicionar sonner/toast library só para isto.  
- Componente sugerido: `AppUpdateBanner` montado no root (ex. ao lado do router), fora do AppShell para cobrir auth também.

---

## 6. Auditoria Web Interface Guidelines

Checklist aplicado ao handoff (sem código ainda):

| Regra | Status |
|-------|--------|
| Async update com `aria-live` | Spec: `polite` |
| Botões = `<button>`, labels específicos | “Atualizar agora” / “Agora não” |
| Focus visível | `focus-visible` + token primary |
| Loading termina com `…` | “Atualizando…” |
| `prefers-reduced-motion` | Spec §1 |
| Safe-area | Spec wireframe mobile |
| Sem `user-scalable=no` | Mantido |
| Title Case EN vs sentence case pt-BR | **Produto pt-BR vence** (sentence case) |
| Toast auto-dismiss | **Intencionalmente não** — ver §0 |

Nenhum achado bloqueante no desenho. DEV deve revalidar no PR contra as mesmas regras.

---

## 7. Sistema (fase Astryx — skill ausente)

Registro local até Astryx existir na company library:

| Padrão | Nome | Reuso |
|--------|------|-------|
| Barra de ação persistente no rodapé | `AppUpdateBanner` (único uso previsto agora) | Futuros avisos operacionais “ação necessária, não bloqueante” podem copiar estrutura; **não** generalizar lib ainda |
| Tokens | Somente SIS-66 `--cp-*` | Zero token novo |
| Botões | shadcn `Button` primary + ghost | Já no design system do app |
| Copy keys (se i18n surgir) | `pwaUpdate.*` | Hoje: strings literais pt-BR no componente |

**Decisão de sistema:** um componente de feature, não um primitivo genérico de “Snackbar” — YAGNI até o segundo uso.

---

## 8. Critérios de aceite (Design)

1. ✅ Copy final recomendada + 1 alternativa (§3)  
2. ✅ Spec visual mínima: placement, hierarquia, CTAs (§1–2)  
3. ✅ Notas eng: disparo, aceitar→reload, rejeitar→session dismiss, falha (§5)  
4. ✅ Handoff linkado na issue  

---

## 9. Handoff → CTO / DEV

Pronto para build em [SIS-197](/SIS/issues/SIS-197).

**Ordem sugerida:** testes do registrador PWA (prompt + needRefresh) → UI do banner com 3 estados → a11y smoke → trocar `autoUpdate` → `prompt` no mesmo PR.
