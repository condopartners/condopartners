import { useEffect } from "react"
import { ContactForm } from "./components/ContactForm"
import { NetworkHeroVisual } from "./components/NetworkHeroVisual"
import { WaitlistForm } from "./components/WaitlistForm"
import { observeSectionReveals, playHeroEntrance } from "./lib/animations"
import {
  brand,
  comoFunciona,
  duvidas,
  footer,
  hero,
  nav,
  paraQuem,
  problema,
  waitlistSection,
} from "./lib/copy"

function SiteNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <nav
        aria-label="Principal"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8"
      >
        <a href="#topo" className="font-display text-lg font-semibold tracking-tight text-white">
          {brand.name}
        </a>
        <ul className="hidden items-center gap-6 text-sm text-white/85 md:flex">
          {nav.links.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="hover:text-white">
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href={nav.cta.href}
              className="border border-white/40 px-3 py-1.5 text-white hover:bg-white/10"
            >
              {nav.cta.label}
            </a>
          </li>
        </ul>
      </nav>
    </header>
  )
}

export function App() {
  useEffect(() => {
    playHeroEntrance()
    return observeSectionReveals()
  }, [])

  return (
    <div id="topo" className="bg-[var(--color-paper)] text-[var(--color-ink)]">
      <SiteNav />

      <section
        aria-labelledby="hero-brand"
        className="relative grid min-h-screen lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"
      >
        <div className="relative z-10 flex flex-col justify-end bg-[var(--color-ink)] px-5 pb-16 pt-28 text-white sm:px-10 lg:justify-center lg:px-14 lg:py-24">
          <p
            id="hero-brand"
            data-animate="hero-brand"
            className="font-display text-4xl leading-none font-semibold tracking-tight sm:text-5xl lg:text-6xl"
          >
            {hero.brand}
          </p>
          <p
            data-animate="hero-copy"
            className="mt-2 text-sm tracking-[0.16em] text-white/65 uppercase"
          >
            {hero.brandLine}
          </p>
          <h1
            data-animate="hero-copy"
            className="font-display mt-8 max-w-xl text-3xl leading-[1.15] font-medium text-balance sm:text-4xl"
          >
            {hero.headline}
          </h1>
          <p data-animate="hero-copy" className="mt-5 max-w-lg text-base text-white/80 sm:text-lg">
            {hero.support}
          </p>
          <div data-animate="hero-copy" className="mt-8 flex flex-wrap gap-3">
            <a
              href={hero.ctaPrimary.href}
              className="inline-flex min-h-11 items-center bg-[var(--color-courtyard)] px-5 text-sm font-semibold text-[var(--color-courtyard-ink)] hover:bg-[color-mix(in_oklab,var(--color-courtyard)_88%,black)]"
            >
              {hero.ctaPrimary.label}
            </a>
            <a
              href={hero.ctaSecondary.href}
              className="inline-flex min-h-11 items-center border border-white/45 px-5 text-sm font-semibold text-white hover:bg-white/10"
            >
              {hero.ctaSecondary.label}
            </a>
          </div>
        </div>
        <div className="relative min-h-[50vh] lg:min-h-screen">
          <NetworkHeroVisual />
        </div>
      </section>

      <main>
        <section
          id={problema.id}
          data-animate="section"
          aria-labelledby="problema-title"
          className="mx-auto max-w-3xl px-5 py-20 sm:px-8"
        >
          <h2
            id="problema-title"
            className="font-display text-3xl font-medium text-balance sm:text-4xl"
          >
            {problema.headline}
          </h2>
          <p className="mt-4 text-lg text-[var(--color-ink)]/80">{problema.support}</p>
          <ul className="mt-10 space-y-4 border-t border-[var(--color-ink)]/15 pt-8">
            {problema.bullets.map((item) => (
              <li key={item} className="flex gap-3 text-base leading-relaxed">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-courtyard)]"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section
          id={comoFunciona.id}
          data-animate="section"
          aria-labelledby="como-title"
          className="border-y border-[var(--color-ink)]/10 bg-[var(--color-mist)]/45"
        >
          <div className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
            <h2
              id="como-title"
              className="font-display max-w-2xl text-3xl font-medium text-balance sm:text-4xl"
            >
              {comoFunciona.headline}
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-[var(--color-ink)]/80">
              {comoFunciona.support}
            </p>
            <ol className="mt-14 grid gap-10 md:grid-cols-3">
              {comoFunciona.pillars.map((pillar, index) => (
                <li key={pillar.title} className="border-t border-[var(--color-ink)]/20 pt-5">
                  <p className="text-xs tracking-[0.14em] text-[var(--color-ink)]/50 uppercase">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="font-display mt-3 text-xl font-semibold">{pillar.title}</h3>
                  <p className="mt-3 text-[var(--color-ink)]/80">{pillar.phrase}</p>
                </li>
              ))}
            </ol>
            <p className="mt-12 max-w-3xl text-sm text-[var(--color-ink)]/65">
              {comoFunciona.disclaimer}
            </p>
          </div>
        </section>

        <section
          id={paraQuem.id}
          data-animate="section"
          aria-labelledby="para-title"
          className="mx-auto max-w-3xl px-5 py-20 sm:px-8"
        >
          <h2
            id="para-title"
            className="font-display text-3xl font-medium text-balance sm:text-4xl"
          >
            {paraQuem.headline}
          </h2>
          <p className="mt-4 text-lg text-[var(--color-ink)]/80">{paraQuem.support}</p>
          <ul className="mt-10 space-y-5">
            {paraQuem.audiences.map((line) => (
              <li key={line} className="flex gap-3 text-base leading-relaxed">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-courtyard)]"
                  aria-hidden
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="font-display mt-12 text-xl">{paraQuem.close}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#waitlist"
              className="inline-flex min-h-11 items-center bg-[var(--color-courtyard)] px-5 text-sm font-semibold text-[var(--color-courtyard-ink)]"
            >
              Entrar na lista de espera
            </a>
            <a
              href="#contato"
              className="inline-flex min-h-11 items-center border border-[var(--color-ink)]/30 px-5 text-sm font-semibold"
            >
              Fale conosco
            </a>
          </div>
        </section>

        <section
          id={duvidas.id}
          data-animate="section"
          aria-labelledby="duvidas-title"
          className="border-t border-[var(--color-ink)]/10 bg-white"
        >
          <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
            <h2 id="duvidas-title" className="font-display text-3xl font-medium">
              Dúvidas comuns
            </h2>
            <div className="mt-10 space-y-8">
              {duvidas.items.map((item) => (
                <article key={item.q}>
                  <h3 className="font-display text-xl font-semibold">{item.q}</h3>
                  <p className="mt-2 text-[var(--color-ink)]/80">{item.a}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id={waitlistSection.id}
          data-animate="section"
          aria-labelledby="waitlist-title"
          className="border-t border-[var(--color-ink)]/10 bg-[var(--color-ink)] text-white"
        >
          <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
            <h2
              id="waitlist-title"
              className="font-display text-3xl font-medium text-balance sm:text-4xl"
            >
              {waitlistSection.headline}
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-white/75">{waitlistSection.support}</p>
            <div className="mt-10 [&_label]:text-white [&_input]:border-white/25 [&_input]:bg-white/95">
              <WaitlistForm />
            </div>
          </div>
        </section>

        <section
          id="contato"
          data-animate="section"
          aria-labelledby="contato-title"
          className="mx-auto max-w-3xl px-5 py-20 sm:px-8"
        >
          <h2 id="contato-title" className="font-display text-3xl font-medium">
            Fale conosco
          </h2>
          <p className="mt-3 text-[var(--color-ink)]/75">
            Conte sobre a sua operação de canal. Preferimos e-mail corporativo.
          </p>
          <div className="mt-8">
            <ContactForm />
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--color-ink)]/10 px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 text-sm text-[var(--color-ink)]/70 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-base text-[var(--color-ink)]">{footer.brandLine}</p>
          <p>
            <a href={`https://${footer.site}`} className="underline-offset-2 hover:underline">
              {footer.site}
            </a>
          </p>
          <p>{footer.note}</p>
        </div>
      </footer>
    </div>
  )
}
