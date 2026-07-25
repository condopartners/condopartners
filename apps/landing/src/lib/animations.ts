import { animate, stagger } from "animejs"
import { prefersReducedMotion } from "./motion"

/** Focal entrance: brand/headline settle + network nodes cascade. */
export function playHeroEntrance(root: ParentNode = document): void {
  if (prefersReducedMotion()) return

  const brand = root.querySelectorAll("[data-animate='hero-brand']")
  const copy = root.querySelectorAll("[data-animate='hero-copy']")
  const nodes = root.querySelectorAll("[data-animate='network-node']")
  const edges = root.querySelectorAll("[data-animate='network-edge']")
  const strip = root.querySelectorAll("[data-animate='commission-strip']")

  if (brand.length) {
    animate(brand, {
      opacity: { from: 0.2, to: 1 },
      translateY: { from: 18, to: 0 },
      duration: 700,
      ease: "outExpo",
    })
  }

  if (copy.length) {
    animate(copy, {
      opacity: { from: 0, to: 1 },
      translateY: { from: 22, to: 0 },
      delay: stagger(90, { start: 120 }),
      duration: 650,
      ease: "outExpo",
    })
  }

  if (edges.length) {
    animate(edges, {
      opacity: { from: 0, to: 1 },
      duration: 500,
      delay: stagger(70, { start: 280 }),
      ease: "outQuad",
    })
  }

  if (nodes.length) {
    animate(nodes, {
      opacity: { from: 0, to: 1 },
      scale: { from: 0.72, to: 1 },
      delay: stagger(95, { start: 320 }),
      duration: 560,
      ease: "outBack",
    })
  }

  if (strip.length) {
    animate(strip, {
      opacity: { from: 0, to: 1 },
      translateY: { from: 12, to: 0 },
      delay: 620,
      duration: 500,
      ease: "outExpo",
    })
  }
}

/** Scroll reveal for section blocks — one authored supporting motion. */
export function observeSectionReveals(root: ParentNode = document): () => void {
  if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
    return () => undefined
  }

  const targets = root.querySelectorAll<HTMLElement>("[data-animate='section']")
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const el = entry.target as HTMLElement
        animate(el, {
          opacity: { from: Number(el.style.opacity || 0.01), to: 1 },
          translateY: { from: 28, to: 0 },
          duration: 620,
          ease: "outExpo",
        })
        observer.unobserve(el)
      }
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
  )

  for (const el of targets) {
    el.style.opacity = "0.01"
    el.style.transform = "translateY(28px)"
    observer.observe(el)
  }

  return () => observer.disconnect()
}
