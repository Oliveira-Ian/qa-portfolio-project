# 0011 — Platform shape: the Platform, a shared Foundation and one product at a time

## Context

The Oliveira Platform is meant to host several operational products over time, on one shared base.
The first product to be built is **Oliveira FSM** (Field Service Management). Until now the repository
has been described as "the Foundation" ([0008](0008-multi-tenancy-shared-database.md)), with a roadmap
of 25 modules (F-01…F-25), and no written answer to where a product's own concepts — a work order, a
checklist, a schedule — live, or who may depend on whom.

The Platform is also not just a name for a group of products: it is a **system the user signs in
to** ([0015](0015-platform-portal-and-central-identity.md)). That is a different thing from the
Foundation, which is the technical base underneath it, and the two must not be confused.

An intermediate layer between the Foundation and a product ("Operations": reusable operational
building blocks) was considered and **rejected for now**. Nothing yet proves which operational
concepts a second product would share with FSM, and guessing them in advance is how a shared layer
becomes a dumping ground. The deployment shape is unchanged: a modular monolith — one API, one web
application, one database.

## Decision

```
OLIVEIRA PLATFORM   (the central system: login, identity, home, settings, companies, products)
│
├── Foundation        the shared technical base under the Platform and every product
│
├── Oliveira FSM      first product
├── Oliveira CRM      future, only if there is a real need
├── Oliveira ERP      future, only if there is a real need
└── other products    future
```

The **Platform** is what the user reaches: the sign-in, the single Oliveira account, the companies
the user belongs to and the products available to them (0015). The **Foundation** is not the
Platform. It provides what the Platform and the products both stand on.

**Foundation** holds only what is genuinely cross-product: authentication, `User`, `Person`,
`Company` (the unit of isolation), `Branch` (only conceptual for now — see
[0013](0013-company-membership-and-platform-roles.md)), memberships, authorization, and the
infrastructure services the roadmap already names (audit, files, notifications, settings) as a
product pulls them in. It **knows no product rule**: nothing about work orders, dispatch, technicians
or any other product's vocabulary.

**`Person` stays in the Foundation and stays generic and reusable.** It carries no product or
domain classification: whatever FSM needs to say about a person (customer, technician, …) lives in
the FSM domain. Nothing is added to `Person.types` for any product, and nothing is built in the
Foundation ahead of a need for it.

**A product owns its whole domain in code**: entities, invariants, workflows, checklists, schedules,
screens. For FSM that includes the work order, dispatch, field execution, and anything else
specific to field service — even where the concept looks generic.

**Dependencies point one way**: a product imports Foundation; Foundation never imports a product;
products never import each other. This is enforced by folder structure and a lint rule when the
code is reorganised, not by convention alone.

**Sharing is earned, not anticipated.** A capability is first built inside the product that needs it.
If a second product later needs the same thing, that is the moment to evaluate promoting it to the
Foundation or to another appropriate shared layer — as an explicit task. No abstraction, table, field
type or extension point is created for a product that does not exist yet, and no CRM, ERP or other
product is designed here.

**A template is data, not a layer.** A product may ship a starting configuration (for FSM: default
work order types, statuses, profiles). At provisioning it is **copied** into the new company, which
owns the copy from then on — later improvements to the template do not propagate on their own. Live
inheritance was rejected: merging a company's overrides with a moving template, and versioning and
migrating every tenant's data when it changes, is a cost with no current customer for it.

**Customisation stays code-led.** Business rules and canonical states live in code. What a company
configures is limited to data the code reads (labels, types, profiles). The platform is not a
low-code engine, and this record does not open that door.

## Consequences

- Every Foundation module in the roadmap (F-01…F-25) keeps its place. What changes is the order:
  the Foundation is built only as far as FSM needs it, not as a prerequisite for it. A module off
  FSM's path waits until a feature pulls it in.
- What exists today is not touched by this record: `Person.types` (`CLIENT`, `SUPPLIER`, `USER`,
  `EMPLOYEE`) is business vocabulary that a generic Foundation `Person` should not carry. `USER`
  goes away with membership, and the F-13 specification decides what happens to the rest — removal,
  or moving it into the product that needs it. Until then it is neither extended nor relied upon by
  new work.
- The sealed permission catalog and the navigation catalog are single files today. They only need to
  become the union of per-product entries when a second product exists; until then FSM adds its
  entries to them like any routine does.
- Multi-tenancy ([0008](0008-multi-tenancy-shared-database.md)) applies to all tables alike, the
  product's included.

How the Platform is eventually distributed to other products (monorepo, versioned packages, template
repository, plugin runtime) is recorded as a future alternative only and must not steer any current
decision. The physical folder layout is settled when the code is reorganised (Phase 1), not here.
