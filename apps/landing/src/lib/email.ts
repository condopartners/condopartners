/** Basic client-side e-mail check for waitlist / contact forms. */
export function isValidCorporateEmail(value: string): boolean {
  const email = value.trim()
  if (!email) return false
  // Practical RFC5322-lite: local@domain.tld with at least one dot in domain
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
