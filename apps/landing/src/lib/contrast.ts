/** Relative luminance (sRGB) per WCAG 2.x. */
function relativeLuminance(hex: string): number {
  const cleaned = hex.replace("#", "")
  const n =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned
  const r = Number.parseInt(n.slice(0, 2), 16) / 255
  const g = Number.parseInt(n.slice(2, 4), 16) / 255
  const b = Number.parseInt(n.slice(4, 6), 16) / 255
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** Contrast ratio between two hex colors (lighter/darker). */
export function contrastRatio(foreground: string, background: string): number {
  const L1 = relativeLuminance(foreground)
  const L2 = relativeLuminance(background)
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return (lighter + 0.05) / (darker + 0.05)
}
