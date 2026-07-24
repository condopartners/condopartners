# Specs

Nenhuma feature de produto pode ser implementada sem uma **issue aprovada no GitHub** e um arquivo de **spec** correspondente neste diretório.

Specs podem ser escritas em **pt-BR** (operadores Paperclip no Brasil). Identificadores de código e caminhos de arquivo permanecem em inglês.

## Processo

1. Abrir / reivindicar uma issue aprovada.
2. Escrever `docs/specs/<slug>.md` com superpowers (brainstorming / writing-plans).
3. Obter aprovação humana quando a issue ou a complexidade exigir.
4. Implementar com TDD.
5. Linkar o caminho da spec no PR.

## Template de spec

```md
# <Título>

## Status
Rascunho | Aprovada

## Issue
#123

## Resumo
O que muda e por quê (2–5 frases).

## Escopo
- Dentro:
- Fora:

## Comportamento
Critérios de aceite como bullets testáveis.

## Dados / API
Contratos, tipos, endpoints (se houver).

## UI
Telas/estados (se houver). Textos de UI em **pt-BR**. Linkar notas do design system.

## Riscos
Casos de borda, segurança, tenancy.

## Plano de teste
Como provamos que funciona.
```

## Nota sobre a fundação de design

O branch `docs/fundacao-design` contém artefatos de design em português (PRD, modelo de dados, fluxos). Trate-os como material de produto. As specs neste diretório são os contratos prontos para implementação.
