# Architecture Decision Records

Short records of decisions that would otherwise only live as a comment buried in one file, or
as tribal knowledge nobody wrote down. Format: Context / Decision / Consequences — a few sentences
each, not a design document. Add a new one when a decision is non-obvious enough that a future
reader (including future-you) would otherwise have to reconstruct the reasoning from a diff.

| # | Title |
|---|---|
| [0001](0001-httponly-session-cookie.md) | httpOnly session cookie + Server Actions, not a browser-held token |
| [0002](0002-shared-zod-schemas.md) | `packages/schemas` as the single validation contract |
| [0003](0003-openapi-docs-only.md) | OpenAPI documents the API; it doesn't validate it |
| [0004](0004-role-vs-profile.md) | Technical role vs. business profile, with an ADMIN bypass |
| [0005](0005-client-side-data-table.md) | `data-table/` state is client-side until the API needs otherwise |
| [0006](0006-email-service-seam.md) | `EmailService` as a seam with no real provider wired in |
| [0007](0007-navigation-catalog-url-shape.md) | 4-level navigation catalog, 3-segment URLs |
