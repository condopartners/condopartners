# Super-admin — contas, reset e gestão de usuários

## Status

Aprovada — board aceitou o plano em [SIS-116](/SIS/issues/SIS-116) (rev `7a623228`)

## Issue

- GitHub: [condopartners#20](https://github.com/condopartners/condopartners/issues/20)
- Paperclip: [SIS-116](/SIS/issues/SIS-116) (spec) · origem [SIS-112](/SIS/issues/SIS-112)
- Fundação auth: `docs/specs/auth-better-auth.md` ([SIS-65](/SIS/issues/SIS-65))
- Shell autenticado: `docs/specs/auth-shell-pwa.md`
- Dependência SMTP / ativação: [SIS-115](/SIS/issues/SIS-115) (spec irmã)
- Bootstrap admin em prod/dev: [SIS-113](/SIS/issues/SIS-113)

## Resumo

Entregar o **MVP de painel de super-admin de plataforma** para operadores CondoPartners
criarem contas, alterarem dados de usuário, resetarem senha, enviarem link de reset e
**invalidarem acesso por senha** (pedido do board como “deletar senha” — ver clarificação
abaixo). Usa o plugin **Admin** do Better Auth sobre a fundação já entregue; **não** é o
RBAC multi-tenant de produto (tenant admin / partners) — esse permanece fora.

## Clarificação — “deletar senha”

O pedido do board em [SIS-112](/SIS/issues/SIS-112) lista “deletar senha”. Interpretamos
como **invalidar a credencial atual e as sessões**, não apagar o usuário.

| Interpretação | MVP? | Motivo |
|---------------|------|--------|
| **Invalidar acesso** = revogar todas as sessões + invalidar hash atual (senha aleatória
  desconhecida pelo usuário) + opcionalmente enviar link de reset | **Sim** | Atende suporte
  sem destruir a conta |
| Apagar o registro `account.password` sem substituto e sem reset | Não | Trava a conta
  sem caminho de recuperação |
| Soft-delete / hard-delete do usuário | Não (fora) | Não pedido; risco alto |
| Só revogar sessões (senha antiga continua válida) | Não suficiente | Usuário reconecta
  com a mesma senha |

Ação de produto no painel: **Invalidar senha** (copy pt-BR). Implementação: composição
`revokeUserSessions` + `setUserPassword` (senha aleatória ≥32 chars gerada server-side,
nunca exibida na UI) +, se SMTP estiver disponível ([SIS-115](/SIS/issues/SIS-115)),
disparo de e-mail de reset.

## Abordagem escolhida

**Better Auth Admin plugin** (`admin` / `adminClient`) + UI mínima no shell existente +
auditoria append-only.

Alternativas rejeitadas:

| Opção | Por que não |
|-------|-------------|
| Endpoints Elysia custom sem plugin | Reinventa auth; mais superfície de bug |
| RBAC completo multi-tenant já | Sem tabelas de tenant; escopo de produto separado |
| Só `adminUserIds` em env, sem role | Não escala; role `admin` no user é o default do plugin |

## Escopo

### Dentro (MVP)

- Plugin Better Auth `admin` na API + `adminClient` no web.
- Campos de schema do plugin em `user` (no mínimo `role`, `banned`, `banReason`,
  `banExpires`) via migrate/generate Better Auth + Drizzle; sem tabelas de domínio de
  partners/comissões.
- Papéis de plataforma (apenas estes dois no MVP):
  - `admin` — **super-admin de plataforma** (rótulo UI: Super-admin)
  - `user` — usuário comum (default)
- Bootstrap do primeiro admin:
  - env `BETTER_AUTH_ADMIN_USER_IDS` (lista CSV de user ids) **e/ou**
  - seed/script operacional documentado (e-mail conhecido em staging/prod) alinhado a
    [SIS-113](/SIS/issues/SIS-113)
- Endpoints admin (sessão cookie de um `admin` obrigatória):
  - listar usuários (busca por e-mail/nome, paginação)
  - criar conta (`createUser`: e-mail, nome, senha temporária ou gerada)
  - atualizar informações (`updateUser`: nome; e-mail via capacidade admin `set-email`
    se disponível na versão pinada — senão endpoint documentado equivalente)
  - definir senha (`setUserPassword`)
  - enviar link de reset de senha (fluxo Better Auth `forget-password` / request reset
    **em nome do usuário**, exige mailer de [SIS-115](/SIS/issues/SIS-115))
  - **Invalidar senha** (composição acima)
  - revogar todas as sessões do usuário (`revokeUserSessions`) — também exposto como
    ação separada **Encerrar sessões**
- Gate de UI: rotas `/admin/*` só para sessão com `role === "admin"` (ou id em
  `adminUserIds`); demais usuários recebem 403 / redirect para `/`.
- UI mínima pt-BR no AppShell: nav **Admin** (só admin), lista de usuários, detalhe com
  ações. Visual cru aceitável nesta fatia se Design ainda não entregou handoff; **handoff
  obrigatório** ao [Head of Design](/SIS/agents/head-of-design) antes de polish.
- Auditoria append-only `admin_audit_event` (ver Dados).
- Testes API (bun:test) cobrindo autorização e cada ação MVP.
- Env documentado em `.env.example` sem secrets.

### Fora

- RBAC de tenant, convites, organizações, `tenant_id` em user.
- Impersonation.
- Ban/unban na UI (campos podem existir no schema do plugin; **não** expor no MVP).
- Hard-delete de usuário.
- Promover/rebaixar `admin` via UI (só via seed/ops + `setRole` server-side documentado;
  UI de promoção = fase 2).
- OAuth / social login.
- Painel analytics, métricas fake, nav de domínio (Partners, Comissões…).
- Merge de PRs (humano/CODEOWNERS).

## Modelo de autorização (multi-tenant)

| Conceito | MVP | Futuro |
|----------|-----|--------|
| Super-admin (`role=admin`) | Plataforma global; vê/gerencia **todos** os users Better Auth | Continua plataforma; **não** vira admin de um tenant |
| Admin de tenant | Fora | Papel/membership separado quando existir spec de tenancy |
| Isolamento | Sem `tenant_id` ainda — coerente com fundação auth | Super-admin permanece cross-tenant; APIs de tenant exigirão checks distintos |

Regra dura: endpoints `/api/auth/admin/*` (ou path do plugin) **só** com sessão admin.
Usuário `user` nunca lista nem muta outros usuários.

## Comportamento

Critérios de aceite testáveis:

1. Usuário sem role `admin` chama qualquer ação admin → **403** (ou equivalente Better Auth);
   sem efeito colateral.
2. Admin autenticado lista usuários com paginação; busca por e-mail encontra o alvo.
3. Admin cria usuário com e-mail/nome/senha → registro em `user` + credential; role default
   `user`; evento de auditoria `user.create`.
4. Admin atualiza nome (e e-mail, se no escopo da versão) → persistido; auditoria
   `user.update`.
5. Admin define nova senha → login antigo falha; login com nova senha ok; auditoria
   `user.set_password`.
6. **Invalidar senha**: sessões do alvo encerradas; senha antiga deixa de autenticar;
   auditoria `user.invalidate_password`. Se mailer ativo, e-mail de reset é enfileirado/
   enviado (dependência [SIS-115](/SIS/issues/SIS-115)); se mailer ausente, ação ainda
   completa a invalidação e a UI informa que o link de reset **não** foi enviado.
7. **Enviar link de reset**: com SMTP configurado, verification/reset token criado e
   e-mail disparado; auditoria `user.send_password_reset`. Sem SMTP → erro explícito
   pt-BR (não silencioso).
8. **Encerrar sessões**: `get-session` do alvo deixa de ser válido; auditoria
   `user.revoke_sessions`.
9. Web: item de nav **Admin** visível só para admin; rotas `/admin` inacessíveis a
   `user` (redirect).
10. `.env.example` lista vars novas sem valores secretos.
11. `bun run check` verde na PR de implementação.

## Dados / API

### Env

| Var | Onde | Notas |
|-----|------|-------|
| `BETTER_AUTH_SECRET` | API | já existe |
| `BETTER_AUTH_URL` | API | já existe |
| `WEB_ORIGIN` | API | já existe |
| `BETTER_AUTH_ADMIN_USER_IDS` | API | CSV opcional de user ids sempre tratados como admin |
| Vars SMTP | API | definidas na spec [SIS-115](/SIS/issues/SIS-115) — necessárias para reset por e-mail |

### Auth server

```ts
betterAuth({
  // ...fundação existente
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
      adminUserIds: (process.env.BETTER_AUTH_ADMIN_USER_IDS ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    }),
  ],
})
```

Client web: `adminClient()` no `createAuthClient`.

### Endpoints (Better Auth Admin + auth)

Paths exatos seguem a versão pinada de `better-auth` (documentar no PR de
implementação). Capacidades MVP:

| Ação produto | API |
|--------------|-----|
| Listar | `admin.listUsers` |
| Criar | `admin.createUser` |
| Atualizar | `admin.updateUser` (+ set-email se aplicável) |
| Definir senha | `admin.setUserPassword` |
| Encerrar sessões | `admin.revokeUserSessions` |
| Enviar reset | request password reset Better Auth (mailer) |
| Invalidar senha | composição server-side (módulo fino em `apps/api`, não só UI) |

A composição **Invalidar senha** deve viver na API (módulo `admin` ou helper autenticado),
não apenas no client, para garantir ordem atômica o suficiente + auditoria única.

### Schema

- Campos Admin plugin em `user` (role, banned, …) via fluxo oficial Better Auth +
  `bun run db:generate` / `db:migrate`.
- Nova tabela **aprovada por esta spec**:

```ts
// admin_audit_event
id: text pk
actorUserId: text not null  // quem executou
action: text not null       // ex: user.create, user.invalidate_password
targetUserId: text          // alvo, se houver
metadata: jsonb             // sem senhas / tokens / secrets
createdAt: timestamp not null
```

Proibido gravar senha, hash, token de reset ou secret em `metadata`.

## UI

Copy pt-BR mínima (Design pode refinar no handoff):

| Contexto | Copy |
|----------|------|
| Nav | Admin |
| Título lista | Usuários |
| CTA criar | Criar conta |
| Campo e-mail | E-mail |
| Campo nome | Nome |
| Campo senha (criar/definir) | Senha |
| Ação | Definir senha |
| Ação | Enviar link de reset |
| Ação | Invalidar senha |
| Ação | Encerrar sessões |
| Confirmação invalidar | Isso encerra as sessões e invalida a senha atual. Continuar? |
| Erro sem SMTP | Não foi possível enviar o e-mail. Verifique a configuração de SMTP. |
| Erro genérico | Não foi possível concluir a ação. Tente de novo. |
| Vazio | Nenhum usuário encontrado. |

Estados: loading de submit; confirmação destrutiva antes de Invalidar senha / Encerrar
sessões; `role="alert"` em erros.

**Handoff Design:** criar task para [Head of Design](/SIS/agents/head-of-design) cobrindo
lista/detalhe admin no AppShell (tokens SIS-66). Implementação DEV pode seguir wiring
mínimo se o board autorizar “UI crua primeiro”; polish visual bloqueia em Design.

## Fatias de implementação (pós-aprovação)

1. **API + schema + testes** (DEV) — plugin, audit, ações, gate 403.
2. **UI mínima** (DEV) — lista/detalhe/ações; depende de (1).
3. **Design polish** (Head of Design → DEV) — pode paralelizar wireframes com (1).
4. **QA** — aceite + regressão auth fundação + evidência `bun run check`.
5. **SMTP** — [SIS-115](/SIS/issues/SIS-115) bloqueia apenas “enviar link”; demais ações
   seguem sem mailer.

## Riscos

- **Superfície de privilégio** — admin global; bootstrap e `setRole` só via ops; nunca
  expor promoção na UI do MVP.
- **SMTP ausente** — reset por e-mail e parte de “Invalidar senha” degradam com mensagem
  clara; não fingir sucesso de e-mail.
- **Concorrência com SIS-113/115** — coordenar seed do primeiro admin e mailer; não
  duplicar specs.
- **Tenancy futuro** — não acoplar `tenant_id` agora; documentar fronteira plataforma vs
  tenant.
- **Secrets** — senha gerada em invalidação nunca logar; audit sem tokens.
- **UI além do shell** — sem handoff Design, risco de AI-slop; limitar ao wiring + tokens
  existentes.

## Plano de teste

1. Migrations aplicadas; usuário `user` e `admin` de fixture.
2. Testes API: 403 para não-admin; create/list/update/set-password/revoke/invalidate;
   audit rows criadas; senha antiga rejeitada após invalidate.
3. Com mailer mock/fake: send reset cria verification; sem mailer: erro explícito.
4. Smoke web: login admin → Admin → criar → invalidar → login alvo falha.
5. Regressão: suite `apps/api/src/modules/auth/auth.test.ts` intacta.
6. `bun run check` verde.
