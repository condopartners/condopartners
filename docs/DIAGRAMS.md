# Diagramas Visuais — Clique Retire Partners

> Visuais imprimíveis para mesa de reunião + rabisco. Cada diagrama em uma página A4.
>
> **Como renderizar/imprimir:**
> - **VS Code:** instala extensão "Markdown Preview Mermaid Support" → abre preview (Ctrl+Shift+V) → imprime
> - **One-off:** cola o bloco em https://mermaid.live → exporta PNG/SVG → imprime
> - **PDF:** preview no VS Code → Imprimir → "Salvar como PDF"

---

## 1. Arquitetura macro (sistema de ponta a ponta)

```mermaid
flowchart TB
    subgraph Browser["Browser / Mobile"]
        UI["Next.js App<br/>(App Router + Tailwind + shadcn/ui)"]
    end

    subgraph Edge["Vercel Edge"]
        MW["Middleware<br/>(resolve papel + tenant)"]
        RH["Route Handlers<br/>+ Server Actions"]
    end

    subgraph Supabase["Supabase"]
        AUTH["Auth<br/>(JWT + RBAC)"]
        DB[("Postgres 15+<br/>RLS + plpgsql")]
        STORE["Storage<br/>(inspection-photos)"]
        CRON["pg_cron<br/>(reservas + contratos)"]
        RT["Realtime<br/>(notificações)"]
    end

    UI --> MW
    MW --> RH
    RH -->|"anon key + RLS"| DB
    RH -->|"service_role<br/>(sign, payment)"| DB
    RH --> AUTH
    RH --> STORE
    UI -.->|"subscribe"| RT
    RT --> DB
    CRON --> DB

    style DB fill:#ffe0b2,stroke:#e65100,stroke-width:3px
    style UI fill:#e1f5fe
    style AUTH fill:#e8f5e9
```

**Pontos de leitura:**
- Postgres é o **coração** (destacado). Auth, RLS, regra crítica de comissão, jobs — tudo aqui.
- Route Handlers usam `service_role` **só** em operações que precisam bypassar RLS (assinatura, marcar pagamento).
- Sem backend separado, sem worker externo.
- **Multi-tenant:** um único projeto (`condopartners`) serve todas as empresas; toda tabela carrega `tenant_id` e a RLS é escopada por tenant (`DATA_MODEL.md` §0).

---

## 2. Cascata de comissão — exemplo numérico (R$ 1.200 venda)

```mermaid
flowchart TD
    M["💰 Matriz<br/>Custo base: R$ 1.000,00<br/>Venda: R$ 1.200,00<br/>Margem total: R$ 200,00"]
    P1["Parceiro 1 (topo da árvore)<br/>commission_pct: 10%<br/>Valor base visível: R$ 1.000,00<br/>Margem residual: R$ 200,00<br/>━━━━━━━━━━━━<br/>🟦 Ganha R$ 20,00 (coautor)"]
    P2["Parceiro 2<br/>commission_pct: 10%<br/>Valor base visível: R$ 1.020,00<br/>Margem residual: R$ 180,00<br/>━━━━━━━━━━━━<br/>🟦 Ganha R$ 18,00 (coautor)"]
    P3["Parceiro 3<br/>commission_pct: 10%<br/>Valor base visível: R$ 1.038,00<br/>Margem residual: R$ 162,00<br/>━━━━━━━━━━━━<br/>🟦 Ganha R$ 16,20 (coautor)"]
    DOTS["... níveis 4 a 9 ...<br/>seguem mesma lógica<br/>geométrica"]
    P10["🎯 Parceiro 10 (vendedor / leaf)<br/>Valor base visível: R$ 1.122,52<br/>━━━━━━━━━━━━<br/>🟩 Ganha R$ 77,48 (autor)"]
    SUM["✅ Soma: R$ 20 + R$ 18 + R$ 16,20 + ... + R$ 77,48 = R$ 200,00<br/>= margem total (sem sobra)"]

    M --> P1
    P1 --> P2
    P2 --> P3
    P3 --> DOTS
    DOTS --> P10
    P10 --> SUM

    style M fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style P10 fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    style SUM fill:#e3f2fd,stroke:#1565c0
```

**Pontos para rabiscar em reunião:**
- E se Parceiro 5 estiver inativo? → linha em `commissions` com `role='house'` (Clique fica com aquele R$ 13,12).
- E se cada parceiro escolher % diferente? → mesma lógica, fórmula vetorial.
- E se a árvore tiver só 3 níveis? → cascata curta, autor pega mais (R$ 162 no caso acima).

---

## 3. Jornada completa do parceiro

```mermaid
flowchart LR
    A([Recebe convite]) --> B[Onboarding<br/>pré-cadastro]
    B --> C{Admin N1/N2<br/>aprova?}
    C -->|Não| Z1([Conta inativa])
    C -->|Sim| D[Buscar<br/>condomínio]
    D --> E[Reservar<br/>CNPJ + endereço<br/>obrigatórios]
    E --> F[Fazer vistoria<br/>em campo<br/>📷 fotos]
    F --> G{Admin N3<br/>aprova?}
    G -->|Não| F
    G -->|Sim| H[Montar proposta<br/>+ preview cascata]
    H --> I[Submeter]
    I --> J{Admin N1/N2}
    J -->|Recusa| Z2([Fim])
    J -->|Negocia| H
    J -->|Aprova| K[📝 Contrato<br/>assinado<br/>commissions=future]
    K --> L[Aguarda 1ª<br/>mensalidade]
    L --> M{N2 marca<br/>como pago?}
    M -->|Sim| N([🟩 Comissão<br/>released])
    M -->|Cancelado| O([🟥 Comissão<br/>void])

    style A fill:#e1f5fe
    style N fill:#c8e6c9
    style K fill:#fff9c4
    style O fill:#ffcdd2
    style Z1 fill:#eeeeee
    style Z2 fill:#eeeeee
```

---

## 4. State machine — Proposta

```mermaid
stateDiagram-v2
    [*] --> draft: Parceiro cria
    draft --> pending: Parceiro submete
    draft --> [*]: Parceiro descarta
    pending --> under_negotiation: Admin pede ajuste
    pending --> rejected: Admin recusa
    pending --> approved: Admin assina
    under_negotiation --> pending: Parceiro reenvia
    under_negotiation --> rejected: Admin recusa
    under_negotiation --> approved: Admin assina
    approved --> [*]: Vira contract<br/>(commissions=future)
    rejected --> [*]
```

## 5. State machine — Contrato e Comissão

```mermaid
stateDiagram-v2
    direction LR
    state Contract {
        [*] --> active: signed
        active --> terminated: end_date<today<br/>(pg_cron)
        active --> cancelled: Admin N1<br/>cancela
        terminated --> [*]
        cancelled --> [*]
    }
    state Commission {
        [*] --> future: cascata calculada<br/>na assinatura
        future --> released: 1ª mensalidade<br/>marcada paga
        future --> void: contrato cancelado<br/>antes da 1ª paga
        released --> [*]: 🟩 intocável<br/>(sem estorno)
        void --> [*]
    }
```

---

## 6. Entidades principais (ER simplificado)

> `tenant_id` (presente em todas as entidades de negócio) foi omitido por legibilidade — ver `DATA_MODEL.md` §0.

```mermaid
erDiagram
    USERS ||--o{ USERS : "parent_id"
    USERS ||--o{ INVITES : "gera"
    USERS ||--o{ CONDOMINIUMS : "reserva"
    USERS ||--o{ PROPOSALS : "autor"
    USERS ||--o{ COMMISSIONS : "beneficiary"
    CONDOMINIUMS ||--o{ INSPECTIONS : "tem"
    INSPECTIONS ||--o{ INSPECTION_PHOTOS : "tem"
    CONDOMINIUMS ||--o{ PROPOSALS : "alvo"
    PROPOSALS ||--o{ PROPOSAL_ITEMS : "compõe"
    PROPOSAL_ITEMS }o--|| MODULES_CATALOG : "ref"
    MODULES_CATALOG ||--o{ MODULE_UF_PRICING : "preço por UF"
    PROPOSALS ||--|| CONTRACTS : "vira"
    CONTRACTS ||--o{ PAYMENTS : "gera"
    CONTRACTS ||--o{ COMMISSIONS : "snapshot"
    PRICE_TABLES ||--o{ PROPOSALS : "snapshot max_price"

    USERS {
        uuid id PK
        uuid parent_id FK
        enum role
        numeric commission_pct
        enum status
    }
    CONDOMINIUMS {
        uuid id PK
        text cnpj UK
        jsonb address
        enum status
        uuid reserved_by FK
    }
    PROPOSALS {
        uuid id PK
        uuid author_id FK
        numeric sale_price
        numeric base_cost_master_snapshot
        enum status
    }
    COMMISSIONS {
        uuid contract_id FK
        uuid beneficiary_id "nullable"
        enum role_in_sale "author/coauthor/house"
        numeric amount
        enum status
    }
    MODULE_UF_PRICING {
        uuid module_id FK
        text uf
        numeric base_value
        numeric uplift_pct
        numeric uplift_amount
    }
```

---

## 7. Matriz visual de permissões (resumo)

```mermaid
flowchart LR
    subgraph Admins
        N1[Admin N1<br/>Diretoria]
        N2[Admin N2<br/>Operacional]
        N3[Admin N3<br/>Backoffice Técnico]
    end

    subgraph Partner["Parceiro"]
        P[Parceiro]
        L[Parceiro líder<br/>= tem descendentes]
    end

    subgraph Acoes["Ações principais"]
        A1[Tabela de Preços]
        A2[Aprovar parceiro]
        A3[Assinar contrato]
        A4[Aprovar vistoria]
        A5[Cancelar contrato]
        A6[Marcar pagamento]
        A7[Convidar parceiro]
        A8[Reservar condo]
        A9[Fazer vistoria]
        A10[Criar proposta]
        A11[Ver override]
    end

    N1 --> A1
    N1 --> A2
    N1 --> A3
    N1 --> A5
    N1 --> A6
    N2 --> A2
    N2 --> A3
    N2 --> A6
    N3 --> A4
    P --> A7
    P --> A8
    P --> A9
    P --> A10
    L --> A11

    style N1 fill:#ffccbc
    style N2 fill:#fff9c4
    style N3 fill:#dcedc8
    style P fill:#bbdefb
    style L fill:#b3e5fc
```

---

## Como usar na reunião

1. **Imprime as 7 páginas** ou abre no iPad com app de anotação.
2. Começa pelo **#1 (Arquitetura)** — 2 min para o time se orientar no mundo.
3. Vai direto para o **#2 (Cascata)** com o exemplo numérico — esse é o **gancho**. Rabisca cenários junto: "e se o nível 4 estiver inativo?", "e se as %s variarem?".
4. Mostra **#3 (Jornada)** para validar que a workflow inteira faz sentido.
5. **#4 e #5 (state machines)** ficam de apoio — só abre se questionarem estados.
6. **#6 (ER)** e **#7 (Permissões)** ficam para quem quiser puxar deep dive.

Cada diagrama tem espaço em branco do lado para anotação.
