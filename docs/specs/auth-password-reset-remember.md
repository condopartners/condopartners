# Reset de senha + lembrar-me (Better Auth)

## Status

Rascunho — aguardando confirmação do board ([SIS-189](/SIS/issues/SIS-189))

## Issue

- Paperclip: [SIS-189](/SIS/issues/SIS-189) · parent [SIS-188](/SIS/issues/SIS-188)
- Design paralelo (copy/polish): [SIS-190](/SIS/issues/SIS-190)
- Pré-requisitos:
  - Fundação: `docs/specs/auth-better-auth.md`
  - Mailer SMTP + ativação: `docs/specs/auth-smtp-activation.md`
  - Shell: `docs/specs/auth-shell-pwa.md`

## Resumo

Completar o fluxo **Esqueci minha senha** (pedido → e-mail → nova senha) com TTL de
**24 horas**, e expor checkbox **Manter conectado** no login via `rememberMe` do
Better Auth 1.6. Reutiliza o mailer SMTP já entregue; não inventa provider nem fila.

Hoje a API já declara `sendResetPassword`, mas **sem**
`resetPasswordTokenExpiresIn` explícito (default BA = 1h) e **sem** UI de reset /
lembrar-me.

## Decisão de abordagem — sessão / lembrar-me

Política proposta pelo CEO em [SIS-189](/SIS/issues/SIS-189):

| Item | Valor proposto |
|------|----------------|
| Sessão sem “lembrar” | 7 dias |
| Sessão com “lembrar” | 30 dias |

**Better Auth 1.6.25 (pinado) não modela 7d vs 30d via `rememberMe`.**

Comportamento nativo verificado no código:

| `rememberMe` | Cookie `session_token` | `session.expiresAt` no DB |
|--------------|------------------------|---------------------------|
| `true` (default) | `maxAge = session.expiresIn` | `now + session.expiresIn` (default 7d) |
| `false` | cookie de sessão do browser (`maxAge` omitido) | **fixado 1 dia** no adapter |

### Opções

| Opção | Descrição | Prós | Contras |
|-------|-----------|------|---------|
| **A — Nativo BA (recomendada)** | `session.expiresIn = 30d`; checkbox mapeia `rememberMe`; desmarcado = cookie de sessão + 1d no DB | Zero fork; comportamento documentado pelo framework | Não entrega “7 dias sem lembrar” |
| B — Custom dual TTL | Patch/middleware para 7d vs 30d | Casa com a tabela do CEO | Fork frágil; manutenção cara; fora de YAGNI |
| C — Sempre 7d, ignorar checkbox | Só UI cosmética | Simples | Mente o usuário |

**Recomendação: A.** Documentar o delta ao board e pedir confirmação explícita.
Se o board insistir em 7d/30d, abrir follow-up de pesquisa (não bloquear reset/TTL
ativação).

## Escopo

- Dentro:
  - API: `emailAndPassword.resetPasswordTokenExpiresIn = 86_400` (24h).
  - API: `sendResetPassword` fire-and-forget (`void` + log), template pt-BR com TTL 24h
    (alinhar ao padrão de ativação; hoje usa `await`).
  - API: `session.expiresIn = 60 * 60 * 24 * 30` (30 dias) para login com lembrar-me.
  - Web: fluxos **Esqueci minha senha** (pedir e-mail) → confirmação genérica →
    tela **Redefinir senha** (token na URL) → sucesso → login.
  - Web: checkbox **Manter conectado** no login; enviar `rememberMe: boolean` em
    `signIn.email`.
  - Testes API (TDD): request-reset dispara e-mail (mock); token válido redefine;
    token expirado/ inválido falha; `resetPasswordTokenExpiresIn` = 24h;
    sign-in com `rememberMe: false` vs `true` (cookie / sessão).
  - Testes web mínimos dos novos estados/copy.
  - Copy base pt-BR abaixo; polish do handoff [SIS-190](/SIS/issues/SIS-190).

- Fora:
  - TTL de ativação / erros de cadastro — delta em `auth-smtp-activation.md`.
  - OAuth, multi-tenant, RBAC.
  - Trocar SMTP / fila / brand e-mail pesado.
  - Dual TTL 7d/30d custom (só se board rejeitar opção A).
  - Merge em main (humano).

## Comportamento

1. **Pedir reset:** `POST /api/auth/request-password-reset` com e-mail + `redirectTo`
   (ou `callbackURL` conforme client pinado) aponta para rota web de nova senha.
2. Resposta UI **sempre genérica** (anti-enumeração): “Se existir conta com este
   e-mail, enviamos um link para redefinir a senha.”
3. E-mail pt-BR com link absoluto Better Auth / callback web; texto informa
   expiração em **24 horas**.
4. Token válido: usuário define nova senha (≥ `minPasswordLength`); sucesso;
   redireciona para login (ou auto sign-in se BA fizer — preferir login explícito
   se mais simples).
5. Token expirado/inválido: mensagem pt-BR + CTA para pedir novo link.
6. Nova senha curta/longa: mesmos códigos/mapa de erros do cadastro.
7. **Lembrar-me marcado** (default UI: desmarcado por privacidade em shared
   devices): `rememberMe: true` → cookie persistente 30d.
8. **Lembrar-me desmarcado:** `rememberMe: false` → cookie de sessão do browser
   (fecha o browser = some); DB session ~1d (nativo BA).
9. `bun run check` verde.

## Dados / API

### Auth server (delta)

```ts
betterAuth({
  // …igual ao stack atual…
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 60 * 60 * 24, // 24h
    sendResetPassword: async ({ user, url }) => {
      void sendMail({
        to: user.email,
        subject: "Redefina sua senha no CondoPartners",
        text: `Olá${user.name ? `, ${user.name}` : ""}!\n\nClique no link para redefinir sua senha:\n${url}\n\nO link expira em 24 horas.\n\nSe você não pediu esta redefinição, ignore esta mensagem.`,
        html: `<!-- HTML mínimo com <a href="{url}">Redefinir senha</a> + TTL 24h -->`,
      }).catch((err) => {
        console.error("[mailer] failed to send reset password email", {
          to: user.email,
          error: err instanceof Error ? err.message : String(err),
        })
      })
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 dias quando rememberMe=true
    updateAge: 60 * 60 * 24, // 1 dia (default BA; refresh de expiresAt)
  },
})
```

### Endpoints Better Auth (usados)

| Método | Path | Uso |
|--------|------|-----|
| `POST` | `/api/auth/request-password-reset` | pede e-mail de reset |
| `GET` | `/api/auth/reset-password/:token` | callback/valida token (redirect) |
| `POST` | `/api/auth/reset-password` | define nova senha |
| `POST` | `/api/auth/sign-in/email` | body `rememberMe?: boolean` |

Paths exatos seguem a versão pinada (`better-auth@1.6.x`); documentar no PR se o
client usar alias (`forgetPassword` etc.).

### Schema

Sem migration nova. Reset usa tabela `verification` com identifier
`reset-password:*` (já existente na fundação). Ativação continua via JWT
(ver nota em `auth-smtp-activation.md` / [SIS-174](/SIS/issues/SIS-174)).

## UI

Wiring no shell auth existente. **Polish/copy final:**
`docs/design/sis-190/HANDOFF.md` ([SIS-190](/SIS/issues/SIS-190)) — estados,
wires e hierarquia tipográfica. Tabela abaixo = strings canônicas pós-handoff.

| Contexto | Copy |
|----------|------|
| Link no login | Esqueci minha senha |
| Título pedido | Redefinir senha |
| Corpo pedido | Informe o e-mail da conta. Se existir, enviaremos um link válido por 24 horas. |
| CTA pedido | Enviar link |
| Loading pedido | Enviando… |
| Confirmação pedido (título) | Verifique seu e-mail |
| Confirmação pedido (banner) | Se houver conta com esse e-mail, enviamos um link para redefinir a senha. |
| Confirmação pedido (corpo) | O link expira em 24 horas. Confira também a pasta de spam. |
| Título nova senha | Escolha uma nova senha |
| Hint senha | Use pelo menos 8 caracteres. |
| CTA nova senha | Salvar nova senha |
| Loading nova senha | Salvando… |
| Sucesso reset (banner no Entrar) | Senha atualizada. Entre com a nova senha. |
| Token expirado | Este link expirou. Solicite um novo e-mail para redefinir a senha. |
| Token inválido | Este link é inválido. Solicite um novo e-mail para redefinir a senha. |
| Checkbox login | Manter conectado |
| Hint checkbox (opção A) | Mantém a sessão por até 30 dias neste dispositivo. Sem marcar, a sessão termina ao fechar o navegador. |
| Assunto e-mail | Redefina sua senha no CondoPartners |
| CTA e-mail | Redefinir senha |
| TTL e-mail | O link expira em 24 horas. |

Rotas web sugeridas (ajustar ao router atual):

- `/reset-password` — pedido de e-mail
- `/reset-password/confirm` (ou query `token`) — formulário nova senha

## Riscos

- **Delta vs política 7d/30d** — documentado; board precisa aceitar opção A ou pedir B.
- **Enumeração** — UI e timing do request-reset não devem confirmar existência de e-mail.
- **SMTP falho** — log server-side; UI ainda mostra confirmação genérica.
- **Sessões existentes** — mudar `session.expiresIn` afeta novos logins com lembrar-me;
  sessões antigas mantêm `expiresAt` gravado.
- **Shared device** — default do checkbox **desmarcado** reduz risco em quiosque/PC
  compartilhado (BA default de API é `rememberMe: true` se omitido — a UI deve
  enviar `false` quando desmarcado).

## Plano de teste

1. API (bun:test):
   - request-reset → `sendMail` 1× com URL e TTL copy 24h (mailer mock).
   - row `verification` `reset-password:*` com `expiresAt` ≈ now+24h.
   - reset com token válido → login com senha nova ok; senha antiga falha.
   - token expirado → erro esperado.
   - sign-in `rememberMe: true` → `Set-Cookie` com `Max-Age` ≈ 30d.
   - sign-in `rememberMe: false` → cookie de sessão (sem `Max-Age` persistente).
2. Smoke web: login → esqueci senha → (Mailpit) link → nova senha → entrar;
   checkbox manter conectado visível e enviado.
3. Regressão: ativação SMTP, admin, fundação auth.
4. `bun run check` verde + evidência QA no issue.

## Ordem de implementação (pós-confirmação do board)

1. **DEV API** — TTL reset 24h + `session.expiresIn` 30d + mailer reset + testes.
2. **DEV web** — UI reset + checkbox (copy base; polish quando [SIS-190](/SIS/issues/SIS-190) done).
3. **QA** — aceite + regressão + evidência check (bloqueado por DEV).

PRs pequenos; humanos mergeiam.
