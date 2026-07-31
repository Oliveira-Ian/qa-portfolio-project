# 0006 — `EmailService` as a seam with no real provider wired in

## Context

Nothing in the product sends email yet, but several near-future features obviously will: a welcome
email on registration, a password-reset link, an overdue-invoice notice. Building those features
later means either bolting an email call directly onto whatever handles them at the time (coupling
business logic to a specific provider's SDK), or having a seam already in place to send through.

## Decision

`apps/api/src/modules/email/email.service.ts` defines an `EmailService` interface
(`send(message: EmailMessage): Promise<void>`) and a `NoopEmailService` that logs the message to the
console instead of delivering it — no SMTP credentials, no third-party SDK dependency, nothing to
configure to run this project locally or in CI. `emailService`, the exported instance, is typed as
`EmailService`, not `NoopEmailService` — every future caller depends on the interface.

## Consequences

- Nothing calls `emailService.send()` yet, and that's expected — the seam exists for the feature
  that will need it, not in response to one that already does. Its zero-importer state is not dead
  code to be deleted; see this ADR before removing it.
- Wiring in a real provider later (Postmark, SES, whatever) is: write a class implementing
  `EmailService`, change the one export in `email.service.ts`. No caller changes, because none exist
  yet to change.
- If a caller appears before a real provider does, it depends on `EmailService` and gets
  `NoopEmailService`'s console-log behavior for free in dev/CI — exactly what a test environment
  wants, without a test double having to be built separately.
