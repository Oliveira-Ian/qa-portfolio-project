# 0019 — The ERP is an existing product; products are areas of the web application

## Context

[0011](0011-platform-shape.md) and [0015](0015-platform-portal-and-central-identity.md) describe the
ERP as a **future** product ("only if there is a real need") and the current `apps/web` — sign-in,
`/home`, administration — as the embryo of the Platform shell. In practice the running application is
the ERP: a dashboard and a people registry behind a sign-in, with its own profiles and permissions. The
Platform (sign-in, the catalog of systems, companies and who may enter which system) is what has to be
extracted from it, and Oliveira FSM is the first product built new.

## Decision

**The ERP is an existing product, named as such.** It keeps everything it has: the dashboard, the people
registry, its profiles and permissions. Nothing is rebuilt.

**What is the Platform and what is the ERP:**

| Platform | ERP |
|---|---|
| Sign-in, registration, the account | Dashboard |
| Home: the systems available to the user | People registry |
| Company members and their seats in each system | Profiles and permissions **of the ERP** |
| (later) the Oliveira console: companies, contracts, limits | |

**A product is an area of the same web application, under its own route prefix, in the same session**
(0015 stands). The areas are `/erp` and `/fsm`; the Platform's own screens (`/home`, `/company/…`,
later `/console/…`) share no prefix with a product. Inside an area the URL shape of
[0007](0007-navigation-catalog-url-shape.md) is unchanged — module, group, routine — and the navigation
catalog becomes one per area. The former paths (`/records/…`, `/administration/…`) redirect permanently.

**Each area guards itself**: its layout checks the caller's access to that product and renders "no
access to this system" instead of the product; the product's routes in the API do the real check
([0018](0018-authorization-layers-and-product-access.md)). A product never issues a session; it reads
the one the Platform issued.

**Per-product identity is limited to an accent** in the design system (a product colour token and the
product name in the wordmark). A full theme per product remains #28.

## Consequences

- 0011's list of products gains the ERP as existing; its rule that a product owns its whole domain
  applies to the ERP too, and the FSM does not depend on the ERP. When the FSM needs customers it builds
  its endpoints over the Foundation's `Person`, not by reusing the ERP's `/api/persons`.
- 0015's "nothing is built until a second product exists" is met: there are two products, so the
  catalog of systems is built. Access is the two-level model of 0018 rather than only per company.
- 0007's "3-segment URLs" now describes the part of the URL inside an area.
- Adding a system is: an entry in the `Product` enum, an entry in the web's product catalog, a route
  folder with its layout guard, the company's contract, and the API routes behind `requireProductAccess`.
- The trigger for revisiting "same application, same session" (an OIDC-style exchange or a parent-domain
  cookie) is a product deployed on its own origin or built by someone else. Neither exists.
