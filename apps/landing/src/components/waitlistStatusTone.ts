/**
 * Status text tones for WaitlistForm on the dark `#waitlist` section
 * (`bg` = `--color-ink` #102028). Must stay ≥4.5:1 (WCAG AA normal text).
 */
export const waitlistStatusTone = {
  success: "text-[var(--color-courtyard-ink)]",
  /** Tailwind red-300 — readable on ink; red-800 fails on dark. */
  alert: "text-red-300",
} as const
