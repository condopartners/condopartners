# SMTP + link de ativação de conta (Better Auth)

## Status

Aprovada (fatia SMTP/ativação entregue). **Delta [SIS-189](/SIS/issues/SIS-189) aprovado** —
TTL ativação 30d + erros/sucesso de cadastro (plano rev. 2 aceito pelo board).

## Issue

- Paperclip: [SIS-115](/SIS/issues/SIS-115) (spec) · pedido origem [SIS-112](/SIS/issues/SIS-112)
- Delta UX/TTL: [SIS-189](/SIS/issues/SIS-189) · parent [SIS-188](/SIS/issues/SIS-188)
- Pré-requisito: fundação Better Auth — `docs/specs/auth-better-auth.md` ([SIS-65](/SIS/issues/SIS-65) / [SIS-67](/SIS/issues/SIS-67))
- Spec irmã (reset + lembrar-me): `docs/specs/auth-password-reset-remember.md`

## Resumo

Hoje o cadastro email+senha cria sessão imediatamente com
`requireEmailVerification: false` e **sem** mailer. O board pediu: ao criar
conta, enviar e-mail via **SMTP** com **link de ativação**.

Esta fatia liga o fluxo nativo de verificação do Better Auth a um mailer SMTP
genérico (nodemailer), templates pt-BR mínimos e bloqueio de login até o e-mail
estar verificado. Não inventa provider proprietário nem fila assíncrona.

## Decisão de abordagem

| Opção | Descrição | Prós | Contras |
|-------|-----------|------|---------|
| **A — SMTP genérico (recomendada)** | `nodemailer` + env `SMTP_*`; `emailVerification.sendVerificationEmail` do Better Auth | Atende o pedido literal; qualquer provedor (SES, Brevo, Mailgun, Postfix…); YAGNI | Operador configura SMTP; deliverability depende do provedor |
| B — API Resend/SendGrid | SDK HTTP do provedor | DX bom | Vendor lock-in; board pediu SMTP |
| C — Só log em console | Dev-only forever | Zero ops | Não resolve produção |

**Recomendação: A.** Abstração `sendMail({ to, subject, text, html })` atrás de
nodemailer; testes mockam o transport.

## Escopo

- Dentro:
  - Dependência `nodemailer` (+ tipos) na API.
  - Módulo mailer fino (`apps/api/src/lib/mailer.ts` ou equivalente) lendo env SMTP.
  - Better Auth: `emailAndPassword.requireEmailVerification: true`.
  - Better Auth: `emailVerification` com `sendVerificationEmail`, `sendOnSignUp: true`,
    `sendOnSignIn: true`, `autoSignInAfterVerification: true`,
    `expiresIn: 2_592_000` (**30 dias**; era 3600 / 1h — delta [SIS-189](/SIS/issues/SIS-189)).
  - Template pt-BR texto + HTML mínimo (sem Design system e-mail nesta fatia); copy do
    rodapé/TTL alinhada a **30 dias**.
  - UI web mínima: estado pós-cadastro de **sucesso** (conta criada + e-mail de ativação
    enviado); mensagem em login quando conta não verificada; CTA **Reenviar e-mail de
    ativação** (`authClient.sendVerificationEmail`).
  - UI cadastro: mapear códigos Better Auth para erros **específicos** em pt-BR
    (senha curta/longa, e-mail inválido, e-mail já usado) — não só erro genérico.
  - Callback pós-verificação: `WEB_ORIGIN` (ex. `/` ou rota já existente do shell).
  - `.env.example` com vars SMTP sem secrets.
  - Testes API (bun:test) com mailer mockado: sign-up dispara envio; login sem
    verificar falha; token/URL de verificação marca `emailVerified`; reenvio;
    JWT de ativação respeita TTL de 30 dias (expirado falha).
  - Documentar risco de deliverability / spam e checklist operacional (SPF/DKIM/DMARC
    no DNS do domínio remetente — responsabilidade de ops, não código).

- Fora:
  - Reset de senha por e-mail e checkbox “lembrar-me” — ver
    `docs/specs/auth-password-reset-remember.md` ([SIS-189](/SIS/issues/SIS-189)).
  - Templates HTML polidos / brand e-mail (handoff Design [SIS-190](/SIS/issues/SIS-190)).
  - Fila (Bull/Redis), retry avançado, webhooks de bounce.
  - OAuth / social login.
  - Painel super-admin para forçar verificação ([SIS-116](/SIS/issues/SIS-116)).
  - Mudança de DNS/infra além de documentar vars no deploy.

## Comportamento

Critérios de aceite testáveis:

1. **Sign-up** com e-mail/senha válidos cria usuário com `emailVerified = false`,
   **não** estabelece sessão utilizável para áreas autenticadas, e dispara
   exatamente um envio SMTP (mockável) com link contendo token Better Auth.
2. E-mail contém assunto e corpo **pt-BR**, link absoluto apontando para o fluxo
   de verificação Better Auth (URL gerada pelo framework; `callbackURL` → web).
3. Clicar o link válido (token não expirado) marca `emailVerified = true` e,
   com `autoSignInAfterVerification`, redireciona para o web autenticado.
4. **Sign-in** com e-mail não verificado **falha** (sem sessão) e dispara
   reenvio do e-mail de verificação (`sendOnSignIn: true`).
5. Usuário pode solicitar **reenvio** pela UI sem criar conta duplicada.
6. Token expirado / inválido: verificação falha com mensagem pt-BR clara; usuário
   pode pedir novo e-mail. TTL do JWT de ativação = **30 dias**.
7. Em produção (`NODE_ENV=production` ou equivalente explícito), ausência das
   vars SMTP obrigatórias **impede boot** da API (fail-fast). Em teste, mailer é
   mock; em dev local, SMTP real **ou** transport de captura documentado
   (ex. Mailpit) — sem logar o corpo com secrets.
8. `.env.example` lista todas as vars novas; nenhum secret real no git.
9. `bun run check` verde após a implementação.
10. **Delta [SIS-189](/SIS/issues/SIS-189) — erros de cadastro:** sign-up com senha
    abaixo de `minPasswordLength` (default BA = 8) mostra copy específica pt-BR
    (não o erro genérico). Idem `PASSWORD_TOO_LONG`, `INVALID_EMAIL`,
    `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL` (ou equivalentes da versão pinada).
    Códigos desconhecidos caem no genérico.
11. **Delta [SIS-189](/SIS/issues/SIS-189) — sucesso pós-cadastro:** após sign-up ok,
    UI deixa claro que a **conta foi criada** e que o **e-mail de ativação foi
    enviado** (título + corpo; polish visual do handoff [SIS-190](/SIS/issues/SIS-190)).

## Dados / API

### Env (novas)

| Var | Obrigatória (prod) | Exemplo / notas |
|-----|--------------------|-----------------|
| `SMTP_HOST` | sim | `smtp.exemplo.com` |
| `SMTP_PORT` | sim | `587` (STARTTLS) ou `465` (TLS) |
| `SMTP_SECURE` | não | `true` se porta 465; default `false` |
| `SMTP_USER` | sim* | usuário SMTP (*vazio só se o provedor permitir relay sem auth — documentar) |
| `SMTP_PASS` | sim* | senha/app password — só em secret store / Portainer |
| `SMTP_FROM` | sim | `CondoPartners <noreply@condopartners.com.br>` |
| `SMTP_TLS_REJECT_UNAUTHORIZED` | não | default `true`; só `false` em lab com cert autoassinado |

Vars já existentes (sem mudança de significado): `BETTER_AUTH_SECRET`,
`BETTER_AUTH_URL`, `WEB_ORIGIN`, `VITE_API_URL`, `DATABASE_URL`.

### Auth server (delta)

```ts
betterAuth({
  // …igual à fundação…
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24 * 30, // 30 dias
    sendVerificationEmail: async ({ user, url }) => {
      void sendMail({
        to: user.email,
        subject: "Ative sua conta no CondoPartners",
        text: `Olá${user.name ? `, ${user.name}` : ""}!\n\nClique no link para ativar sua conta:\n${url}\n\nO link expira em 30 dias.`,
        html: `<!-- HTML mínimo equivalente, um <a href="{url}">Ativar conta</a> -->`,
      })
    },
  },
})
```

**Timing:** não `await` o envio dentro de `sendVerificationEmail` (evitar timing
attacks / latência no request) — fire-and-forget com `void` + log de erro
estruturado se o envio falhar.

### Endpoints Better Auth (usados)

| Método | Path | Uso |
|--------|------|-----|
| `POST` | `/api/auth/sign-up/email` | cria user + dispara verificação |
| `POST` | `/api/auth/sign-in/email` | bloqueado se não verificado + reenvio |
| `POST` | `/api/auth/send-verification-email` | reenvio manual |
| `GET` | `/api/auth/verify-email` | valida JWT da URL e marca `emailVerified` |
| existentes | sign-out / get-session | inalterados |

### Onde o token de ativação vive (Better Auth 1.6)

**Não** na tabela `verification`. O fluxo nativo de e-mail de ativação gera um
**JWT HS256** assinado com `BETTER_AUTH_SECRET` (`createEmailVerificationToken`),
embute o token na URL enviada por SMTP e, em `GET /api/auth/verify-email`,
valida o JWT com `jwtVerify` — sem lookup/insert em `verification`.

A tabela `verification` permanece no schema da fundação para **outros** fluxos
Better Auth (ex.: reset de senha `reset-password:*`, OAuth state, plugins OTP /
2FA). Após sign-up com SMTP ok, `verification` vazia **é o comportamento esperado**
(confirmado em [SIS-174](/SIS/issues/SIS-174)); evidência de ativação = linha em
`user` (`email_verified`) + MessageID Postmark / link no e-mail, não row count
em `verification`.

Schema Drizzle: **sem migration nova** — tables `user.email_verified` e
`verification` já existem na fundação.

### Usuários já criados

Contas criadas na fundação com `emailVerified = false` passam a precisar ativar
antes do login. Contas de seed/admin de ops: marcar `email_verified = true` via
SQL one-shot ou aguardar [SIS-116](/SIS/issues/SIS-116). Documentar no PR de
implementação o comando/procedimento.

## UI

Wiring mínimo (copy pt-BR). **Fonte de polish/copy de UI:**
`docs/design/sis-190/HANDOFF.md` ([SIS-190](/SIS/issues/SIS-190)).
Códigos de erro Better Auth e TTL permanecem desta spec; strings de tela
seguem o handoff.

| Contexto | Copy |
|----------|------|
| Pós-cadastro (título) | Conta criada |
| Pós-cadastro (banner) | Conta criada. Verifique seu e-mail para ativar o acesso. |
| Pós-cadastro (corpo) | Enviamos um link de ativação para {email}. Abra a mensagem e clique em Ativar conta. O link vale por 30 dias. |
| CTA reenvio | Reenviar e-mail de ativação |
| Reenvio ok | E-mail reenviado. Confira a caixa de entrada e o spam. |
| Login bloqueado | Conta ainda não ativada. Verifique seu e-mail ou reenvie o link. |
| Link expirado | Este link expirou. Solicite um novo e-mail de ativação. |
| Hint senha | Use pelo menos 8 caracteres. |
| Senha curta | A senha deve ter pelo menos {n} caracteres. |
| Senha longa | A senha é longa demais. Use no máximo {n} caracteres. |
| E-mail inválido | Informe um e-mail válido. |
| E-mail já usado | Este e-mail já está em uso. Entre ou use outro e-mail. |
| Erro genérico cadastro | Não foi possível criar a conta. Verifique os dados e tente de novo. |
| Assunto e-mail | Ative sua conta no CondoPartners |
| CTA no e-mail | Ativar conta |
| TTL no e-mail | O link expira em 30 dias. |
| Rodapé e-mail | Se você não criou esta conta, ignore esta mensagem. |

## Riscos

- **Deliverability / spam** — SMTP mal configurado (sem SPF/DKIM/DMARC no domínio
  de `SMTP_FROM`) cai em spam ou bounce. Mitigação: checklist ops no deploy;
  usar provedor transacional conhecido.
- **Secrets** — `SMTP_PASS` e `BETTER_AUTH_SECRET` nunca no git; só Portainer /
  `.env` local.
- **Enumeração de usuários** — com `requireEmailVerification`, Better Auth
  já mascara sign-up de e-mail existente; não reintroduzir mensagens que
  confirmem existência de conta no reenvio além do comportamento padrão BA.
- **Breaking change de UX** — quem já “logava” sem verificar deixa de entrar até
  ativar (intencional).
- **Falha silenciosa de SMTP** — logar erro no servidor; UI ainda mostra
  “verifique seu e-mail”. Critério de aceite: testes mockam sucesso/falha do
  transport.
- **Multi-tenant futuro** — e-mail de ativação é por usuário global; não acoplar
  tenant nesta fatia.

## Plano de teste

1. Unit/integração API (`apps/api/src/modules/auth/` ou `lib/mailer`):
   - mailer lê env e chama transport (mock).
   - sign-up → `sendMail` chamado 1× com `to` = e-mail do user e URL com token JWT.
   - sign-up de ativação **não** incrementa linhas em `verification`.
   - sign-in sem verificar → sem cookie de sessão + tentativa de reenvio.
   - verify-email com token JWT válido → `emailVerified === true`.
   - token expirado → erro esperado; TTL configurado = 30 dias.
   - sign-up senha curta → resposta com código `PASSWORD_TOO_SHORT` (ou equivalente).
2. Smoke web: cadastro ok → sucesso (conta criada + e-mail enviado) → (em lab)
   abrir URL do mock/Mailpit → shell autenticado; login bloqueado antes da
   ativação; reenvio; cadastro com senha curta mostra erro específico.
3. `bun run check` verde.
4. Evidência QA: print ou log do e-mail capturado em ambiente de staging/dev com
   SMTP de lab (sem expor `SMTP_PASS`); e-mail menciona expiração em 30 dias.

## Ordem de implementação (pós-aprovação do delta SIS-189)

1. Issue DEV (API): `expiresIn` 30d + copy e-mail TTL + testes TDD.
2. Issue DEV (web): mapa de erros de cadastro + copy de sucesso pós-cadastro
   (alinhar handoff [SIS-190](/SIS/issues/SIS-190) quando disponível).
3. Issue QA: aceite dos deltas + regressão ativação/SMTP + evidência `bun run check`.

Não abrir implementação do **delta** até o board confirmar o plano em
[SIS-189](/SIS/issues/SIS-189).
