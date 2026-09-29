# 0011 — Platform shape: a shared Foundation and one product at a time

## Context

The Oliveira Platform is meant to host several operational products over time, on one shared base.
The first product to be built is **Oliveira FSM** (Field Service Management). Until now the repository
has been described as "the Foundation" ([0008](0008-multi-tenancy-shared-database.md)), with a roadmap
of 25 modules (F-01…F-25), and no written answer to where a product's own concepts — a work order, a
checklist, a schedule — live, or who may depend on whom.

An intermediate layer between the Foundation and a product ("Operations": reusable operational
building blocks) was considered and **rejected for now**. Nothing yet proves which operational
concepts a second product would share with FSM, and guessing them in advance is how a shared layer
becomes a dumping ground. The deployment shape is unchanged: a modular monolith — one API, one web
application, one database.

## Decision

```
OLIVEIRA PLATFORM
├── Foundation
└── Oliveira FSM        (first product; others only if and when there is a real need)
```

**Foundation** holds only what is genuinely cross-product: authentication, `User`, `Person`,
`Company` (the unit of isolation), `Branch` (modelled, not built — see
[0013](0013-company-membership-and-platform-roles.md)), memberships, authorization, and the
infrastructure services the roadmap already names (audit, files, notifications, settings) as a
product pulls them in. It **knows no product rule**: nothing about work orders, dispatch, technicians
or any other product's vocabulary.

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
- `Person` stays in the Foundation. What follows is a real tension the F-13 specification has to
  resolve: `Person.types` (`CLIENT`, `SUPPLIER`, `USER`, `EMPLOYEE`) is business vocabulary, and the
  Foundation is supposed to be free of it. `USER` in particular goes away with membership. Whether
  the remaining values stay, become product-defined roles, or move out is decided there, not here.
- The sealed permission catalog and the navigation catalog are single files today. They only need to
  become the union of per-product entries when a second product exists; until then FSM adds its
  entries to them like any routine does.
- Multi-tenancy ([0008](0008-multi-tenancy-shared-database.md)) applies to all tables alike, the
  product's included.

How the Platform is eventually distributed to other products (monorepo, versioned packages, template
repository, plugin runtime) is recorded as a future alternative only and must not steer any current
decision. The physical folder layout is settled when the code is reorganised (Phase 1), not here.
