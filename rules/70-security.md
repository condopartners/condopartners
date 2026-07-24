# 70 — Security

- Secrets only via environment variables. Never commit `.env` or credentials.
- Validate all untrusted input at the API boundary with Elysia `t` schemas.
- Do not log PII (CPF, emails, phone numbers, addresses) in cleartext. Prefer IDs.
- Assume LGPD applies: minimize data collection; do not store sensitive fields casually.
- Prefer least privilege. No `service_role`-style bypass patterns until auth is designed.
- Dependencies: prefer maintained packages; avoid installing heavy deps for one-liners (ponytail).
- CORS is open in local scaffolding — tighten before production deployment.
- Report security-sensitive findings in the PR; do not hide them in silent TODOs.
