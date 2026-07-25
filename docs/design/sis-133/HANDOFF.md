# Handoff de Design — Painel Super-admin (lista / detalhe / ações)

**Issue:** [SIS-133](/SIS/issues/SIS-133) · pai [SIS-116](/SIS/issues/SIS-116) · implementação [SIS-132](/SIS/issues/SIS-132)
**Spec de origem:** `docs/specs/super-admin-user-mgmt.md` (seção UI + copy)
**Fundação:** `docs/design/sis-66/HANDOFF.md` (tokens, shell, auth) · `docs/specs/auth-shell-pwa.md`
**Papel:** Head of Design · **Data:** 2026-07-25
**Pipeline:** Frontend Design → UI UX Pro Max → Impeccable (Operate) → Web Interface Guidelines → Sistema

**Artefatos**

| Arquivo | O que é |
|---------|---------|
| `docs/design/sis-133/prototype.html` | Referência visual estática (abrir no navegador). Não é código de produção. |
| `docs/design/sis-133/screens/01-lista-desktop.png` | Lista, estado padrão, 1280 |
| `docs/design/sis-133/screens/02-detalhe-desktop.png` | Detalhe + confirmação em duas etapas |
| `docs/design/sis-133/screens/03-confirmacao-destrutiva.png` | Dialog de Invalidar senha (SMTP ausente) |
| `docs/design/sis-133/screens/04-estados.png` | Carregando, vazio, erro, criar conta, sucesso, sem permissão |
| `docs/design/sis-133/screens/05-mobile-lista.png` · `06-mobile-detalhe.png` | 390px |

---

## 0. Contrato de direção

**Modo:** Operate — o operador está numa tarefa, não sendo persuadido.
**Job único da superfície:** achar uma conta e executar uma ação de credencial **entendendo a consequência** antes de clicar.
**Público:** 1–5 operadores internos de suporte/ops CondoPartners, desktop na maior parte do tempo, celular em campo.

**Mundo herdado (SIS-66, preservado):** painel de portaria — papel frio, tinta slate, azul-aço, acento teal, Public Sans, hairlines de 1px, raio 0.5rem, sombra máxima `0 1px 2px rgb(11 31 51 / 0.06)`. Esta fatia **refina**, não redesenha: nenhum token novo, nenhuma cor nova, nenhuma dependência nova.

**Assinatura desta superfície:** o bloco **“Credencial e acesso”** — cada ação é uma linha com título, **frase de consequência** e botão à direita. A consequência fica escrita ao lado do botão, não escondida atrás de um menu `⋮`. É isso que diferencia o painel de um CRUD genérico: ele é auditável de olho nu.

**Anti-padrões proibidos aqui**

- Dashboard/hero com métricas (“24 usuários”, “3 ativos hoje”) — não foi pedido e não ajuda ninguém.
- Cards de mesmo tamanho como estrutura de página; card dentro de card.
- Menu `⋮` por linha escondendo ações destrutivas.
- Roxo/glass/gradiente/glow; borda colorida > 1px; card vermelho de “perigo”.
- Modal para tarefa que não precisa de interrupção (criar conta, definir senha).
- Toast como único feedback (não existe infra de toast no app — não inventar).
- Ban/impersonation/promoção de papel na UI (fora de escopo pela spec).
- Histórico de auditoria na UI: a tabela `admin_audit_event` existe, mas **não há endpoint de leitura no MVP** → não desenhar, não inventar. Fase 2.

---

## 1. Navegação, rotas e hierarquia de títulos

O app **não tem router** (`apps/web/src/App.tsx` alterna auth/shell por sessão) e a regra `rules/40-frontend.md` proíbe adicionar biblioteca de rotas sem spec. Então:

| Superfície | URL | Observação |
|-----------|-----|------------|
| Lista | `#/admin` | busca e página no próprio hash: `#/admin?q=maria&pagina=2` |
| Detalhe | `#/admin/usuarios/{userId}` | deep-link direto; recarregar mantém a tela |
| Sem permissão | `#/admin` com sessão não-admin | render de “Área restrita” (sem redirect silencioso) |

- Estado de busca/página/usuário **vive na URL** (hash), não só em `useState` — atende a diretriz de deep-link sem dependência nova.
- Item de nav **Admin** (ícone Lucide `Users`) aparece **só** para `role === "admin"` (ou id em `adminUserIds`), abaixo de **Início**, usando o padrão de ativo já definido na SIS-66 (fundo muted + barra 3px `--cp-accent`).
- Links de navegação são `<a href>` de verdade (Cmd/Ctrl+clique e botão do meio funcionam). Ações são `<button type="button">`.

**Hierarquia de headings (sem `h1` duplicado):**

| Onde | Elemento |
|------|----------|
| `AppHeader` | `h1` = `Usuários` (já existe; visível em `lg`, oculto no mobile por design da SIS-66) |
| Conteúdo da lista | `h2` = `Usuários` com `lg:sr-only` — dá título visível no mobile sem duplicar no desktop |
| Conteúdo do detalhe | `h2` = e-mail do usuário; seções internas em `h3`; título de cada ação em `h4` |

---

## 2. Lista de usuários

```
┌ sidebar 240 ┬ header 56: h1 Usuários ······ e-mail · Sair ─────────────┐
│ ● Início    │  [🔍 Buscar por e-mail ou nome…]        [+ Criar conta]  │
│ ● Admin     │  ┌─────────────────────────────────────────────────────┐ │
│             │  │ Usuário            Papel     Situação    Criada em  │ │
│             │  ├─────────────────────────────────────────────────────┤ │
│             │  │ maria@…            Usuário   ● Ativa     12/07/2026 │ │
│             │  │ Maria Silva                                         │ │
│             │  ├─────────────────────────────────────────────────────┤ │
│             │  │ Mostrando 1–20 de 24        [Anterior] [Próxima]    │ │
└─────────────┴──────────────────────────────────────────────────────────┘
```

**Toolbar** (uma linha, `gap-3`, margem inferior 16px)

- Busca: `type="search"`, `spellCheck={false}`, `autoComplete="off"`, label `sr-only` “Buscar usuários”, ícone `Search` decorativo (`aria-hidden`), largura `flex-0-1-320px`, debounce **300 ms**, sincroniza `?q=` no hash. Sem `autoFocus`.
- CTA primário **Criar conta** à direita, `aria-expanded` refletindo o painel inline.
- **Não** repetir contagem na toolbar — a contagem vive no rodapé da tabela (“Mostrando 1–20 de 24”). Uma informação, um lugar.

**Tabela (≥768px)** — `<table>` semântica com `thead/tbody`, `<th scope="col">`, wrapper `overflow-x-auto`.

| Coluna | Conteúdo | Regras |
|--------|----------|--------|
| Usuário | e-mail (link para o detalhe, 600) + nome em 13px muted embaixo | `translate="no"` no e-mail; `min-w-0` + `truncate`; nome ausente = `—` |
| Papel | `Super-admin` = etiqueta com fundo `#eef2f7`; `Usuário` = etiqueta neutra | sem cor de destaque para papel comum |
| Situação | etiqueta com ponto de 6px: `Ativa` (ponto `--cp-success`) / `Ativação pendente` (ponto `#9aa8b6`) + texto | **obrigatória** — API expõe `emailVerified` (contrato CTO/DEV); a informação não é só cor (tem texto) |
| Criada em | `Intl.DateTimeFormat("pt-BR", { dateStyle: "short" })`, `tabular-nums`, muted | nunca formato hardcoded |

- Linha: `py-2.5`, hover `#f7f9fc`, divisória 1px `#e6ebf2`. Densidade alta é desejada (7–8/10).
- **Um único link por linha** (o e-mail). Sem coluna “Abrir”, sem duplicar destino.
- Paginação: 20 por página, `Anterior`/`Próxima` outline `sm`, desabilitados nos extremos, refletidos em `?pagina=`.
- Até 20 linhas por página: **não** virtualizar.

**Mobile (<768px)** — lista de cards `<a>` (mín. 60px de altura, alvo ≥44px): e-mail 600 truncado, segunda linha `Nome · Situação` em muted, chevron `aria-hidden` à direita. Busca full-width; **Criar conta** full-width `h-11` acima da lista.

**Criar conta** — painel **inline** abaixo da toolbar (não modal), `h3` “Criar conta”, grid de 3 colunas no desktop / 1 no mobile:

| Campo | Label | Attrs | Placeholder |
|-------|-------|-------|-------------|
| E-mail | `E-mail` | `type="email"`, `autoComplete="off"`, `spellCheck={false}`, `inputMode="email"` | `maria@empresa.com.br…` |
| Nome | `Nome` | `type="text"`, `autoComplete="off"` | `Maria Silva…` |
| Senha provisória | `Senha provisória` | `type="password"`, `autoComplete="new-password"` | — (senha nunca tem placeholder) |

Hint sob a senha: **Mínimo 8 caracteres. Combine a troca com o usuário por um canal seguro.**
Ações: `Criar conta` (primário) + `Cancelar` (ghost). Erro de validação **inline junto do campo** e foco no primeiro campo com erro no submit.

---

## 3. Detalhe do usuário

Página no mesmo `main` (não drawer, não modal): sobrevive a reload, não recorta overlay, é idêntica no mobile.

**Cabeçalho**

- Link de volta `‹ Usuários` (13px muted, ícone `ChevronLeft` aria-hidden).
- `h2` = e-mail, 20px/600, `translate="no"`, `overflow-wrap: anywhere` (e-mails longos não estouram).
- Meta em 13px muted: `Nome · Papel · Criada em 12/07/2026`.
- Linha do ID: `ID` + `code` com o id + botão ghost `sm` **Copiar** (o id alimenta `BETTER_AUTH_ADMIN_USER_IDS` em ops — é dado real e útil). Ao copiar: `role="status"` → **ID copiado.**

**Seção “Dados da conta”** (`h3`) — sub: *Alterações valem para o próximo acesso do usuário.*

- Grid de 2 colunas: `Nome`, `E-mail` (hint: *Trocar o e-mail muda o login do usuário.*).
- E-mail é **editável** (`better-auth@1.6.25` `adminUpdateUser` + `user: ["set-email"]` — contrato CTO/DEV). Não usar `readOnly`.
- `Salvar alterações`: **desabilitado até haver mudança**; durante o submit vira `Salvando…` com spinner; sucesso = `role="status"` inline **Alterações salvas.**

**Seção “Credencial e acesso”** (`h3`) — sub: *Toda ação aqui é registrada na auditoria com quem executou e quando.*

Ordem fixa (menos → mais destrutivo). Cada linha: `h4` + frase de consequência (máx. ~62ch) + controle à direita.

| # | Ação | Frase de consequência | Confirmação |
|---|------|----------------------|-------------|
| 1 | Definir senha | Define uma nova senha agora. As sessões abertas continuam ativas. | nenhuma (form inline `Nova senha` + botão outline) |
| 2 | Enviar link de reset | Manda um e-mail para o usuário criar a própria senha. Exige SMTP configurado. | nenhuma |
| 3 | Encerrar sessões | Desconecta o usuário de todos os dispositivos. A senha atual continua valendo. | **duas etapas inline** |
| 4 | Invalidar senha | Encerra as sessões e invalida a senha atual. O usuário só volta a acessar com um novo link de reset. | **dialog modal** |

- A linha 4 é separada por divisória 1px `--cp-border` e tem o `h4` em `--cp-danger` (5.9:1 sobre branco). **Sem** card vermelho, **sem** borda colorida grossa, **sem** fundo tingido.
- Botão de 4: outline com borda `#e2b3ae` e texto `--cp-danger`; vermelho preenchido aparece **só** no botão de confirmação do dialog.
- No mobile: mesma ordem, ações empilhadas, botões full-width `h-11`; a seção “Dados da conta” vem antes.

---

## 4. Confirmação destrutiva (dois padrões, por severidade)

**Encerrar sessões — duas etapas inline.** O clique troca a linha por uma barra de confirmação (fundo `--cp-paper`, largura total da linha, o gatilho desaparece): pergunta **Encerrar as sessões abertas agora?** + `Encerrar sessões` (primário `sm`) + `Cancelar` (ghost `sm`). Foco vai para o botão de confirmar; `Esc` cancela; a barra é `role="group"` com `aria-label="Confirmar encerramento de sessões"`. Nada de modal: é reversível (o usuário só faz login de novo).

**Invalidar senha — dialog modal.** É irreversível para o usuário até um novo reset, então merece interrupção. Usar **`<dialog>` nativo com `showModal()`** — dá trap de foco, `Esc`, backdrop e `inert` sem dependência nova (não adicionar Radix AlertDialog nesta fatia).

- `role="alertdialog"`, `aria-labelledby` no título e `aria-describedby` no corpo.
- Título: **Invalidar a senha de maria.silva@cliqueretire.com.br?** (e-mail com `translate="no"`, `overflow-wrap: anywhere`).
- Corpo: *As sessões abertas são encerradas e a senha atual deixa de funcionar. O usuário só volta a acessar com um novo link de reset.*
- Quando SMTP não estiver disponível, adicionar aviso dentro do dialog: *SMTP não está configurado: o link de reset **não** será enviado agora. Envie depois em “Enviar link de reset”.*
- Ações alinhadas à direita: `Cancelar` (ghost, foco inicial) + `Invalidar senha` (vermelho preenchido). Durante a execução: `Invalidando…` com spinner, `Cancelar` desabilitado.
- `overscroll-behavior: contain` no dialog; ao fechar, foco volta ao botão que abriu.

---

## 5. Estados (contrato completo)

| Superfície | Estado | UI | Copy | A11y |
|-----------|--------|-----|------|------|
| Lista | Carregando | 5 linhas de **skeleton** dentro da tabela (nunca spinner central) | texto `sr-only` **Carregando usuários…** | `aria-busy="true"` no `tbody` |
| Lista | Busca sem resultado | bloco centrado na superfície | **Nenhum usuário encontrado** · *Nada corresponde a “{termo}”. Tente parte do e-mail ou limpe a busca.* + `Limpar busca` | — |
| Lista | Primeira vez (nenhuma conta) | bloco centrado | **Nenhuma conta criada ainda** · *Crie a primeira conta de acesso para começar a operar a plataforma.* + `Criar conta` (primário) | — |
| Lista | Erro de carregamento | faixa de erro acima da tabela + `Tentar de novo` | **Não foi possível carregar os usuários. Verifique a conexão e tente de novo.** | `role="alert"` |
| Lista | Buscando (digitação) | mantém as linhas atuais com `opacity-70`; **não** desmonta a tabela | — | `aria-busy` no `tbody` |
| Criar conta | Enviando | botão `Criando conta…` + spinner; botão só desabilita **depois** do início da requisição | — | `aria-busy` no form |
| Criar conta | Sucesso | painel fecha, linha nova aparece, mensagem inline | **Conta criada. Compartilhe a senha provisória com o usuário.** | `role="status"` |
| Criar conta | E-mail já existe | erro inline no campo E-mail | **Este e-mail já tem conta.** | `aria-invalid` + `aria-describedby` |
| Detalhe | Carregando | skeleton do cabeçalho + dos blocos | `sr-only` **Carregando usuário…** | `aria-busy` |
| Detalhe | Não encontrado (404) | bloco centrado | **Usuário não encontrado** · *A conta pode ter sido removida. Volte para a lista.* + `Voltar para Usuários` | — |
| Ação | Em andamento | botão da própria ação vira `Definindo…` / `Enviando…` / `Encerrando…` / `Invalidando…` com spinner; demais ações da seção desabilitadas | — | `aria-busy` na seção |
| Ação | Sucesso | mensagem inline **no bloco da ação** (não toast), persiste até a próxima ação | ex.: **Senha invalidada e sessões encerradas. Link de reset enviado para {e-mail}.** | `role="status"` |
| Ação | Erro sem SMTP | mensagem de erro inline no bloco | **Não foi possível enviar o e-mail. Verifique a configuração de SMTP.** | `role="alert"` |
| Ação | Erro genérico | mensagem de erro inline no bloco | **Não foi possível concluir a ação. Tente de novo.** | `role="alert"` |
| Ação | Invalidar sem mailer | ação **completa** a invalidação e informa que o link não saiu | **Senha invalidada e sessões encerradas. O link de reset não foi enviado: SMTP não está configurado.** | `role="status"` |
| Admin | Sem permissão | bloco centrado (sem redirect silencioso) | **Área restrita** · *Esta área é só para super-admins da plataforma. Se precisa de acesso, fale com quem administra a conta.* + `Voltar ao início` | — |

Regra de sucesso/erro: mensagem **perto do controle que a gerou**, nunca só no topo da página.

---

## 6. Copy pt-BR consolidada

Base = tabela da spec. Onde refinei, está marcado — a spec autoriza refino de Design (§UI).

| Contexto | Copy | vs. spec |
|----------|------|----------|
| Nav | `Admin` | igual |
| Título da lista (`h1` do header) | `Usuários` | igual |
| CTA criar | `Criar conta` | igual |
| Busca (label `sr-only`) | `Buscar usuários` | novo |
| Busca (placeholder) | `Buscar por e-mail ou nome…` | novo |
| Colunas | `Usuário` · `Papel` · `Situação` · `Criada em` | novo |
| Papéis | `Super-admin` · `Usuário` | igual (rótulo de UI da spec) |
| Situação | `Ativa` · `Ativação pendente` | novo (obrigatório — `emailVerified` confirmado) |
| Paginação | `Mostrando 1–20 de 24` · `Anterior` · `Próxima` | novo |
| Campo e-mail | `E-mail` | igual |
| Campo nome | `Nome` | igual |
| Campo senha (criar) | `Senha provisória` | **refinado** — “Senha” não dizia que é temporária |
| Campo senha (definir) | `Nova senha` | **refinado** — o contexto é troca, não cadastro |
| Hint da senha provisória | `Mínimo 8 caracteres. Combine a troca com o usuário por um canal seguro.` | novo (não promete e-mail que pode não existir) |
| Ação | `Definir senha` | igual |
| Ação | `Enviar link de reset` | igual |
| Ação | `Invalidar senha` | igual |
| Ação | `Encerrar sessões` | igual |
| Consequência 1 | `Define uma nova senha agora. As sessões abertas continuam ativas.` | novo |
| Consequência 2 | `Manda um e-mail para o usuário criar a própria senha. Exige SMTP configurado.` | novo |
| Consequência 3 | `Desconecta o usuário de todos os dispositivos. A senha atual continua valendo.` | novo |
| Consequência 4 | `Encerra as sessões e invalida a senha atual. O usuário só volta a acessar com um novo link de reset.` | novo |
| Confirmação inline (sessões) | `Encerrar as sessões abertas agora?` | novo |
| Dialog invalidar — título | `Invalidar a senha de {e-mail}?` | **refinado** |
| Dialog invalidar — corpo | `As sessões abertas são encerradas e a senha atual deixa de funcionar. O usuário só volta a acessar com um novo link de reset.` | **refinado** (a spec tinha “Isso encerra as sessões e invalida a senha atual. Continuar?”) |
| Dialog invalidar — botões | `Cancelar` · `Invalidar senha` | novo (o botão repete o nome da ação, não “Confirmar”) |
| Dialog — aviso sem SMTP | `SMTP não está configurado: o link de reset não será enviado agora. Envie depois em “Enviar link de reset”.` | novo |
| Erro sem SMTP | `Não foi possível enviar o e-mail. Verifique a configuração de SMTP.` | igual |
| Erro genérico | `Não foi possível concluir a ação. Tente de novo.` | igual |
| Vazio (busca) | `Nenhum usuário encontrado` + apoio | **refinado** — a spec tinha uma frase só para três situações diferentes |
| Vazio (primeira vez) | `Nenhuma conta criada ainda` + apoio | novo |
| Sem permissão | `Área restrita` + apoio | novo |
| Seções | `Dados da conta` · `Credencial e acesso` | novo |
| Auditoria (sub) | `Toda ação aqui é registrada na auditoria com quem executou e quando.` | novo |
| Salvar | `Salvar alterações` / `Salvando…` / `Alterações salvas.` | novo |
| Copiar ID | `Copiar` / `ID copiado.` | novo |

**Regras de escrita:** sentence case (pt-BR, não Title Case — decisão local já registrada na SIS-66); segunda pessoa (“você”/imperativo); o botão repete o nome da ação em toda a jornada; erro nomeia problema **e** próximo passo; reticências `…` (um caractere) em rótulos de carregamento e placeholders; aspas curvas `“ ”`.

---

## 7. Acessibilidade e auditoria (Web Interface Guidelines)

Checklist que a implementação precisa cumprir:

- [ ] Botão só de ícone (`Menu`, `Copiar` sem texto) com `aria-label`; ícones decorativos com `aria-hidden="true"`.
- [ ] Todo input com `<label>` visível ou `sr-only` associado por `htmlFor`; nunca placeholder como único rótulo.
- [ ] `type`/`inputMode` corretos; `spellCheck={false}` em e-mail e busca; `autoComplete="off"` em campos que o admin preenche por outra pessoa; `new-password` nos campos de senha.
- [ ] Nunca bloquear colar (sem `onPaste` + `preventDefault`).
- [ ] Erros de campo **inline** e foco no primeiro erro no submit.
- [ ] Botão de submit permanece habilitado até a requisição começar; spinner durante.
- [ ] `role="alert"` em erro, `role="status"` em sucesso; nada de mudança silenciosa.
- [ ] `focus-visible` em todo controle (o `ring-ring` do `Button` já cobre); nunca `outline: none` sem substituto.
- [ ] Tabela semântica (`thead`/`tbody`/`th scope`), wrapper `overflow-x-auto`; cards no mobile.
- [ ] `min-w-0` + `truncate` em e-mail; `overflow-wrap: anywhere` no `h2` do detalhe; nome vazio = `—`.
- [ ] `tabular-nums` em datas, contagens e id.
- [ ] `Intl.DateTimeFormat("pt-BR")` para datas; nada de formato fixo.
- [ ] `translate="no"` em e-mails e ids.
- [ ] Alvos de toque ≥44×44px no mobile; `touch-action: manipulation` nos botões (já no `Button`).
- [ ] `prefers-reduced-motion`: sem animação de entrada; spinner desacelera. Transições listam propriedades (`background-color`, `border-color`, `color`) — nunca `transition: all`.
- [ ] Ação destrutiva sempre com confirmação (nunca imediata) — dois padrões da §4.
- [ ] Dialog nativo com foco preso, `Esc`, retorno de foco e `overscroll-behavior: contain`.
- [ ] Estado na URL (`#/admin?q=&pagina=`, `#/admin/usuarios/{id}`); links com `<a>`.
- [ ] Sem scroll horizontal em 375px; safe-area já herdada do `AppShell`.
- [ ] Contraste: texto ≥4.5:1 (muted `#5B6B7C` sobre `#F3F5F8` = 5.0:1; `--cp-danger` sobre branco = 5.9:1; branco sobre `--cp-danger` = 5.9:1).
- [ ] Não desabilitar zoom.

**Divergências assumidas da guideline (decisão local, registrada):**

| Guideline | Decisão CondoPartners | Motivo |
|-----------|----------------------|--------|
| Title Case em títulos/botões | sentence case | produto é pt-BR; já decidido na SIS-66 |
| “Bulk actions” em tabela | fora | ações destrutivas em lote em conta de acesso = risco alto sem pedido do board |
| Autocomplete/sugestão na busca | fora | base pequena (dezenas de contas); busca com debounce resolve |
| Virtualização de lista | fora | 20 linhas por página |

---

## 8. Sistema (fase Astryx — skill ausente na company library)

Registro local, igual à SIS-66. **Nenhum token novo de cor, tipografia ou raio.** Novidades são todas de composição:

| Primitivo | Onde | Regra |
|-----------|------|-------|
| `Badge` | `components/ui/badge.tsx` | etiqueta 22px, borda 1px, `rounded-full`, 12px/500. Variantes: `neutral` (default) e `strong` (papel admin). Ponto de estado é um `span` de 6px **acompanhado de texto** — cor nunca é a única portadora de significado. |
| `Table` | `components/ui/table.tsx` | wrappers finos e semânticos (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`) com as classes de densidade deste handoff. Sem TanStack Table nesta fatia. |
| `Skeleton` | `components/ui/skeleton.tsx` | bloco `rounded` com gradiente estático; sem shimmer infinito. |
| `StatusMessage` | `components/ui/status-message.tsx` | props `tone: "error" \| "success" \| "info"` → aplica `role="alert"` (error) ou `role="status"`. Ícone + texto + slot de ação. **Único** canal de feedback do app enquanto não houver toast. |
| `ConfirmDialog` | `components/ui/confirm-dialog.tsx` | wrapper de `<dialog>` nativo com `showModal()`, `role="alertdialog"`, título/descrição/ações e `onConfirm` com estado de carregamento. Sem dependência nova. |
| `Field` | `components/ui/field.tsx` (opcional) | `Label` + `Input` + hint + erro (`aria-describedby`/`aria-invalid`) para não repetir a fiação em cada form. |
| `ActionRow` | `components/admin/action-row.tsx` | linha de ação: título, consequência, controle à direita, variante `destructive`. É o padrão que qualquer tela futura de ações sensíveis reusa. |

Regras de sistema que valem para as próximas telas:

1. Cores só via token `--cp-*` / alias shadcn — sem hex solto em JSX.
2. Ícones **Lucide** apenas (`Users`, `Search`, `Plus`, `ChevronLeft`, `ChevronRight`, `Copy`, `KeyRound`, `MailWarning`, `LogOut`, `Menu`). Sem emoji, sem misturar biblioteca (a base de dados de skills sugere Phosphor — **ignorar**, o sistema aqui é Lucide).
3. Feedback = `StatusMessage` inline. Quem quiser toast abre spec própria.
4. Confirmação destrutiva = `ConfirmDialog` (irreversível) ou duas etapas inline (reversível). Escolha documentada por ação.
5. Tabela densa + cards no mobile é o padrão de listagem do produto (vale para Partners/Comissões depois).
6. Sem nova dependência de UI (router, dialog, table, form lib) sem spec aprovada.

---

## 9. Mapa para o DEV

| Entrega de design | Arquivo alvo sugerido |
|-------------------|----------------------|
| Item de nav Admin (gate por role) | `apps/web/src/components/layout/app-sidebar.tsx` |
| Alternância de rota por hash | `apps/web/src/App.tsx` (+ hook fino `use-hash-route.ts`) |
| Lista, toolbar, tabela, cards mobile | `apps/web/src/components/admin/users-list.tsx` |
| Painel Criar conta | `apps/web/src/components/admin/create-user-panel.tsx` |
| Detalhe (dados + credencial) | `apps/web/src/components/admin/user-detail.tsx` |
| Linha de ação | `apps/web/src/components/admin/action-row.tsx` |
| Primitivos novos | `apps/web/src/components/ui/{badge,table,skeleton,status-message,confirm-dialog,field}.tsx` |
| Chamadas de API | cliente Better Auth admin em `apps/web/src/lib/auth-client.ts` |

Se o wiring da [SIS-132](/SIS/issues/SIS-132) já usa outros nomes, **mantenha os seus** e aplique o conteúdo deste handoff neles — o mapa é sugestão, o contrato de UI não é.

---

## 10. Aceite visual

1. Nav **Admin** só para super-admin; `#/admin` de usuário comum mostra **Área restrita** (sem redirect silencioso).
2. Lista com busca (`?q=`), tabela densa em ≥768px, cards em <768px, paginação com “Mostrando X–Y de Z”.
3. Detalhe com cabeçalho (e-mail + meta + ID copiável), **Dados da conta** e **Credencial e acesso** na ordem da §3, cada ação com sua frase de consequência.
4. `Encerrar sessões` pede confirmação em duas etapas inline; `Invalidar senha` abre dialog com foco preso e `Esc`.
5. Todos os estados da §5 implementados: skeleton, três vazios distintos, erro com `role="alert"`, sucesso com `role="status"`, degradação explícita sem SMTP.
6. Copy exatamente igual à §6.
7. 375px sem scroll horizontal; alvos ≥44px; foco visível em tudo; datas via `Intl`.
8. Sem cards de métrica, sem menu `⋮`, sem toast, sem token/dependência nova.

---

## 11. Contrato técnico travado (CTO/DEV — 2026-07-25)

Respostas do DEV na [SIS-133](/SIS/issues/SIS-133), confirmadas pelo CTO. **Não há pergunta aberta.**

| # | Decisão | Implementação |
|---|---------|---------------|
| 1 | **Rota por hash, sem router** | Lista `#/admin?q=&pagina=`; detalhe `#/admin/usuarios/{id}`. Alinhado a `rules/40-frontend.md`. |
| 2 | **`emailVerified` disponível** | Coluna **Situação** entra sempre (`Ativa` / `Ativação pendente`). Não omitir. |
| 3 | **SMTP: sem flag web dedicada (hoje)** | Fallback deste handoff: botão **Enviar link de reset** habilitado; erro explícito pt-BR no submit (§5). Se o polish da [SIS-132](/SIS/issues/SIS-132) expuser `smtpConfigured` barato, desabilitar com motivo visível; senão manter fallback. |
| 4 | **Troca de e-mail suportada** | Campo **editável** (não `readOnly`). |
| 5 | **`total` disponível** | Rodapé “Mostrando X–Y de N” (§2). |

**Próximo passo Design:** auditoria de UI (pipeline Auditoria + Sistema) quando a PR de implementação da [SIS-132](/SIS/issues/SIS-132) estiver aberta — não antes.

---

## 12. Notas de pipeline

| Fase | Resultado |
|------|-----------|
| 1 Frontend Design | Mundo da SIS-66 preservado (refino, não redesenho); assinatura = bloco “Credencial e acesso” com consequência escrita ao lado do botão |
| 2 UI UX Pro Max | `--design-system` com dials variance 3 / motion 2 / density 8. O match do banco retornou padrão de **landing** de operações (“Real-Time / Operations Landing” + “Exaggerated Minimalism” + Fira) — **descartado** por ser superfície errada; aproveitadas as regras de `ux` (tabela com overflow, empty states, confirmação destrutiva, no-results) e de `stack shadcn` (tabela semântica, label sempre visível, foco gerenciado pelo dialog) |
| 3 Impeccable | Modo Operate; critique sobre os screenshots renderizados gerou: remoção da contagem duplicada na toolbar, confirmação inline passando a ocupar a linha inteira, remoção do fundo falso na ação destrutiva (virou divisória + título em `--cp-danger`), remoção do hint redundante em “Salvar alterações” |
| 4 Web Interface Guidelines | Checklist da §7 + divergências locais registradas (sentence case, sem bulk action, sem autocomplete, sem virtualização) |
| 5 Sistema (Astryx) | Skill **não instalada** na company library → registro local na §8: 7 primitivos, zero token novo, zero dependência nova |
