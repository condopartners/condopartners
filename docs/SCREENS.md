# Mapa de Telas por Papel

> Inventário das telas necessárias antes de qualquer UI design. Usado para dimensionar escopo do MVP, planejar rotas Next.js e validar que a navegação cobre todos os fluxos de `FLOWS.md`.
>
> **Multiempresa:** telas da **configuração de referência da Clique** (1º tenant da plataforma `condopartners`). Marca/tema vêm do branding do tenant (`PLATFORM_ARCHITECTURE.md` §4); rotas e permissões abaixo descrevem o mapa papel→permissões da Clique.

## Princípios

- **Single shell** por papel: sidebar fixa + topbar com perfil/notificações. Conteúdo central muda.
- **Sub-rede é estado derivado**: o item "Minha Equipe" só aparece no menu de um parceiro se `exists (descendants_of(auth.uid()))`.
- **Acesso por rota** é a primeira camada de proteção (middleware Next.js resolve papel e tenant do usuário logado — `auth_role()` / `current_tenant_id()`, ver `DATA_MODEL.md` §0); RLS é a segunda.
- **Nomenclatura de rotas**: `/app/<role-prefix>/<feature>` no App Router. Ex: `/app/admin/contracts`, `/app/partner/proposals`.

---

## Telas Comuns (todos os papéis)

| Tela | Rota | Notas |
|---|---|---|
| Login | `/login` | Email + senha (Supabase Auth) |
| Onboarding (via convite) | `/onboard?token=...` | Form de pré-cadastro; gera `users.status='pending_approval'` |
| "Aguardando aprovação" | `/pending` | Tela bloqueante para usuários `pending_approval` |
| "Conta inativa" | `/inactive` | Tela bloqueante para `status='inactive'` |
| Meu Perfil | `/me` | Dados pessoais, troca de senha, MFA |
| Notificações | `/notifications` | Lista (Supabase Realtime) |
| 404 / 403 | — | Padrões |

---

## Papel: Admin N1 (Diretoria/Matriz)

### Sidebar
```
🏠 Dashboard
👥 Parceiros
   ├── Aprovações pendentes
   ├── Árvore completa
   └── Inativações
🏢 Condomínios
   ├── Todos
   └── Bloqueados pela Matriz
📝 Propostas & Contratos
   ├── Propostas em andamento
   ├── Contratos ativos
   └── Cancelamentos
💰 Financeiro
   ├── Dashboard macro
   ├── Comissões (todas)
   └── Pagamentos
🧾 Tabela de Preços
   ├── Tabela base (UF referência)
   └── Upliftes por UF
📦 Catálogo de Módulos
⚙️ Configurações do Sistema
🔒 Auditoria
```

### Telas detalhadas

| Tela | Componentes principais | Ações |
|---|---|---|
| Dashboard macro | Cards: receita prevista (futuras), receita realizada (released), contratos ativos, parceiros ativos, condomínios contratados; gráfico de evolução mensal | Drill-down em qualquer métrica |
| Aprovações pendentes | Lista de `users.status='pending_approval'` com convidante e `commission_pct` | Aprovar / Rejeitar |
| Árvore completa | Visualização em árvore (todas as raízes) com busca por nome/CPF | Inativar, ver detalhes, ver carteira do parceiro |
| Inativações | Histórico de quem foi inativado, por quem, quando | Reativar |
| Todos os condomínios | Tabela com filtros (UF, status, parceiro reservante) | Bloquear pela Matriz, excluir definitivo |
| Propostas em andamento | Lista filtrável (status, UF, parceiro) | Ver detalhe |
| Contratos ativos | Lista com `monthly_amount`, `start_date`, 1ª mensalidade paga? | Detalhe, cancelar |
| Detalhe de contrato | Resumo + breakdown completo da cascata (todas as `commissions` rows) | Cancelar com motivo |
| Cancelamentos | Histórico de contratos cancelados com impacto em comissões | Auditoria read-only |
| Comissões (todas) | Tabela global com filtros (status, beneficiário, contrato, período) | Export CSV |
| Pagamentos | Lista de `payments` por contrato; status de marcação | Ver detalhe |
| Tabela base | Form da UF referência: `base_cost_master`, `max_price`, histórico de versões | Criar nova versão (encerra anterior com `valid_to`) |
| Upliftes por UF | Tabela de UFs com `uplift_pct` editável | Editar; criar nova UF |
| Catálogo | CRUD de `modules_catalog` | Criar, editar, desativar |
| Configurações | Form para `system_settings` (anti-harding, TTL reserva, UF referência) | Editar valores |
| Auditoria | Log estruturado de operações sensíveis (com quem, quando, payload) | Filtro, export |

---

## Papel: Admin N2 (Gestão Operacional)

### Sidebar
```
🏠 Dashboard operacional
👥 Parceiros
   ├── Aprovações pendentes
   └── Carteira (todos)
🏢 Condomínios
   └── Todos (sem bloqueio definitivo)
📝 Propostas & Contratos
   ├── Aprovar propostas (fila)
   ├── Propostas em negociação
   ├── Contratos ativos
   └── Histórico
💰 Financeiro
   ├── Dashboard
   ├── Marcar pagamentos
   └── Comissões
📦 Catálogo (read-only)
```

### Telas detalhadas

| Tela | Componentes | Ações |
|---|---|---|
| Dashboard operacional | Cards: propostas aguardando aprovação, pagamentos para reconciliar, vistorias pendentes (link p/ N3), contratos do mês | — |
| Aprovações pendentes | Idem N1 | Aprovar / Rejeitar parceiro |
| Carteira (todos) | Tabela: parceiro, condomínios reservados, propostas, contratos | Ver detalhe |
| Fila de propostas a aprovar | Lista `status='pending'` | Abrir detalhe |
| Detalhe de proposta | Resumo + cascade preview + thread de eventos | Aprovar (assinar contrato), Rejeitar, Pedir ajuste (→ under_negotiation) |
| Propostas em negociação | Lista `status='under_negotiation'` + comentários | Adicionar comentário; aprovar; rejeitar |
| Contratos ativos | Lista com flag "1ª paga / não paga" | Ver detalhe; (sem botão cancelar — é só N1) |
| Marcar pagamento | Lista de `payments` não pagas filtrável por contrato | Marcar como pago (com `paid_at`) — dispara cascata |
| Comissões | Visão tabular como N1, sem export | — |

---

## Papel: Admin N3 (Backoffice Técnico)

### Sidebar
```
🏠 Fila de vistorias
📋 Minhas aprovações (histórico)
🏢 Condomínios (read)
📦 Catálogo (read)
```

### Telas detalhadas

| Tela | Componentes | Ações |
|---|---|---|
| Fila de vistorias | Lista de `inspections.status='submitted'` ordenada por antiguidade; preview com parceiro e condomínio | Abrir detalhe |
| Detalhe de vistoria | `technical_data` formatado + galeria de fotos (`inspection_photos`) + dados do condomínio | Aprovar / Rejeitar (com motivo) |
| Histórico | Vistorias revisadas por mim com filtros | Read-only |
| Condomínios (read) | Tabela limitada; sem botão de bloquear/excluir | — |

> **N3 não tem acesso a finanças, propostas, contratos, parceiros.** Foco cirúrgico na fila de vistorias.

---

## Papel: Parceiro

### Sidebar (parceiro sem sub-rede)
```
🏠 Dashboard
🏢 Condomínios
   ├── Buscar disponíveis
   └── Minhas reservas
🔍 Vistorias
   └── Pendentes / em andamento
📝 Propostas
   ├── Nova proposta
   └── Minhas propostas
💰 Minha carteira
   └── Comissões (Liberado / Futuro)
🔗 Convidar parceiro
```

### Sidebar adicional (parceiro com sub-rede — apareceu pelo menos 1 convidado)
```
👥 Minha equipe
   ├── Árvore (descendentes)
   ├── Propostas da equipe
   └── Comissões de override
```

### Telas detalhadas — núcleo

| Tela | Componentes | Ações |
|---|---|---|
| Dashboard | Cards: saldo liberado, saldo futuro, propostas em andamento, condomínios reservados, alertas (reservas expirando em <48h, vistorias pendentes) | Atalhos para cada |
| Buscar condomínios | Lista filtrável (UF, cidade, tamanho); cada item mostra status `available` e botão "reservar" | Reservar (server action) |
| Minhas reservas | Tabela: condomínio, reservado em, expira em (countdown), próximo passo (fazer vistoria / criar proposta) | Liberar manualmente, ir para vistoria, criar proposta |
| Vistorias pendentes | Reservas que ainda não têm `inspection` aprovada | Iniciar vistoria |
| Form de vistoria | Wizard: dados técnicos (`technical_data` schema), upload de fotos via Supabase Storage | Salvar rascunho, enviar para aprovação |
| Nova proposta | Wizard: condomínio (só os c/ vistoria aprovada) → seleção de módulos (catálogo regional com uplift) → `sale_price` → **preview da cascata** mostrando seu ganho e dos coautores → confirmar | Salvar rascunho, enviar |
| Minhas propostas | Tabela com status, condomínio, valor, ações | Editar (se status permite), reenviar, ver detalhe + chat de negociação |
| Detalhe de proposta | Resumo + thread de `proposal_events` (chat com a Matriz) + cascade preview congelado | Comentar (em negociação), editar (em draft/negotiation), excluir (em draft) |
| Minha carteira / Comissões | Duas abas: **Liberado** (released) e **Futuro** (future) — agrupado por contrato | Ver detalhe |
| Detalhe de comissão | Quanto recebeu, de qual contrato, qual papel (author/coauthor), status | — |
| Convidar parceiro | Form: `commission_pct` que será usada pelo convidado + prazo de validade do convite | Gerar link; ver convites pendentes / consumidos |

### Telas adicionais (parceiro com sub-rede)

| Tela | Componentes | Ações |
|---|---|---|
| Árvore (descendentes) | Visualização hierárquica da sub-rede, com nome, status, nº de propostas, comissão gerada | Inativar parceiro da minha sub-rede |
| Propostas da equipe | Lista de todas as propostas onde `author_id ∈ descendants_of(me)` | Ver detalhe (read-only, sem editar) |
| Comissões de override | Comissões onde sou `coauthor` de uma venda feita por descendente | Drill-down por descendente |

> **O que o parceiro NUNCA vê**, mesmo na própria árvore: `markup_pct_applied` dos descendentes (RLS deixa passar a row porque ele é beneficiário em alguma comissão; a UI esconde esse campo nas linhas onde `beneficiary_id ≠ self`).

---

## Matriz consolidada de rotas × papel

| Rota base | N1 | N2 | N3 | Parceiro |
|---|---|---|---|---|
| `/app/admin/dashboard` | ✅ | ✅ | ❌ | ❌ |
| `/app/admin/partners/*` | ✅ | ⚠️ (sem inativar global) | ❌ | ❌ |
| `/app/admin/condos/*` | ✅ | ✅ (sem excluir) | 🔍 read | ❌ |
| `/app/admin/proposals/*` | ✅ aprovar/assinar | ✅ aprovar/recusar | ❌ | ❌ |
| `/app/admin/contracts/*` | ✅ (incl. cancelar) | 🔍 read | ❌ | ❌ |
| `/app/admin/payments/*` | 🔍 | ✅ marcar pago | ❌ | ❌ |
| `/app/admin/commissions/*` | ✅ | ✅ | ❌ | ❌ |
| `/app/admin/price-tables/*` | ✅ | ❌ | ❌ | ❌ |
| `/app/admin/catalog/*` | ✅ | 🔍 read | 🔍 read | ❌ |
| `/app/admin/settings/*` | ✅ | ❌ | ❌ | ❌ |
| `/app/admin/audit/*` | ✅ | ❌ | ❌ | ❌ |
| `/app/inspections/queue` | 🔍 | 🔍 | ✅ | ❌ |
| `/app/partner/dashboard` | ❌ | ❌ | ❌ | ✅ |
| `/app/partner/condos/*` | ❌ | ❌ | ❌ | ✅ |
| `/app/partner/inspections/*` | ❌ | ❌ | ❌ | ✅ |
| `/app/partner/proposals/*` | ❌ | ❌ | ❌ | ✅ |
| `/app/partner/wallet` | ❌ | ❌ | ❌ | ✅ |
| `/app/partner/invites` | ❌ | ❌ | ❌ | ✅ |
| `/app/partner/team/*` | ❌ | ❌ | ❌ | ⚠️ só se tem descendentes |

Legenda: ✅ acesso pleno • ⚠️ acesso parcial/condicional • 🔍 read-only • ❌ negado

---

## Componentes reutilizáveis (a destacar no design system)

- **`CommissionCascadeViewer`** — usado no preview de proposta e no detalhe de contrato. Recebe `{ sale_price, base_cost_master, levels: [{user, pct, amount}] }`. Esconde colunas conforme RLS de UI.
- **`StatusBadge`** — variantes por enum (proposal, contract, commission, condo, user).
- **`TreeView`** — navegação de árvore (admin completa, parceiro só descendentes).
- **`MoneyDisplay`** — formatação BRL com tooltip de auditoria (em telas de admin).
- **`ConfirmDestructive`** — dialog para ações irreversíveis (cancelar contrato, excluir condo).
- **`InviteLinkGenerator`** — form + cópia do link gerado.

---

## Estimativa grosseira de escopo

| Papel | Telas únicas | Telas reaproveitadas | Total efetivo |
|---|---|---|---|
| Admin N1 | ~18 | 4 comuns | 22 |
| Admin N2 | ~11 (compartilha muito com N1) | 4 | 15 |
| Admin N3 | ~4 | 4 | 8 |
| Parceiro | ~14 (3 condicionais à sub-rede) | 4 | 18 |
| **Total único** | — | — | **~35 telas** |

> A maioria das telas administrativas é a mesma componentização com permissões diferentes. Não é 35 × tela do zero.

---

## Pontos para próxima rodada

1. **Notificações em tempo real**: o que dispara push? (proposta aprovada, mensalidade marcada, novo convidado entrou na sub-rede, vistoria aprovada/rejeitada). Confirmar lista antes de modelar `notifications`.
2. **Wizard de vistoria**: o schema de `technical_data` (jsonb) precisa ser desenhado — quais campos, quais obrigatórios, quais condicionais.
3. **Exportações**: quais telas precisam de export CSV/PDF no MVP? (Listei só "Comissões — N1".)
4. **Mobile-first?** Parceiro fará vistoria em campo, então o fluxo de vistoria deve ser **mobile-first**. Resto pode ser desktop-first.
