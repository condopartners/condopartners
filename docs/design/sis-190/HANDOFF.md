# Handoff de Design — Copy e estados do fluxo de conta (auth)

**Issue:** [SIS-190](/SIS/issues/SIS-190) · pai [SIS-188](/SIS/issues/SIS-188) · eng [SIS-189](/SIS/issues/SIS-189)  
**Specs:** `docs/specs/auth-better-auth.md` · `docs/specs/auth-smtp-activation.md` · `docs/specs/auth-shell-pwa.md`  
**Fundação visual:** `docs/design/sis-66/HANDOFF.md` (tokens, AuthLayout, tipografia)  
**Papel:** Head of Design · **Data:** 2026-07-26  
**Pipeline:** Frontend Design → UI UX Pro Max → Impeccable (Operate / clarify+harden) → Web Interface Guidelines → Sistema (Astryx indisponível; registro local §8)

**Escopo deste handoff:** polish de copy + estados no AppShell auth existente. **Sem código de produção.** Políticas de TTL/sessão vêm do plano [SIS-188](/SIS/issues/SIS-188#document-plan); CTO confirma na spec antes do DEV hardcodar.

---

## 0. Contrato de direção

**Modo:** Operate — operador B2B entra, cria conta, recupera senha ou mantém sessão.  
**Job único:** deixar claro **o que falhou / o que deu certo / o que fazer agora**, sem inventar dashboard.  
**Mundo herdado (SIS-66):** placa de portaria — `--cp-ink` / `--cp-paper` / `--cp-primary` / `--cp-danger` / `--cp-success`, Public Sans, AuthLayout split, raio 0.5rem, sombra mínima. **Zero token novo.**

**Assinatura desta fatia:** alertas de form **específicos** (campo ou banner) + painéis de sucesso calmados (borda `--cp-success` / fundo suave) — não toast, não confetti.

**Anti-padrões**

- Erro genérico único para senha curta / e-mail inválido / rede  
- Sucesso silencioso pós-cadastro  
- Enumerar existência de conta no “esqueci senha”  
- Purple / glass / badges flutuantes / cards decorativos  
- Inventar regra de senha além do Better Auth pinado (`minPasswordLength` default **8**; `maxPasswordLength` se CTO documentar)

---

## 1. Hierarquia tipográfica (AuthLayout — sem mudança de escala)

| Papel | Tratamento | Uso |
|-------|------------|-----|
| Título tela | `h1` · `text-2xl`/`lg:text-3xl` · 600 · `--cp-ink` | Entrar, Criar conta, Verifique seu e-mail, Redefinir senha… |
| Corpo / apoio | `text-sm` · 400 · `--cp-muted` | Explicação sob o título; hint do checkbox |
| Label | `text-sm` · 500 · `--cp-ink` | Labels sempre visíveis |
| Erro campo | `text-sm` · `--cp-danger` · sob o input | Validação de campo |
| Erro form | `text-sm` · banner danger · `role="alert"` | Falha de submit / servidor |
| Sucesso | `text-sm` · banner success · `role="status"` | Pós-cadastro, e-mail enviado, senha redefinida |
| Link auxiliar | botão ghost / link texto `--cp-primary` | Esqueci minha senha, Já tem conta? |

Sentence case pt-BR em todos os CTAs (regra local prevalece sobre Title Case das guidelines).

---

## 2. Máquina de estados (visão geral)

```
[Entrar] ←→ [Criar conta]
   │            │
   │            └→ [Verifique seu e-mail] (sucesso cadastro)
   │                      │
   │                      └→ (link e-mail) → sessão / shell
   │
   ├→ [Esqueci minha senha] → [E-mail enviado]
   │                              │
   │                              └→ (link) → [Nova senha] → [Entrar] (+ banner sucesso)
   │
   └→ checkbox Manter conectado → sign-in (TTL sessão via eng)
```

Estados transversais por tela: **idle · submitting · field-error · form-error · success · (opcional) info**.

| Estado | UI |
|--------|-----|
| Idle | CTA habilitado; sem banner |
| Submitting | CTA disabled + spinner + rótulo com `…`; inputs `readOnly` ou `disabled` |
| Field-error | Borda danger no input; texto sob o campo; `aria-invalid` + `aria-describedby`; foco no 1º erro no submit |
| Form-error | Banner topo do card, `role="alert"` `aria-live="polite"` |
| Success | Banner `--cp-success` (borda/fundo suave), `role="status"` `aria-live="polite"` — **não** só troca de tela sem confirmação |
| Info | Banner muted (ex.: reenvio ok já existente) |

---

## 3. Criar conta — erros específicos

### Layout (inalterado)

AuthLayout + card form. Campos: Nome, E-mail, Senha. CTA **Criar conta**. Link **Já tem conta? Entrar**.

### Helper de senha (novo, idle)

Sob o campo Senha, **antes** do submit:

> Use pelo menos 8 caracteres.

(`text-sm` `--cp-muted`. Se CTO mudar o mínimo na spec, atualizar este número — única fonte de verdade = spec eng.)

### Mapa de erros (copy **exata**)

Mapear `error.code` / mensagem Better Auth → copy. Campo vs form:

| Condição (eng) | Onde | Copy |
|----------------|------|------|
| Senha &lt; mínimo (`PASSWORD_TOO_SHORT` / length) | **Campo** Senha | A senha deve ter pelo menos 8 caracteres. |
| Senha &gt; máximo (`PASSWORD_TOO_LONG`) | **Campo** Senha | A senha é longa demais. Use no máximo {N} caracteres. |
| Senha inválida / política (`INVALID_PASSWORD`) | **Campo** Senha | Esta senha não atende aos requisitos. Escolha outra. |
| E-mail inválido (client ou API) | **Campo** E-mail | Informe um e-mail válido. |
| Nome vazio (client) | **Campo** Nome | Informe seu nome. |
| E-mail já cadastrado (se API distinguir) | **Form** | Este e-mail já está em uso. Entre ou use outro e-mail. |
| Rede / 5xx / desconhecido | **Form** | Não foi possível criar a conta. Verifique os dados e tente de novo. |

**Não** usar o genérico de login (“Não foi possível autenticar…”) no cadastro.

### Loading

CTA: **Criando conta…** (já existe).

### Wire — erro de senha curta

```
┌ Criar conta ─────────────────────┐
│ Nome                             │
│ [Maria Silva                  ]  │
│ E-mail                           │
│ [voce@empresa.com…            ]  │
│ Senha                            │
│ [••••                         ]  │ ← borda danger
│ A senha deve ter pelo menos 8    │ ← field-error
│ caracteres.                      │
│ Use pelo menos 8 caracteres.     │ ← hint (pode sumir se erro ativo)
│ [        Criar conta          ]  │
│ Já tem conta? Entrar             │
└──────────────────────────────────┘
```

---

## 4. Sucesso pós-cadastro + e-mail de ativação

Tela existente `VerifyEmailNotice` — **reforçar** como sucesso explícito (board: “conta criada + e-mail enviado”).

### Copy

| Elemento | Copy |
|----------|------|
| Título `h1` | Conta criada |
| Corpo | Enviamos um link de ativação para **{email}**. Abra a mensagem e clique em **Ativar conta**. O link vale por **30 dias**. |
| Banner sucesso (sempre no load desta tela) | Conta criada. Verifique seu e-mail para ativar o acesso. |
| CTA primário | Reenviar e-mail de ativação |
| Loading reenvio | Reenviando… |
| Sucesso reenvio | E-mail reenviado. Confira a caixa de entrada e o spam. |
| CTA secundário | Voltar para entrar |
| Login bloqueado (não verificado) | Conta ainda não ativada. Verifique seu e-mail ou reenvie o link. |
| Link expirado | Este link expirou. Solicite um novo e-mail de ativação. |
| Link inválido | Este link de ativação é inválido. Solicite um novo e-mail. |

Notas:

- Trocar título atual “Verifique seu e-mail” → **Conta criada** (sucesso primeiro; verificação no corpo).  
- TTL **30 dias** alinhado ao plano SIS-188 (CTO atualiza e-mail SMTP: “expira em 30 dias”).  
- Banner sucesso usa `--cp-success` (token já no sistema SIS-66; hoje pouco usado).  
- E-mail longo: `break-all` / `break-words` no endereço.

### Wire

```
┌ Conta criada ────────────────────┐
│ ✓ Conta criada. Verifique seu    │ ← success banner
│   e-mail para ativar o acesso.   │
│                                  │
│ Enviamos um link de ativação     │
│ para maria@empresa.com. Abra a   │
│ mensagem e clique em Ativar      │
│ conta. O link vale por 30 dias.  │
│                                  │
│ [ Reenviar e-mail de ativação ]  │
│ Voltar para entrar               │
└──────────────────────────────────┘
```

---

## 5. Esqueci minha senha (fluxo novo de UI)

Novas superfícies no AuthLayout (mesmo card). Rotas sugeridas sem lib de router: modes no `AuthPanel` ou hash `#/recuperar-senha` / `#/redefinir-senha?token=…` — CTO/DEV escolhem; Design exige deep-link do token na URL.

### 5.1 Pedido (from login)

No **Entrar**, abaixo do campo Senha (antes do CTA):

- Link texto: **Esqueci minha senha** (`type="button"` ou `<a>` se houver rota)

### 5.2 Tela — Pedir redefinição

| Elemento | Copy |
|----------|------|
| Título | Redefinir senha |
| Corpo | Informe o e-mail da conta. Se existir, enviaremos um link válido por **24 horas**. |
| Label | E-mail |
| Placeholder | `voce@empresa.com…` |
| CTA | Enviar link |
| Loading | Enviando… |
| Secundário | Voltar para entrar |

**Anti-enumeração (obrigatório):** sucesso idêntico se o e-mail existir ou não.

### 5.3 Tela — E-mail enviado (sucesso pedido)

| Elemento | Copy |
|----------|------|
| Título | Verifique seu e-mail |
| Banner sucesso | Se houver conta com esse e-mail, enviamos um link para redefinir a senha. |
| Corpo | O link expira em **24 horas**. Confira também a pasta de spam. |
| CTA secundário | Voltar para entrar |

### 5.4 Tela — Nova senha (token na URL)

| Elemento | Copy |
|----------|------|
| Título | Escolha uma nova senha |
| Label 1 | Nova senha |
| Label 2 | Confirmar senha |
| Hint | Use pelo menos 8 caracteres. |
| CTA | Salvar nova senha |
| Loading | Salvando… |

Erros:

| Condição | Onde | Copy |
|----------|------|------|
| Senha curta | Campo Nova senha | A senha deve ter pelo menos 8 caracteres. |
| Confirmação ≠ | Campo Confirmar | As senhas não coincidem. |
| Token expirado | Form | Este link expirou. Solicite um novo e-mail para redefinir a senha. |
| Token inválido | Form | Este link é inválido. Solicite um novo e-mail para redefinir a senha. |
| Rede / genérico | Form | Não foi possível redefinir a senha. Tente de novo. |

CTA de recuperação em erro de token: **Pedir novo link** → volta à tela 5.2.

### 5.5 Sucesso pós-reset

Redirecionar para **Entrar** com banner sucesso:

> Senha atualizada. Entre com a nova senha.

### Wire — login com link + lembrar-me

```
┌ Entrar ──────────────────────────┐
│ E-mail                           │
│ [                             ]  │
│ Senha                            │
│ [                             ]  │
│ Esqueci minha senha              │ ← link primary text, alinhado à esq.
│                                  │
│ ☐ Manter conectado               │ ← checkbox + label hit-target único
│   Mantém a sessão por até 30     │ ← hint honesto (opção A CTO / BA nativo)
│   dias. Sem marcar, termina ao   │
│   fechar o navegador.            │
│                                  │
│ [           Entrar            ]  │
│ Criar conta                      │
└──────────────────────────────────┘
```

### Wire — pedido reset

```
┌ Redefinir senha ─────────────────┐
│ Informe o e-mail da conta. Se    │
│ existir, enviaremos um link      │
│ válido por 24 horas.             │
│ E-mail                           │
│ [voce@empresa.com…            ]  │
│ [        Enviar link          ]  │
│ Voltar para entrar               │
└──────────────────────────────────┘
```

---

## 6. Manter conectado / Lembrar de mim

Alinhado a `docs/specs/auth-password-reset-remember.md` **opção A** (Better Auth
nativo: não há dual TTL 7d/30d sem fork). Copy **não** promete 7 dias.

| Elemento | Copy |
|----------|------|
| Label do checkbox | Manter conectado |
| Hint (`text-sm` muted) | Mantém a sessão por até 30 dias neste dispositivo. Sem marcar, a sessão termina ao fechar o navegador. |
| `name` / API | `rememberMe` no `signIn.email` |
| Default UI | **desmarcado** → enviar `rememberMe: false` (BA default omitido = true) |

Comportamento UI:

- Checkbox + label = um único alvo ≥44×44px (sem dead zone).  
- Marcado → `rememberMe: true` (cookie persistente ≈ 30d, conforme `session.expiresIn`).  
- Desmarcado → `rememberMe: false` (cookie de sessão do browser).  
- Não mostrar em cadastro.  
- Em mobile, hint pode quebrar em 2–3 linhas; não truncar.

**Se o board rejeitar opção A** e exigir 7d/30d custom: CTO reabre eng; Design só
atualiza o hint — não mentir na UI.

---

## 7. Login — matriz residual (copy estável)

| Contexto | Copy |
|----------|------|
| Título | Entrar |
| CTA | Entrar |
| Loading | Entrando… |
| Credencial inválida | E-mail ou senha incorretos. |
| Genérico / rede | Não foi possível autenticar. Verifique os dados e tente de novo. |
| Não verificado | Conta ainda não ativada. Verifique seu e-mail ou reenvie o link. |
| CTA reenvio | Reenviar e-mail de ativação |
| Alternar | Criar conta |

Preferir **E-mail ou senha incorretos.** ao genérico quando a API indicar credencial inválida (menos vago; ainda sem enumerar qual campo).

---

## 8. Sistema (fase Astryx — skill ausente)

Registro local até Astryx existir na company library:

| Padrão | Reuso |
|--------|-------|
| Tokens | Somente `--cp-*` de SIS-66; success banner = `--cp-success` |
| Layout | `AuthLayout` único |
| Card form | Mesmo `section` border/surface/shadow das forms atuais |
| Alert danger | Já em login/sign-up — extrair mentalmente como `FormAlert` variant `danger` |
| Alert success | Novo variant no mesmo padrão (não toast) |
| Checkbox | Primitivo shadcn `Checkbox` (ainda ausente em `components/ui`) — adicionar só se fatia DEV precisar |
| Ícones | Lucide opcional `Check` decorativo no banner sucesso com `aria-hidden` — não obrigatório |
| Copy keys | Tabelas deste handoff; DEV não improvisar strings |

**Zero** cor nova, **zero** font nova, **zero** dependência de animação.

---

## 9. Auditoria Web Interface Guidelines (pré-build)

Checklist para o DEV (achados já aplicados no handoff):

- [x] Labels visíveis; placeholder só exemplo com `…`  
- [x] `autocomplete`: `email`, `current-password`, `new-password`, `name`  
- [x] `spellCheck={false}` em e-mail  
- [x] Erros: campo próximos ao input + form com `role="alert"` / `aria-live`  
- [x] Sucesso com `role="status"` / `aria-live="polite"`  
- [x] Foco no primeiro campo com erro no submit  
- [x] Checkbox + label hit-target único  
- [x] Loading com `…` tipográfico  
- [x] CTAs específicos (“Enviar link”, “Salvar nova senha”)  
- [x] Erros com próximo passo  
- [x] Anti-enumeração no reset  
- [x] E-mail longo com break; sem layout shift de banner (reservar espaço ou aceitar empurrão estável no topo)  
- [x] `touch-action: manipulation`; alvos ≥44px  
- [x] Sem `user-scalable=no`; focus-visible preservado  
- [x] Sentence case pt-BR (exceção local à Title Case da guideline)

---

## 10. Handoff para DEV / CTO

### Arquivos alvo (implementação)

| Entrega | Alvo |
|---------|------|
| Mapa de erros cadastro | `apps/web/src/components/auth/auth-panel.tsx` + `sign-up-form.tsx` |
| Sucesso pós-cadastro | `verify-email-notice.tsx` (título/banner/TTL copy) |
| Link + fluxos reset | novos components em `apps/web/src/components/auth/*` + modes no panel |
| Checkbox lembrar-me | `login-form.tsx` (+ shadcn Checkbox se necessário) |
| Spec eng (TTL, sessão, reset API) | [SIS-189](/SIS/issues/SIS-189) — **antes** de hardcodar 7d/30d/24h/30d |

### Critérios de aceite (Design → QA)

1. Cadastro com senha &lt; 8 mostra erro **de campo** com a copy da §3 (não genérico).  
2. Cadastro ok → tela **Conta criada** com banner sucesso + menção ao e-mail e TTL 30 dias.  
3. Login tem **Esqueci minha senha** e fluxo pedido → enviado → nova senha → sucesso no Entrar.  
4. Token reset expirado/inválido: copy da §5.4 + caminho para pedir de novo.  
5. Checkbox **Manter conectado** com hint 30d / fecha-navegador (opção A); default off → `rememberMe: false`.  
6. Nenhuma string de UI em inglês; contraste danger/success ≥ 4.5:1 sobre surface.  
7. Sem regressão visual do AuthLayout SIS-66.

### Fora

- Templates HTML de e-mail “brand” (mínimo pt-BR do eng basta)  
- OAuth, RBAC, multi-tenant  
- Implementação / PRs (DEV via CTO)

---

## 11. Notas de pipeline

| Fase | Resultado |
|------|-----------|
| 1 Frontend Design | Preserva world SIS-66; assinatura = alertas específicos + success calmado |
| 2 UI UX Pro Max | Forms: erro perto do campo; submit feedback; a11y aria-live; dials density 7 / motion 2 |
| 3 Impeccable | Operate + clarify/harden: copy acionável, anti-enumeração, estados extremos (e-mail longo, token morto) |
| 4 Web Design Guidelines | Checklist §9 |
| 5 Sistema | Astryx ausente → §8; zero token novo; padrão FormAlert success/danger |

**Próximo dono:** [CTO](/SIS/agents/cto) embute este handoff nas fatias DEV de [SIS-189](/SIS/issues/SIS-189) (UI após/specs).
