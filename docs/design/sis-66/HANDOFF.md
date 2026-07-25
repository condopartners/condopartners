# Handoff de Design — Shell SaaS B2B + Auth + PWA

**Issue:** SIS-66 (filho de SIS-65)  
**Papel:** Head of Design  
**Data:** 2026-07-25  
**Pipeline:** Frontend Design → UI UX Pro Max → Impeccable → Web Design Guidelines → Sistema (Astryx indisponível; tokens/padrões registrados aqui)

---

## 0. Contrato de direção (Impeccable / Frontend Design)

**Modo:** Operate (auth + shell de produto — não landing).  
**Público:** operadores B2B (gestão de rede de partners / comissões) em pt-BR.  
**Job único desta fatia:** entrar ou criar conta → chegar ao shell logado com clareza imediata.

**THESIS:** o produto parece um **painel de portaria + quadro de rede** — precisão arquitetônica e confiança operacional; recusa o “dashboard AI genérico” (roxo, glass, bento decorativo, hero com stats).  
**OWN-WORLD:** fundo papel frio, tinta slate profundo, CTA azul-aço, acento teal de serviço predial, tipografia workhorse (Public Sans), assinatura = **placa vertical de marca** na auth (faixa estreita com wordmark).  
**STORY:** operador abre o app → reconhece CondoPartners → autentica em poucos campos → vê shell óbvio (nav + conteúdo + usuário + Sair).  
**FIRST VIEWPORT (auth desktop):** esquerda = painel de marca (~40–44% largura); direita = formulário centrado verticalmente. Mobile: marca compacta no topo, form em seguida.  
**FORM:** “Placa de portaria” (world) + split-auth com rail de marca (staging).

### Anti-padrões (proibidos nesta fatia)

- Roxo / pink / neon / glow / glassmorphism  
- Cream #F4F1EA + serif display + terracotta  
- Cards decorativos no hero de auth; badges flutuantes  
- Placeholder-only labels; botões sem feedback de loading  
- `user-scalable=no` / zoom desabilitado  
- Inventar nav de domínio (Partners, Comissões…) além do placeholder desta fatia

---

## 1. Direção visual

| Token | Valor | Uso |
|-------|-------|-----|
| `--cp-ink` | `#0B1F33` | Texto principal, ícone PWA bg, chrome escuro |
| `--cp-paper` | `#F3F5F8` | Fundo app (não branco puro) |
| `--cp-surface` | `#FFFFFF` | Forms, sidebar, cards de conteúdo |
| `--cp-primary` | `#1B4F8A` | Botão primário, links ativos, focus ring |
| `--cp-primary-fg` | `#F8FAFC` | Texto sobre primary |
| `--cp-accent` | `#0F766E` | Destaque secundário (marca / estado ativo nav) |
| `--cp-muted` | `#5B6B7C` | Labels secundários, hints |
| `--cp-border` | `#D5DCE6` | Bordas 1px |
| `--cp-danger` | `#B42318` | Erros de formulário |
| `--cp-success` | `#1F7A4C` | Sucesso (raro nesta fatia) |
| `theme-color` / splash | `#0B1F33` | PWA / meta |
| `background_color` | `#0B1F33` | Splash instalado |

**Tipografia**

- UI / body: **Public Sans** (400/500/600/700), `font-display: swap`  
- Dados (e-mail truncado, timestamps futuros): tabular via `font-variant-numeric: tabular-nums` (mesma família)  
- Escala: body 16px / 1.5; label 14px / 500; título auth `text-2xl`–`text-3xl` 600; brand wordmark `text-xl` 700 tracking-tight  
- **Não** usar Inter / Calistoga / Space Grotesk como display

**Raio / sombra**

- Controles: `0.5rem` (alinha ao `--radius` shadcn existente ~0.625rem — preferir **0.5rem** para placa mais “arquitetônica”)  
- Sombra: no máximo `0 1px 2px rgb(11 31 51 / 0.06)` em form surface; sem multi-layer glow

**Motion (sutil)**

- Hover/focus: 150–200ms em `opacity` / `background-color` / `border-color` apenas  
- Drawer mobile: translateX 200–250ms; respeitar `prefers-reduced-motion: reduce` (sem slide)  
- Submit: spinner no botão; sem confetti

**Assinatura**

- Auth: faixa/painel esquerdo com fundo `--cp-ink`, wordmark **CondoPartners**, uma linha de apoio: “Rede de partners e comissões.”  
- Ícone PWA: fachada geométrica + nós de rede (assets em `docs/design/sis-66/icons/`)

---

## 2. Shell (nav / header / content)

### Desktop (≥1024px)

```
┌────────────┬──────────────────────────────────────────┐
│ Brand      │  Header: [título página]    email · Sair │
│ CondoPart. ├──────────────────────────────────────────┤
│            │                                          │
│ ● Início   │   Main content                           │
│            │   (home placeholder)                     │
│            │                                          │
│            │                                          │
└────────────┴──────────────────────────────────────────┘
 sidebar 240px              flex-1, padding 24–32px
 + safe-area-inset-*
```

- **Sidebar fixa** 240px, fundo `--cp-surface`, borda direita `--cp-border`  
- Item ativo: fundo muted suave + barra esquerda 3px `--cp-accent` + texto `--cp-ink`  
- Nesta fatia **só** item **Início** (rota `/`) — não inventar menu de domínio  
- **Header** sticky h-14: título “Início”; à direita e-mail truncável (`min-w-0 truncate`) + botão texto/ghost **Sair**  
- **Main:** skip link “Ir para o conteúdo” (visível no foco)  
- Home placeholder: `h1` **Bem-vindo ao CondoPartners** + uma frase secundária: “Esta é a área autenticada. Em breve: rede de partners e comissões.” Sem cards de métricas fake.

### Mobile (<1024px)

- Sem sidebar persistente  
- Top bar: botão **Menu** (`aria-label="Abrir menu"`) + wordmark curto + **Sair**  
- Drawer esquerdo com overlay; `overscroll-behavior: contain`; fecha Esc / clique fora / após nav  
- Alvos ≥44×44px  
- Padding com `env(safe-area-inset-*)`

### Estados do shell

| Estado | UI |
|--------|-----|
| Sessão loading | Shell skeleton (sidebar/header cinza) ou tela central “Carregando…” — sem flash de forms |
| Logado | Shell + home |
| Sessão inválida | Redireciona para Entrar |

---

## 3. Auth screens

### Rotas / composição

| Tela | Título | CTA | Link alternativo |
|------|--------|-----|------------------|
| Entrar | Entrar | Entrar | “Criar conta” → cadastro |
| Criar conta | Criar conta | Criar conta | “Já tem conta? Entrar” |

### Layout

**Desktop:** split 40/60 (marca | form). Form max-width ~400px.  
**Mobile:** stack; painel de marca vira faixa superior h-auto com padding (wordmark + tagline em 1–2 linhas).

### Campos (copy pt-BR — alinhado à SIS-65)

| Campo | Label | `type` / attrs | Placeholder (exemplo) |
|-------|-------|----------------|------------------------|
| Nome (só cadastro) | Nome | `text`, `autocomplete="name"` | `Maria Silva…` |
| E-mail | E-mail | `email`, `autocomplete="email"`, `spellCheck={false}` | `voce@empresa.com…` |
| Senha | Senha | `password`, `autocomplete="current-password"` (login) / `new-password` (cadastro) | — (sem placeholder de senha) |

### Estados do form

| Estado | Comportamento |
|--------|----------------|
| Idle | CTA habilitado |
| Submitting | CTA disabled + “Entrando…” / “Criando conta…” + spinner; inputs readonly opcional |
| Erro genérico | Alert `role="alert"` / `aria-live="polite"`: **Não foi possível autenticar. Verifique os dados e tente de novo.** Próximo ao form (topo do card) |
| Sucesso | Navega ao shell (sem toast obrigatório nesta fatia) |

### Wire ASCII (login mobile)

```
┌─────────────────────┐
│ CondoPartners       │  ← faixa ink
│ Rede de partners…   │
├─────────────────────┤
│ Entrar              │
│                     │
│ E-mail              │
│ [                 ] │
│ Senha               │
│ [                 ] │
│                     │
│ [     Entrar      ] │
│ Criar conta         │
└─────────────────────┘
```

---

## 4. Breakpoints / mobile

| Breakpoint | Comportamento |
|------------|----------------|
| ≥375px | Auth e shell usáveis; sem overflow-x crítico |
| &lt;1024px | Shell drawer; auth stack |
| ≥1024px | Sidebar + split auth |
| ≥1440px | Content max-width ~1120px centrado na main (opcional) |

PWA: `display: standalone`; chrome respeita safe areas; `touch-action: manipulation` em botões.

---

## 5. Tokens / componentes reutilizáveis (Sistema)

Mapear para shadcn/Tailwind existentes em `apps/web`:

| Padrão | Implementação sugerida |
|--------|------------------------|
| `Button` primary / ghost | `components/ui/button` — primary = `--cp-primary` |
| `Input` + `Label` | Criar primitives shadcn se faltarem; labels sempre visíveis |
| `AppShell` | `components/layout/app-shell.tsx` |
| `AppSidebar` | desktop + conteúdo do drawer |
| `AppHeader` | título + user + Sair |
| `AuthLayout` | split / stack marca + children |
| `LoginForm` / `SignUpForm` | forms com estados acima |

**CSS variables** em `index.css` `:root` — substituir o azul genérico atual pelos tokens `--cp-*` acima (manter aliases shadcn `--primary` → `--cp-primary`).

### Registro de sistema (fase Astryx — skill ausente na company library)

Documentar neste handoff como fonte de verdade até Astryx existir:

1. Tokens nomeados (tabela §1) — sem hex soltos em JSX  
2. Shell + AuthLayout como únicos layouts de produto nesta fatia  
3. Copy keys da tabela SIS-65 — não divergir  
4. Ícones Lucide (Menu, LogOut, Home) — sem emoji  
5. Próximas telas herdam estes tokens; white-label por tenant fica fora de escopo

---

## 6. Assets PWA

| Asset | Path (workspace) | Spec |
|-------|------------------|------|
| Icon 192 | `docs/design/sis-66/icons/icon-192.png` | 192×192 PNG |
| Icon 512 | `docs/design/sis-66/icons/icon-512.png` | 512×512 PNG |
| Master | `docs/design/sis-66/icons/icon-master.png` | 1024×1024 fonte |
| theme-color | `#0B1F33` | meta + manifest |
| background_color | `#0B1F33` | manifest |
| name / short_name | CondoPartners | pt-BR |
| description | Rede de partners e comissões B2B | |
| display | `standalone` | |
| start_url | `/` | |
| lang | `pt-BR` | |

DEV deve copiar ícones para `apps/web/public/icons/` na Task PWA da SIS-65.

Maskable: o master já tem margem generosa; se Lighthouse pedir `purpose: "maskable"`, reusar o 512 com o mesmo asset.

---

## 7. Critérios de aceite visuais

1. Login e cadastro usam **AuthLayout** com painel de marca ink + form; copy exatamente da spec.  
2. Logado: shell com Início + **Olá, {email}** (ou e-mail no header) + **Sair**; home **Bem-vindo ao CondoPartners**.  
3. 375px e ≥1024px sem scroll horizontal crítico; drawer no mobile.  
4. Contraste texto/fundo ≥ 4.5:1 (ink em paper; primary-fg em primary).  
5. Focus-visible em todos os controles interativos; labels clicáveis.  
6. Loading de submit e erro genérico implementados.  
7. PWA: ícones 192/512 + theme-color `#0B1F33`; sem zoom bloqueado.  
8. `prefers-reduced-motion` reduz animação do drawer.  
9. Sem métricas/cards fake; sem purple/glass/AI-slop.

---

## 8. Auditoria Web Design Guidelines (pré-build)

Checklist que o DEV deve cumprir (achados aplicados ao handoff):

- [x] Labels visíveis (não placeholder-only)  
- [x] `autocomplete` / `type=email` / spellcheck off em e-mail  
- [x] Erros com `aria-live` / `role="alert"`  
- [x] Icon-only Menu com `aria-label`  
- [x] Skip link para main  
- [x] Focus-visible; sem `outline-none` nu  
- [x] Safe-area insets no shell standalone  
- [x] Truncate + `min-w-0` no e-mail do header  
- [x] Loading “…”; erros com próximo passo  
- [x] Motion compositor-friendly + reduced-motion  
- [x] Não desabilitar zoom  
- [x] Botões = `<button>`; nav = links quando houver rotas  

Nota pt-BR vs guideline “Title Case”: produto CondoPartners usa **sentence case** em CTAs (“Entrar”, “Criar conta”) — regra local da spec prevalece.

---

## 9. Handoff para DEV (mapa arquivo)

| Entrega design | Arquivo alvo (implementação) |
|----------------|------------------------------|
| Tokens | `apps/web/src/index.css` |
| Font Public Sans | `index.html` ou CSS `@import` |
| AuthLayout | `apps/web/src/components/layout/auth-layout.tsx` |
| Forms | `apps/web/src/components/auth/*` |
| AppShell / Sidebar / Header | `apps/web/src/components/layout/*` |
| Ícones PWA | copiar de `docs/design/sis-66/icons/` → `apps/web/public/icons/` |
| theme-color | `index.html` + `vite-plugin-pwa` manifest |

**Não** expandir escopo para OAuth, RBAC, multi-tenant ou landing.

---

## 10. Notas de pipeline

| Fase | Resultado |
|------|-----------|
| 1 Frontend Design | World “placa de portaria”; assinatura rail ink; anti-AI-slop |
| 2 UI UX Pro Max | DS ops B2B (navy/azul confiança); dials density 7 / motion 3; forms + nav rules |
| 3 Impeccable | Modo Operate; contrato THESIS/OWN-WORLD; densificação útil; copy endurecida |
| 4 Web Design Guidelines | Checklist §8 embutido no handoff |
| 5 Sistema | Tokens + layouts reutilizáveis; Astryx skill **não instalada** na company — registro local neste doc |
