# Questões de Negócio em Aberto — Clique Retire Partners

**Objetivo:** fechar as regras de negócio em aberto (5 blocos abaixo) antes do próximo ciclo técnico.
**Formato:** perguntas para debate — nenhuma tem resposta decidida; registrar o que for acordado nos espaços de cada item.

---

## 1. Contratos: Locker vs Parceiro

**Contexto:** o modelo atual trata "contrato" como uma coisa só. A revisão técnica mostrou que **existem duas relações contratuais distintas** que se misturaram. Precisamos separar.

- **Contrato do Locker** = entre Clique e o **condomínio (cliente)**. Define o que o cliente paga e por quanto tempo.
- **Acordo de Parceria** = entre Clique e o **parceiro**. Define a comissão sobre aquela venda específica.

**Perguntas:**

1.1. O contrato do Locker **tem data de fim** definida, ou é vigente até alguém cancelar?

`__________________________________________________________`

1.2. Existem **documentos jurídicos separados** para cada relação (cliente e parceiro), ou um só?

`__________________________________________________________`

1.3. Se o **parceiro sai/é inativado**, o cliente continua ativo? O que acontece com a comissão futura dele?

`__________________________________________________________`

1.4. Se o **cliente cancela** o Locker, o que acontece com a comissão já paga ao parceiro?

`__________________________________________________________`

---

## 2. Modalidades de Comissão

**Contexto:** o modelo atual assume **comissão única**, calculada na assinatura e liberada quando a 1ª mensalidade é paga. A revisão técnica levantou que a operação pode ter outras modalidades (mensal, trimestral, recorrente). Isso muda o desenho.

**Perguntas:**

2.1. Quais modalidades de comissão realmente existem na operação? (marque ou liste)

`[ ] Única (one-shot na 1ª mensalidade)`
`[ ] Mensal recorrente (enquanto o cliente pagar)`
`[ ] Trimestral / outra periodicidade: ____________`
`[ ] Bonificação por meta: ____________`
`[ ] Outras: ____________`

2.2. A modalidade é definida **por contrato** (cada venda pode ter uma) ou **por produto/módulo no catálogo**?

`__________________________________________________________`

2.3. Em comissão recorrente: o parceiro recebe **enquanto for parceiro ativo**, ou **vitalício** mesmo se ele sair?

`__________________________________________________________`

2.4. Se o cliente atrasa pagamento, a comissão recorrente do mês fica **pendente até pagar** ou é **perdida**?

`__________________________________________________________`

---

## 3. Quem Negocia Com Quem

**Contexto:** o status "Em Negociação" das propostas gerou dúvida na revisão técnica. A pergunta de fundo é: **a Clique negocia com o cliente, ou apenas com o parceiro?**

**Perguntas:**

3.1. O parceiro vai ao condomínio com **proposta fechada** ou com **margem para negociar** o preço de venda?

`__________________________________________________________`

3.2. Se o cliente pede desconto, **quem aprova?**

`[ ] Parceiro, dentro da % de comissão dele`
`[ ] Parceiro consulta Matriz`
`[ ] Matriz aprova diretamente`
`[ ] Outro: ____________`

3.3. A negociação no sistema (status "Em Negociação" da proposta) refere-se a:

`[ ] Parceiro ↔ Clique (ajustes antes da Clique assinar)`
`[ ] Clique ↔ Cliente (ajustes antes do cliente assinar)`
`[ ] Ambos os fluxos`

3.4. A Clique **fala diretamente com o cliente** em algum momento, ou tudo passa pelo parceiro?

`__________________________________________________________`

---

## 4. Mudanças no Contrato Pós-Assinatura

**Contexto:** o modelo atual congela a cascata de comissão na assinatura. Se o valor do contrato mudar depois (reajuste anual, mudança de plano), a comissão **não muda automaticamente**. Precisamos confirmar se isso é a realidade do negócio.

**Perguntas:**

4.1. O valor do contrato do Locker **pode mudar** com o cliente já ativo?

`[ ] Sim — reajuste anual programado`
`[ ] Sim — mudança de plano/módulos`
`[ ] Sim — outros: ____________`
`[ ] Não, valor é fixo até o fim do contrato`

4.2. Se o valor mudar, a comissão do parceiro:

`[ ] Acompanha a mudança (recalcula automático)`
`[ ] Fica congelada no valor original`
`[ ] Depende — explicar: ____________`

4.3. Quem autoriza essa mudança de valor?

`[ ] Admin N1 (Diretoria)`
`[ ] Admin N2 (Operacional)`
`[ ] Outro: ____________`

4.4. Existe upsell / cross-sell durante a vida do contrato? (cliente compra mais módulos depois da venda inicial)

`__________________________________________________________`

Se sim → 4.5. Quem fica com a comissão desse upsell? O **parceiro original** ou pode ser **outro**?

`__________________________________________________________`

---

## 5. Modelo de cobrança e base da comissão (B1 / B2 — com leitura de mercado)

> **Contexto:** as recomendações abaixo vêm de pesquisa de mercado (smart lockers BR/EUA + comissão de canal). Estão aqui para **decidir com contexto** — não são decisões fechadas.

### B1 — O "valor da venda" é mensal (MRR) ou total do contrato?

A cascata distribui margem sobre `sale_price`, mas o contrato é de locker para condomínio — que no mercado é majoritariamente **locação/assinatura mensal (LaaS)**, não venda única.

- **Leitura de mercado:** no Brasil predomina **locação recorrente** (não descapitaliza o condomínio, CapEx vira OpEx, facilita aprovação em assembleia). Concorrentes oferecem "compra OU locação"; a recorrência é a preferida.
- **Recomendação:** modelar o contrato como **setup único + mensalidade (MRR)**, com o **MRR como métrica primária**; comissionar sobre **TCV/ACV** (MRR × meses + setup). Isso amarra direto na **pergunta 2** (modalidade de comissão) — se a comissão é recorrente, `sale_price` único não basta.

5.1. O valor cobrado do condomínio é **mensal recorrente**, **venda única** ou **setup + mensalidade**? `__________`

5.2. A comissão incide sobre **1 mês**, sobre o **contrato inteiro (TCV)**, ou é **recorrente**? `__________`

### B2 — O uplift regional é comissionado?

Hoje o `uplift` (acréscimo por UF) entra no `base_cost_master` (piso de custo), logo é **receita não-comissionada da matriz**.

- **Leitura de mercado:** ajuste regional que cobre **custo** (logística/tributo) é tratado como **piso, fora da base comissionável**; comissão incide sobre a **margem acima do piso**. O modelo atual **já está alinhado**.
- **Recomendação:** **manter como está** (uplift = custo, não comissionado). Confirmar que o uplift é mesmo *recuperação de custo* e não *margem disfarçada* — se for margem, aí entraria na base.

5.3. O uplift por UF cobre **custo real** (manter fora da comissão) ou é **margem** (deveria ser comissionado)? `__________`

---

## Bônus — perguntas curtas que valem confirmar

- **Catálogo de módulos**: existe a lista real de SKUs? (precisamos para cadastro)
- **Cobertura UF**: hoje opera em quantos estados? Tem prioridade para começar?
- **Mobile-first?** Vistoria é em campo, então tela mobile é essencial — mas o resto pode ser desktop. OK?
- **Dados de parceiros (CPF, telefone)**: tem regra de compliance/LGPD interna que precisamos respeitar?

---

## Espaço para anotações livres

```





















```

---

**Próximo passo:** com as respostas fechadas, atualizamos `PRD.md`, `DATA_MODEL.md` e o `BRIEF.md`.
