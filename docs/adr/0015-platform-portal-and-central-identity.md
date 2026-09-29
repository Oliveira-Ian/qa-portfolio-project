# 0015 — The Platform is a portal with one central identity

## Context

"Oliveira Platform" has so far been read as an architectural umbrella: a name for the Foundation
plus the products built on it ([0011](0011-platform-shape.md)). It is more than that. It is meant to
be a **system the user reaches**, with a sign-in, an account, permissions, settings, the companies the
user belongs to and the products available to them — and products such as Oliveira FSM, and later
CRM or ERP, are entered from it.

Two consequences had to be written down before any session or identity code is designed: what the
Platform is as opposed to the Foundation, and what "already signed in" means when the user moves
from the Platform into a product.

## Decision

**The Oliveira Platform is the central system of the ecosystem.**

```
User
  └─ Oliveira Platform ── login and central identity ── Platform home
                                                          ├── Oliveira FSM
                                                          ├── Oliveira CRM   (future)
                                                          ├── Oliveira ERP   (future)
                                                          └── other products (future)
```

- **One user, one Oliveira account, one authentication.** The user never creates another account or
  types another password for a product.
- **The Platform owns** the sign-in, the account/identity, permissions, settings, the list of
  companies the user is a member of, and the list of products available to them.
- **The Foundation is not the Platform.** It is the shared technical base under both the Platform
  and every product, and it knows no product rule (0011).
- **`SUPER_ADMIN` is a Platform user** ([0013](0013-company-membership-and-platform-roles.md)). It
  administers companies and the products each company has access to. That does not give it access to
  a company's business data; the two remain separate concepts.

**Single sign-on comes from the shape of the application, not from a protocol.** A product is an
**area of the same web application**, under its own route prefix, in the **same session** as the
Platform. Clicking Oliveira FSM in the Platform home navigates within that session, so the user
arrives already authenticated and nothing is exchanged or re-verified. The existing `apps/web`
(sign-in, `/home`, administration) is already the embryo of the Platform shell; a product adds its
own area and its own entries to the navigation.

Separating a product into its own deployment later (a subdomain with a session cookie on the parent
domain, or an OIDC-style token exchange) stays possible and is **not decided here**: choosing it
before a second product exists would add an identity server, redirects and revocation with no
customer for them. Keeping each product under its own prefix, and keeping the session independent of
any one product, is what keeps that door open.

**Company access to products is a concept, not built yet.** A company has a set of products it may
use, administered by `SUPER_ADMIN`, and the Platform home lists the products the user's active
membership can enter. With a single product there is nothing to list, so nothing is built until a
second product or a real access rule needs it.

## Consequences

- The identity work already on the roadmap (F-07 authentication and session, F-09 users and
  accounts, F-11 access control, F-12 companies) is Platform work in the Foundation's terms; a new
  Epic tracks what is genuinely new: the Platform home and the company-to-product access.
- The session designed in the tenancy work carries the identity and the active company, and must not
  be tied to a product. Products read it; they do not issue their own.
- Route prefixes become part of the design: the Platform's own screens and each product's area do
  not share a prefix, and the navigation catalog is per area.
- The distribution question in 0011 (how the Platform reaches other products) is unchanged: recorded
  as a future alternative, not steering a current decision.
