/** Canonical Marketing copy — source: docs/specs/landing-page.md / SIS-23 */

export const meta = {
  title: "CondoPartners — Sistema de Indicação para redes de parceiros",
  description:
    "Organize hierarquia, indicação e comissões para quem vende em condomínios. Entre na lista de espera do CondoPartners.",
} as const

export const brand = {
  name: "CondoPartners",
  line: "Sistema de Indicação",
} as const

export const nav = {
  links: [
    { href: "#como-funciona", label: "Como funciona" },
    { href: "#para-quem", label: "Para quem" },
    { href: "#waitlist", label: "Lista de espera" },
  ],
  cta: { href: "#waitlist", label: "Entrar na lista" },
} as const

export const hero = {
  brand: brand.name,
  brandLine: brand.line,
  headline: "Rede de parceiros e comissões — sem planilha.",
  support:
    "CondoPartners organiza hierarquia, indicação e regras de comissão para empresas que vendem em condomínios — um sistema, vários tenants, dados isolados.",
  ctaPrimary: { href: "#waitlist", label: "Entrar na lista de espera" },
  ctaSecondary: { href: "#contato", label: "Fale conosco" },
} as const

export const waitlistCopy = {
  label: "Seu e-mail corporativo",
  placeholder: "nome@empresa.com.br",
  submit: "Quero acesso antecipado",
  success: "Pronto. Avisamos você quando a vaga abrir.",
  error: "Não foi possível enviar. Tente de novo em instantes.",
} as const

export const contactCopy = {
  fields: {
    name: "Nome",
    company: "Empresa",
    email: "E-mail",
    message: "Mensagem (opcional)",
  },
  submit: "Enviar mensagem",
  success: "Recebemos. Retornamos em breve.",
} as const

export const problema = {
  id: "problema",
  headline: "Sua rede cresce. A planilha não acompanha.",
  support:
    "Quando parceiro indica subparceiro, a comissão vira disputa: quem trouxe o cliente, qual regra vale, o que já pode pagar.",
  bullets: [
    "Árvore de parceiros sem sistema único de registro",
    "Comissão (markup e/ou % da venda) calculada à mão e contestada",
    "Atribuição de indicação ambígua — conflito de canal entre times e parceiros",
  ],
} as const

export const comoFunciona = {
  id: "como-funciona",
  headline: "Um sistema de indicação para a operação inteira.",
  support:
    "CondoPartners é a plataforma multi-tenant onde cada empresa (tenant) gerencia sua rede, seu catálogo e suas regras — com isolamento de dados e UI em português.",
  pillars: [
    {
      title: "Rede hierárquica",
      phrase: "Parceiros e subparceiros em árvore clara, pronta para crescer sem perder a conta.",
    },
    {
      title: "Regras de comissão",
      phrase:
        "Estratégias configuráveis (markup e/ou percentual da venda) por tenant — fora da planilha.",
    },
    {
      title: "Indicação com dono",
      phrase: "Atribuição explícita de quem trouxe o cliente, para reduzir conflito de canal.",
    },
  ],
  disclaimer:
    "CondoPartners está em construção. Esta página é para lista de espera e conversa com early adopters — o produto operacional entra por etapas após a landing.",
} as const

export const paraQuem = {
  id: "para-quem",
  headline: "Feito para quem opera canal em condomínios.",
  support:
    "Empresas que precisam do mesmo esqueleto operacional com regras, catálogo e marca diferentes — sem misturar dados entre tenants.",
  audiences: [
    "Operadores de rede de parceiros / indicação no segmento condominial",
    "Times comerciais que pagam comissão só depois da confirmação de pagamento do cliente",
    "Grupos multi-marca (ex.: ecossistema Clique / eCondos) que querem white-label sobre a mesma base",
  ],
  close: "Menos planilha. Mais clareza na indicação.",
} as const

export const duvidas = {
  id: "duvidas",
  items: [
    {
      q: "Já existe um CRM / planilha que “funciona”.",
      a: "Funciona até a rede ramificar. CondoPartners nasce para hierarquia, atribuição e comissão como sistema de registro — não como mais uma aba no Excel.",
    },
    {
      q: "Vai servir só para armários / um produto?",
      a: "Não. O catálogo é do tenant: produtos e regras por item, sem hardcode de categoria.",
    },
    {
      q: "Preciso migrar tudo agora?",
      a: "Não. Entre na lista, converse conosco e entre quando a fatia do produto fizer sentido para a sua operação.",
    },
  ],
} as const

export const waitlistSection = {
  id: "waitlist",
  headline: "Quer ser dos primeiros a operar indicação sem planilha?",
  support:
    "Deixe o e-mail corporativo. Avisamos quando liberar acesso e conversamos se fizer sentido para o seu canal.",
} as const

export const footer = {
  brandLine: `${brand.name} — ${brand.line}`,
  site: "condopartners.com.br",
  note: "© CondoPartners. Produto em desenvolvimento.",
} as const
