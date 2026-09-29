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
| [0008](0008-multi-tenancy-shared-database.md) | Multi-tenancy: shared database, global identity, membership per company |
| [0009](0009-branching-and-issue-hierarchy.md) | Branching model and the Epic/Feature/Task hierarchy |
| [0010](0010-release-versioning-and-automation.md) | Versioning, releases and image publishing |
| [0011](0011-platform-shape.md) | Platform shape: the Platform, a shared Foundation and one product at a time |
| [0012](0012-tenant-isolation-extension-and-rls.md) | Tenant isolation: Prisma extension plus PostgreSQL row-level security, from the start |
| [0013](0013-company-membership-and-platform-roles.md) | Company, membership and platform roles |
| [0014](0014-uuid-v7-primary-keys.md) | UUID v7 primary keys, in the tenancy migration |
| [0015](0015-platform-portal-and-central-identity.md) | The Platform is a portal with one central identity |
