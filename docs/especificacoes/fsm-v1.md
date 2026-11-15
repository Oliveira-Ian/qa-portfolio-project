# Oliveira FSM V1 — field service, from the customer to the completed work order

Specification of the first working version of Oliveira FSM (Epic #57). The access model it relies
on is [platform-access-model.md](platform-access-model.md) (ADR 0018/0019); company isolation is
ADR 0012; the person/membership split and branches are ADR 0013 and its addendum.

## Objective

A company that contracts the FSM registers its customers and their equipment, opens work orders,
assigns them to technicians, and follows each one to the end — what was done, what was used, who did
what and when — with the operation visible at a glance.

## The flow

1. **Company and branches** — the company's registration is the Platform's
   (`/company`, edited by its account administrator); the FSM shows it for context only. Branches are
   Foundation data, managed in the FSM at `/fsm/settings/company/branches` with `branch:*`.
2. **Customers** (`/fsm/records/customers/customers`) — a `Customer` over a `Person` of the company,
   with any number of typed addresses (one primary) and contact people. The FSM never sets the ERP's
   `Person.types`; a person the ERP also uses stays when the customer is deleted.
3. **Equipment** (`/fsm/records/customers/equipment`) — a customer's, installed at one of the
   customer's addresses plus an exact spot; tag unique in the company. Its sheet shows its service
   history.
4. **Catalog** (`/fsm/records/catalog/products-services`) — products and services with unit and
   reference price. No stock balance in the V1.
5. **Work order types** (`/fsm/settings/work-orders/work-order-types`) — Installation, Preventive and
   Corrective maintenance, Technical visit are copied in when the company contracts the FSM; then
   they are the company's.
6. **Work orders** (`/fsm/operations/work-orders/work-orders`) — numbered per company (`#1042`):
   customer, service address, equipment, type, branch, priority, title, description, technician,
   scheduled for, due.
7. **Execution** — on the work order's page: start, put on hold (with a reason), resume, complete
   (with the work done) or cancel (with a reason); materials and services recorded as snapshots of the
   catalog; notes; the full history.
8. **My work orders** (`/fsm/operations/work-orders/my-work-orders`) — a technician's own.
9. **Dashboard** (`/fsm`) — counts by status (each opens the filtered list), overdue, scheduled today,
   completed in 30 days, coming up, latest opened.

## Statuses

| From | To | Who |
|---|---|---|
| OPEN ↔ SCHEDULED | by editing: with a technician **and** a date it is SCHEDULED, otherwise OPEN | `work-order:edit` (+ `assign` to change the technician) |
| OPEN, SCHEDULED, ON_HOLD | IN_PROGRESS (needs a technician) | `work-order:change-status`, or the technician with `work-order:execute` |
| IN_PROGRESS | ON_HOLD (reason) · COMPLETED (work done) | the same |
| any but final | CANCELLED (reason) | `work-order:change-status` only |
| COMPLETED, CANCELLED | — | read-only |

The rule is one pure function, `allowedTransitions` (`packages/schemas/src/fsm/work-orders.ts`): the
page offers exactly what the API accepts. A work order is **overdue** when its due date has passed
and it is not finished. Materials and services are recorded only while it is IN_PROGRESS or ON_HOLD.

## Permissions (FSM catalog)

`customer:*`, `equipment:*`, `catalog-item:*`, `branch:*` (view, create, edit, delete),
`work-order-type:manage`, `work-order:view` (every work order), `work-order:create`,
`work-order:edit`, `work-order:assign`, `work-order:change-status`, `work-order:execute` (one's own),
`dashboard:view`, `profile:manage`. Reference profiles: **Administrator** (all), **Manager** (all but
`profile:manage`), **Technician** (view customers, equipment and catalog; execute; dashboard). A
technician sees only the work orders assigned to them — another's reads as not found. The FSM's
profiles and users are managed in the FSM (`/fsm/administration/access-control/…`), with the same
components as the ERP's.

## Decisions taken while building it

- **One business time zone** (`America/Sao_Paulo`) for scheduling and display, so the server and the
  browser render the same time. A per-company time zone would replace the constant.
- **Address in use**: removing an address that equipment or a work order points at is refused (409);
  addresses are updated in place so those links survive an edit.
- **Customer deletion** removes the FSM customer; the person goes too only when the ERP doesn't use it
  (no ERP type, no member linked).
- **No delete for work orders** — they are cancelled and stay in the history.

## The redesign's fields and rules (2026-11-15)

The FSM redesign (`docs/design/fsm/`) added nullable columns to existing tables — no new table, so
the company policies already cover them (migration `20261115182319_fsm_redesign_fields`):

| Record | Field | What it does |
|---|---|---|
| Customer | `serviceInstructions` | What every technician must know before arriving; shown on every work order |
| Customer | `defaultBranchId` | The branch that usually serves it; fills a new work order's branch |
| Address | `serviceHours` | When the site receives technicians; the ERP's writes leave it untouched |
| Equipment | `criticality` (LOW/MEDIUM/HIGH), `maintenanceIntervalDays` | How much a failure hurts; the preventive interval |
| CatalogItem | `estimatedMinutes` | A service's usual duration |
| WorkOrderType | `defaultPriority`, `estimatedMinutes`, `slaHours` | Suggested to a new work order of the type, only for fields not changed by hand |
| WorkOrderType | `requiresEquipment` | **Rule**: a work order of the type cannot be saved without equipment (API, 400) |
| WorkOrderType | `countsAsPreventive` | **Rule**: its completed work orders are the equipment's preventives |
| WorkOrder | `estimatedMinutes`, `contactId`, `externalReference` | Time on site; the customer's contact who receives the technician; the customer's ticket |

Derived, never stored: an equipment's last preventive (its last completed work order of a type that
counts as preventive), next preventive (that date — or the installation — plus the interval) and last
service; a customer's open and overdue work orders. A contact removed from a customer stops being any
work order's contact on site. The reference types get their defaults in the migration.

The work order list answers `f_view` (unassigned, overdue, today, mine); the dashboard returns, besides
the counts by status, completed per week, the next seven days, the mix by type, open by priority, each
technician's load, today's dispatch and what needs attention.

## Out of the V1

Mobile/offline app (the web targets desktop and tablet — a dedicated app is a future decision), GPS, routes and maps, a drag-and-drop dispatch board, checklists, photos, signatures, a PDF
report for the customer, customer portal and tickets, contracts/SLA/recurring work, quotes, billing,
stock balance, notifications and e-mail, invitations and password reset, branch-restricted access,
per-company time zone.

## Validation

Tenant isolation: `tests/isolation/fsm-records.test.ts` and `work-orders.test.ts`. The screens were
validated in the browser with Playwright scripts outside the repository (no E2E suite yet — the
testing phase is separate, `docs/qa/testing-status.md`).
