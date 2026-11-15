# Oliveira FSM — Design System V2 · handoff for Claude Code

Status: **approved 2026-11-15 — reference for implementing the Oliveira FSM frontend.**
Source of truth: the canvas "Oliveira — Design System", rows titled *Oliveira FSM · Design System v2*
(boards **F01, FSM-00 … FSM-10, M06–M08**). This file and its siblings
(`oliveira-fsm-tokens.css`, `oliveira-fsm-components.css`) live in the canvas under
`project/handoff/fsm/` and are mirrored in the repository under `docs/design/fsm/`.

> Scope: **visual design and UX behaviour of the Oliveira FSM only.** Business rules come from the
> FSM specification (`docs/especificacoes/fsm-v1.md`), `packages/schemas/src/fsm/*` and the API.
> Where a board and a rule disagree, **the rule wins and the board adapts**. Nothing in this file
> changes the Oliveira Platform or the Oliveira ERP.

---

## ★ Precedence — read first

| Question | Answer |
|---|---|
| Building or changing anything under `/fsm`? | **FSM DS V2 (this file) wins** over Foundation V1 for every visual and UX decision inside the FSM content area. |
| Building or changing the Platform (`/home`, `/company…`, auth) or the ERP (`/erp…`)? | **Foundation DS V1** (`../HANDOFF.md`, `../oliveira-tokens.css`, `../oliveira-components.css`). V2 does not apply. |
| The global bar, account menu, product switcher, global search, Toast, Alert? | **Foundation V1**, identical in every product. V2 does not restyle them. |
| A V1 board shows something FSM-specific (S17 "Coming soon", "Primary · FSM" in 04 Components, the FSM column in 04b § 12, the FSM accent tints in 03 Tokens)? | **Superseded** by V2. Those V1 boards are kept unchanged as the record of V1. |
| A board and a business rule / ADR / schema disagree? | The rule wins. |
| A board shows `[Example]` text or a **New** badge? | `[Example]` = illustrative content for a field that has no demo data yet. **New** = a field or rule that does not exist in the database yet (§ 9). |

---

## 1. Product separation

"Oliveira" + the crest never change; each product keeps its accent. What V2 changes is the FSM's
**content area**, not the brand or the shell.

| Layer | Oliveira Platform | Oliveira ERP | Oliveira FSM |
|---|---|---|---|
| Design system | Foundation **V1** (v1.1) | Foundation **V1** (v1.1) | **FSM V2** on top of the Foundation |
| Global bar (52 px, dark) | V1 | V1 | V1 — identical |
| Sidebar | **F01** — the shared shell standard | **F01** | **F01** (248 px, collapsible group cards, 64 px rail + flyout); each product keeps its module names, icons and accent |
| Accent | navy `#1E2C47` / gold `#C8AE72` on shell | olive `#4F6B3A` / `#A3BE85` | terracotta `#A4502B` / `#E39A70` — **same hue as V1**, tints re-stepped |
| Page ground | beige `#F4F2ED` | beige `#F4F2ED` | **slate `#F2F4F7`** |
| Ink / borders | warm greys (`#16181D`, `#E4E0D8`) | warm greys | **cool slate** (`#111827`, `#E3E6EB`) |
| Fonts | Archivo + JetBrains Mono | same | same faces; **FSM type scale** (§ 4) |
| Primary / confirm button | accent fill | `create` outline green (decision 2026-11-15) | **mint confirm** `#44C38A` + dark text |
| Create / edit / delete | green / amber / red outline (V1 2026-11-15) | same | same meaning, FSM tints (§ 5.1) |
| Status | mono uppercase badge, 5 tones | same | **pill with dot**, one hue per work-order status |
| Forms | single page, sections stacked, "never steps" | same | records: **equal-width tabs**; work order create **and** edit: **4 steps** |
| Read-only (view) | disabled-looking input (V1 code) | same | **value on a hairline**, full-contrast text, "—" when empty |
| Toast, Alert, Tooltip, Dialog | V1 | V1 | V1 (Dialog content follows V2 type and buttons) |
| i18n, accessibility rules | V1 board 05 / § 8 | same | same rules + FSM glossary (§ 10) |

**Implementation consequence:** the FSM gets its identity from tokens scoped to
`[data-product="fsm"]` (`oliveira-fsm-tokens.css`) plus FSM-only components in `components/fsm/`.
Shared components (`Button`, `EntityList`, `RecordForm`, `Tabs`, inputs) may gain **new opt-in
variants or props**; their **defaults stay as they are** so the Platform and the ERP render exactly
as before. Any change to a shared default is a regression for the Platform/ERP.

---

## 2. Boards

Desktop boards are 1440 wide, phones 390. Heights follow the content. Routes are today's routes
(`apps/web/lib/navigation/catalog.ts`); nothing is renamed.

| Board | Title | Route | What it fixes |
|---|---|---|---|
| F01 | Navigation — collapsible groups | shell | Sidebar: group cards, states (closed, hover, focus, open, contains current), rail + flyout, collapse control |
| FSM-00 | Handoff — FSM Design System V2 | — | This handoff, visually: separation, board index, files, order |
| FSM-01 | Design system — foundations | — | Neutrals, accent, status palette, signals, type, space/radius/depth |
| FSM-02 | Design system — components & states | — | Tabs, segmented, filter chips, section tabs, buttons, fields, stepper, pills, rows, KPI tile, callouts, empty state |
| FSM-03 | Operations overview | `/fsm` | Dashboard |
| FSM-04 | Work orders — list | `ROUTES.fsm.workOrders` — `/fsm/operations/work-orders/work-orders` | List with views, status filter chips, table |
| FSM-05a | Work order — Overview tab | `…/work-orders/[id]` | Record header, lifecycle progress, Overview, side panel |
| FSM-05b | Work order — Execution tab | `…/work-orders/[id]?tab=execution` | Work log, items + add from catalog, notes, outcome, Complete dialog |
| FSM-05c | Work order — History tab | `…/work-orders/[id]?tab=history` | Activity by day with event filters |
| FSM-06a | New work order — step 1 · Customer and site | `…/work-orders/new` | Step cards, customer card, site/equipment/contact, summary aside |
| FSM-06b | New work order — step 2 · Service | `…/work-orders/new` (step 2) | Type, priority segmented, title, description, customer reference, type suggestions |
| FSM-06c | New work order — step 3 · Schedule | `…/work-orders/new` (step 3) | Technician cards with load, branch, date, duration, due (SLA) |
| FSM-06d | New work order — step 4 · Review | `…/work-orders/new` (step 4) | Review per step with Change links, Create work order, after-create choice |
| FSM-06e | Edit work order — same steps | `…/work-orders/[id]/edit` | Same steps; all reachable; one Save; customer locked after Scheduled |
| FSM-07a | Customer — Overview | `ROUTES.fsm.customers` — `/fsm/records/customers/customers/[id]` | Record header + facts + 6 equal-width tabs; overview cards |
| FSM-07b | Customer — Details | `…/customers/[id]` (Details tab) | Read-only sections |
| FSM-07c | Customer — Sites | (Sites tab) | Site cards with maps link, service hours, equipment and WOs at the site |
| FSM-07d | Customer — Contacts | (Contacts tab) | Contact cards |
| FSM-07e | Customer — Equipment | (Equipment tab) | Table with criticality, last service, next preventive |
| FSM-07f | Customer — Work orders | (Work orders tab) | Status chips + table |
| FSM-08a | Customer edit — Details | `…/customers/[id]/edit`, `…/customers/new` | Edit header, 3 editable tabs (+2 disabled), sticky save bar |
| FSM-08b | Customer edit — Sites | (Sites tab) | Repeatable site cards, primary, removal guard |
| FSM-08c | Customer edit — Contacts | (Contacts tab) | Repeatable contact cards, error state |
| FSM-09a | Equipment — Overview | `ROUTES.fsm.equipment` — `/fsm/records/customers/equipment/[id]` | Record header + facts, preventive panel, recent service |
| FSM-09b | Equipment — Details | (Details tab) | Read-only sections incl. maintenance |
| FSM-09c | Equipment — Service history | (Service history tab) | Stats + filtered table |
| FSM-10 | Work order type — narrow form | `ROUTES.fsm.workOrderTypes` — `/fsm/settings/work-orders/work-order-types/[id]/edit` | Narrow (680 px) form, defaults, rules |
| M06 | FSM — My work (phone) | `ROUTES.fsm.myWorkOrders` — `/fsm/operations/work-orders/my-work-orders` | Today / Upcoming / Done, "Now" card, next cards |
| M07 | FSM — Work order (phone) | `…/work-orders/[id]` | Phone record: actions, instructions, call/directions, tabs |
| M08 | FSM — Menu drawer (phone) | shell | Drawer with group cards |

Every href comes from `apps/web/lib/navigation/routes.ts#ROUTES` (`…` = the same base path); the table records today's paths, nothing is renamed. The `?tab=` and step states are new query state, not new routes.
Customer, equipment and work-order **create** reuse the edit boards (FSM-08, FSM-06a–d).

---

## 3. Tokens

`oliveira-fsm-tokens.css` is the source. It is loaded **after** `oliveira-tokens.css` and every rule
is scoped to `[data-product="fsm"]`:

- **A — V1 semantic tokens redefined inside the FSM** (`--olv-bg`, `--olv-surface*`, `--olv-border*`,
  `--olv-text*`, `--olv-accent-*`, `--olv-focus`, `--olv-sidebar-w`). Because `globals.css` maps
  shadcn's slots onto `--olv-*`, shared primitives follow the FSM inside `/fsm` with no fork.
- **B — FSM-only tokens** (`--fsm-*`): confirm/create/edit/danger buttons, validation, work-order
  status, signals, hints, avatars, type scale, radius, sizing, elevation.
- **Not redefined:** the shell (`--olv-shell-*`), brand palette, fonts, the success/warning/danger/info
  tones used by Toast and Alert, motion, toast tokens.

Key values:

| Role | Value | Note |
|---|---|---|
| Ground | `#F2F4F7` | content area only; the shell stays `#12151B`/`#1A1E26` |
| Surface / surface 2 / hover | `#FFFFFF` / `#F8F9FB` / `#F5F7FA` | |
| Border / button border / control border | `#E3E6EB` / `#CDD2DA` / `#8A92A0` | control ≥ 3:1 |
| Ink 1 / 2 / 3 / 4 | `#111827` 17.7:1 / `#384152` 10.6:1 / `#5B6474` 6.0:1 / `#8A92A0` | ink 4 = placeholder and "—" only |
| Accent 600 / 700 / 300 / 100 / 50 | `#A4502B` / `#8A4221` / `#E39A70` / `#F5DCCD` / `#FBF1EB` | selection, current step, focus, links — **never a button fill, never a status** |
| Confirm | bg `#44C38A`, border `#2FA56F`, text `#053D27` (5.3:1); hover `#36B27A`/`#25915F`; focus ring `#1F8A5B` | white on a light green fails AA — hence dark text |
| Selected row | `#FDF6F2` + 3 px accent edge | |
| Input error | border `#D92D20` + 3 px ring `rgba(217,45,32,.12)` | |

### Work-order status — one hue per status, everywhere

The same hue is the pill dot, the chart series and the timeline marker. Validated as a categorical
set (light): CVD ΔE worst adjacent **27.1**, normal vision **32.8** — pass. In-progress amber and
completed aqua are below 3:1 on white as dots, so **a status is always dot + word**.

| Status | Dot | Pill fill | Pill text |
|---|---|---|---|
| Open | `#8A92A0` | `#F1F3F6` | `#384152` |
| Scheduled | `#2A78D6` | `#EAF2FC` | `#1C4F95` |
| In progress | `#EDA100` | `#FDF3DC` | `#6E4A00` |
| On hold | `#6250D6` | `#F0EEFB` | `#4636B0` |
| Completed | `#1BAF7A` | `#E5F5EE` | `#0F6B4A` |
| Cancelled | `#C3C8D0` | `#F1F3F6` | `#5B6474` |

Record status: Active = completed tones · Under maintenance = in-progress tones · Inactive = open tones.

**Signals** (reserved, never a chart series, always icon + word): critical `#D03B3B`/`#FEECEB`/`#B42318`
(overdue, urgent, high criticality) · warning = in-progress tones (due soon, unsaved changes, high
priority) · overdue text `#B42318` in the Due cell.

---

## 4. Typography

Archivo (variable, 400–600) for everything; JetBrains Mono **only for codes** (`#1014`, tags, CNPJ,
serials). Weights 400/500/600, sentence case, uppercase only via CSS, tabular figures for numbers.
No display style in the FSM (that is Platform-only).

| Role | Size / line | Weight | Use |
|---|---|---|---|
| Page title | 24/32, −1.5% | 600 | One per page (list, dashboard) |
| Record title | 22/28 (20/26 in edit headers and < 768) | 600 | Work order, customer, equipment headers |
| Section / step title | 16/24 | 600 | Step card titles, DS sections |
| Card title | 15/22 | 600 | Card headers ("Today's dispatch", "Assignment") |
| Body | 14/20 | 400 | Default |
| Sub | 13.5/20 | 400 | Description under a title |
| Label | 13/18 | 500, ink 2 | Field labels, table cells' secondary |
| Small | 12.5/18 | 400, ink 3 | Meta, row sublines, hints |
| Overline | 11/16, +0.06em, uppercase | 600 **Archivo** | Record kind ("Customer · CNPJ …"); V1 overline is mono — the FSM's is not |
| Code | 12.5/18 mono | 500 | Ids, tags, documents |
| KPI | 30/36, −2%, tabular | 600 | Dashboard and fact tiles |
| Read-only value | 14.5/21 | 500 | View mode |

Reserve +35% for pt-BR in every label that must fit (tabs, buttons, column heads).

---

## 5. Components

`oliveira-fsm-components.css` is the exact CSS of the boards, de-duplicated. Build each piece with the
project stack (Tailwind + shadcn/Radix + RHF/zod); states drawn statically on the boards (`.is-hover`,
`.is-focus`) are real `:hover`, `:focus-visible` and `aria-*` states in code.

### 5.1 Buttons (FSM-02)

| Variant | Use | Look | States |
|---|---|---|---|
| **Confirm** | Complete, Save, Save changes, Continue, Create work order, Add note, Add (item) | mint fill, dark green text, 600 | hover darker mint; focus 2 px white + 2 px `#1F8A5B`; disabled 45% opacity; loading keeps width |
| **Create** (outline) | New work order, Add equipment, Add site, Add contact | white, green text/border | hover green tint |
| **Edit** (outline) | Edit | white, amber text/border | hover amber tint |
| **Destructive** (outline) | Cancel order, Remove, Delete | white, red text/border | hover red tint |
| **Secondary** | Put on hold, Resume, Export, Back (in step footers), Directions | white, slate border | hover surface |
| **Ghost** | Cancel (dialogs, save bars), Discard, icon tools | no border | hover `#EAEDF1` |

Sizes: sm 32 · md 36 (default) · lg 44 (touch / phone). Radius 8 (sm 7). Icon 16. Icon-only buttons
need `aria-label`. **One confirm per region**, rightmost. **Terracotta is not a button colour.**
A filled destructive button appears only inside a confirmation dialog (V1 rule kept).

Work-order header order (left → right): Edit · Cancel order │ Put on hold/Resume · **next step**
(Start / Complete). Actions come from `allowedTransitions`; a technician never sees Cancel order.

### 5.2 Fields (FSM-02, FSM-06, FSM-08)

- **Edit**: label above (13/500), `*` in red for required, "i" for help (never text under the field),
  input 40 px, radius 8, border `#8A92A0`; hover `#5B6474`; focus accent border + 3 px accent ring;
  error red border + ring, message in the **toast** (V1 behaviour, unchanged) and focus moves to the
  field; disabled `#F1F3F6` fill, used only when the field is truly unavailable ("Choose a customer
  first"). "Optional" is written on the **section**, not on each field.
- **View (read-only)**: the **same grid**, each value 14.5/500 on a 1 px hairline, no box, no
  placeholder, no chevron, **"—" in ink 4 when empty**; long text wraps. Fields that do not apply are
  hidden (no birth date for a CNPJ).
- **Grid**: 12 columns, gap 18 × 20; spans per field are on the boards (c3, c4, c6, c8, c12). One column
  below 768.
- **Textarea**: grows with text, counter where the schema has a limit (`0 / 2,000`).
- **Segmented choice inside a form** (priority): equal-width segments, arrow icon + word.
- **Technician picker** (FSM-06c): radio cards with avatar, availability on the chosen day and
  unfinished count; only members whose FSM profile has `work-order:execute`; picking needs `assign`.

### 5.3 Tabs

| Kind | Where | Spec |
|---|---|---|
| **Record tabs** (equal width) | Work order (Overview · Execution · History), Customer (6), Customer edit (5, two disabled), Equipment (3) | `data-fill`: tabs share 100% of the card width, 46 px, icon + label + count; sit on the record card's bottom edge. Selected: ink 1 + 600 + 2 px accent bar + accent icon; hover: surface tint; focus: inset 2 px accent ring; disabled: greyed, `aria-disabled`, still visible; tab with errors: red count. Below 1024 they stop filling and scroll horizontally (never wrap). |
| **Page tabs** | list views | same look, content width |
| **Section tabs** (reusable) | documented in FSM-02 for long records split by subject | equal-width tabs across a card. **Not used by work orders**, which keep the stepper for create and edit. |

Tabs are Radix `Tabs` (`tablist`/`tab`/`tabpanel`, arrow keys). The active record tab is in the URL
(`?tab=`), so a link and Back restore it. Editable tab panels stay mounted (`forceMount` + hidden) so
RHF validates every tab; submit opens the first tab with an error.

### 5.4 Segmented control and filter chips

- **Segmented** (`fx-seg`): switches a *view of the same data* (Today · 7 days · 30 days · Quarter;
  My work: Today · Upcoming · Done). Track `#E7EAEE`, selected = white + shadow. Never navigation.
- **Filter chips** (`fx-filt`): combinable status filters with dot + count; **on = ink-filled**
  (so it reads as a filter, not as a status). "Clear filters" link when any is on.

### 5.5 Stepper — work order create and edit

- Four **step cards** on top (Customer and site · Service · Schedule · Review), each with number,
  title and a one-line description. **Done** = green check + summary; **current** = accent ring;
  **to do** = dashed. Done steps are clickable to go back.
- **Continue validates only the current step** (zod schema per step, the whole schema on Create).
- Footer per step: Back (secondary) · hint · **Continue** (confirm). Header: "Step n of 4" + Discard (ghost).
- **Summary aside** (340 px) shows what is chosen so far and "Will open as Open / Scheduled"
  (Scheduled when technician + date are set — the API decides; the UI only predicts).
- **Edit uses the same steps** (FSM-06e): every step reachable ("Saved · click to open"), **one
  Save changes** for all, Cancel. Customer and site are **locked** once the order is In progress
  (the customer only changes while Open or Scheduled). Completed and cancelled orders cannot be edited.
- Phone: steps collapse to "Step n of 4 · Title" with a thin progress bar; the summary moves below.

### 5.6 Status, priority, people, signals

- **Status pill**: 24 px, dot + word, 12.5/500 (§ 3 table).
- **Priority**: arrow icon + word; Normal/Low plain ink; High amber 500; Urgent red 600 with alert icon.
  Never a pill.
- **Criticality** (equipment): pill — High critical tones, Medium scheduled tones, Low open tones.
- **Due**: date; "Today 18:00"; "in 1 d"; overdue = red alarm icon + "3 d late" **in the Due cell only**
  (never a second badge under the status). Screen-reader text "Overdue".
- **Person**: avatar (initials, 26 px; 36 in cards) + name; Unassigned = grey avatar "—" + "Unassigned".

### 5.7 Tables and lists

- Row 60 px: title line (`#id` mono + title) + one quiet subline (type · equipment / city).
  Header 40 px on surface 2, 12/600 ink 3, sortable heads with a chevron.
- Hover = surface tint; selected = `#FDF6F2` + 3 px accent edge; click selects, **double-click opens**
  (existing behaviour kept); header actions New (create) · Edit (edit) · Export (secondary).
- Overdue only in the Due cell. Empty cell = "—".
- Default work-order columns: Work order · Customer (+city) · Status · Priority · Technician ·
  Scheduled · Due. The rest stay available in Customize.
- Below 768 a list becomes **cards** (M06): id + status, title, customer · city, technician + date,
  priority/overdue footer.

### 5.8 Record header and side panel

- **Record header card**: icon tile (48) or initials tile, overline (kind · code · branch), record title,
  pills (status, priority/criticality, due signal), actions right; **facts strip** below
  (4–5 facts: label + value + one quiet line); record tabs on the bottom edge.
- **Lifecycle progress** (work order): 4 segments (Opened · Scheduled · In progress · Completed) with
  who/when; current = partial accent bar. On hold / Cancelled show as the status pill, not as a segment.
- **Side panel** (340 px, sticky): Assignment (technician, window, estimated duration, due + % of time
  used), Customer (+ call, contact on site), Details (type, branch, customer reference, opened by).

### 5.9 Dashboard pieces (FSM-03)

- **KPI tile**: label + icon, value (KPI type), one context line, optional meter; **the whole tile links**
  to the filtered list (Overdue → `?f_overdue=true`). No nested links inside a tile.
- **Charts**: columns (completed per week; scheduled next 7 days), stacked meter (backlog by status),
  horizontal bars (work mix, team load). Status colours from § 3; legend always for ≥ 2 series;
  tooltip on hover; one axis; no dual axes; table view available (dataviz rules).
- **Today's dispatch** (full width): one row per technician — avatar, name, count — over a time axis
  07:00–19:00; each block = scheduled start + estimated duration, coloured by status; "Free today" row
  shows the next job; "now" marker.
- **Needs attention** (full width table): overdue first, then on hold, with a **Why** column.
- **Team load** + **Open by priority** side by side.

### 5.10 Cards, callouts, timeline, save bar, dialogs

- **Card**: white, 1 px `#E3E6EB`, radius 12, faint shadow; header 16 × 20, body 0 20 20.
- **Callout** (accent tint): service instructions the technician must read — shown on the work order,
  the customer and the phone record.
- **Hint** (blue): system suggestions ("Suggested by the type: High · 3 h · due in 24 h").
- **Timeline / History**: grouped by day, newest first; each event = icon, what changed (status A → B),
  who (avatar) and time; filter chips by event kind (Status, Assignment, Items, Notes, Edits).
- **Sticky save bar** (edit pages): floating card at the bottom of the content — message ("Unsaved
  changes", "1 contact needs attention") + Cancel (ghost) + Save changes (confirm).
- **Dialog** (Complete, Put on hold, Cancel order): V1 dialog shell; title "Complete #1014", required
  reason/resolution textarea, recap, Cancel (ghost) + confirm button (red filled only for Cancel order).
- **Empty state**: what is missing + the next step when the member may take it.

### 5.11 Shell sidebar (F01)

Group = card: 44 px header (28 px icon tile from the catalog's module icon, name, chevron that turns
90°). Open group: inset `#151920`, 1 px shell border, radius 10, routines indented on a 1 px guide.
The current page's group opens by itself and its tile takes accent-300; the routine keeps the 3 px
marker and `aria-current="page"`. Several groups may be open (remembered per product in
`localStorage`). Footer: "Collapse menu" (`Ctrl B`), preference in a cookie read on the server (no
jump on load). Rail 64 px: module icons, current one tinted; hover/focus/Enter opens a flyout with
the routines (arrow keys, Esc closes). Below 1024: the drawer (M08) with the same cards.
**Scope: every product** (D1, decided 2026-11-15) — the structure is shared; each product keeps its module names, icons and accent-300. It is a Foundation shell change, documented in `docs/design/layouts/dashboard.md` and the canvas HANDOFF § 5.

---

## 6. Layouts

| Pattern | Spec |
|---|---|
| Page | padding 24 / 32 / 32, gap 20, ground `#F2F4F7`; breadcrumbs → title row (title + meta left, actions right) → content |
| Record view | header card (with facts + equal-width tabs) → tab content: main column + 340 px aside (work order) or full-width stack ≤ 1128 px (customer, equipment) |
| Record edit / create | edit header (initials tile, "Editing …", record title 20/26, "Unsaved changes" pill) + equal-width tabs → section cards (title + "i" + Optional) → sticky save bar. Create uses the same tabs; read-only tabs (Equipment, Work orders) are disabled while editing and absent while creating |
| Narrow form | records with few fields (work-order type, catalog item, branch): one 680 px column, same sections |
| Work-order create / edit | step cards → step card (title, description, `* required`, 12-col grid, footer) + summary aside 340 |
| List | title row + header actions → views (segmented) → toolbar (search, Filters with count, filter chips) → table → pagination |
| Dashboard | title + range segmented + branch filter + New work order → 4 KPI tiles → charts row → dispatch (full) → needs attention (full) → team load + by priority |

### Responsive

Drawn: 1440 desktop and 390 phone. The in-between widths follow these rules (not drawn — check them
in the browser at 1366, 1280, 1024 and 768 during implementation):

| Width | Shell | FSM content |
|---|---|---|
| ≥ 1280 | sidebar 248 (or rail if the user collapsed it) | as drawn; aside 340 beside the main column |
| 1024–1279 | rail 64 + flyout by default; expanding pushes content | aside moves **below** the main column; KPI tiles 2 × 2; step cards stay 4 across (descriptions hidden) |
| 768–1023 | drawer (M08) | one column; record tabs scroll instead of filling; step cards 2 × 2 |
| < 768 | bar 56, drawer | M06/M07: lists as cards, record actions in a bottom area (Complete · Hold · Note), tabs scroll, controls 44, gutter 16, steps as "Step n of 4" + progress bar |

---

## 7. Behaviour that must not change (from the FSM V1 spec and code)

- Status flow: OPEN ↔ SCHEDULED is automatic (technician + date); transitions come from
  `allowedTransitions`; a technician never cancels; hold and cancel need a reason; complete needs a
  resolution; items only while In progress or On hold; a work order is never deleted, only cancelled;
  the customer only changes while Open or Scheduled; completed/cancelled orders are read-only.
- Without `work-order:view` a member only sees work orders assigned to them; picking a technician
  needs `work-order:assign`.
- Listings: server-side search/filter/sort, filters in the side panel (dates first, multi-select),
  URL state, export, column customisation, click selects / double-click opens.
- Validation: errors never move the layout (red border + toast + focus); success toast and navigate.
- Addresses and contacts: exactly one primary; an address in use cannot be removed (API rule).
- `data-testid`s stay; new ones follow `docs/qa/testids.md`.

---

## 8. Accessibility (adds to V1 § 8)

- Text ≥ 4.5:1 everywhere (ink 3 is the lightest text; ink 4 only for placeholders and "—").
- Status and signals never by colour alone (dot + word; alarm icon + "late").
- Confirm button text 5.3:1; focus visible on every control (2 px surface gap + 2 px ring).
- Tabs, stepper, segmented, filter chips and the technician picker are real `tablist`/`tab`,
  `button[aria-pressed]` or `radiogroup`; disabled tabs keep `aria-disabled` and explain why on focus.
- Charts: legend + table view + hover tooltip with the same numbers.
- `prefers-reduced-motion`: no chevron/collapse/tab-bar animation.

---

## 9. Data shown on the boards that needs new fields

Marked **New** on the boards. All nullable columns on existing tables (no new tables); RLS already
covers them; FKs are composite `(companyId, x)`.

| Entity | Field | Shown on |
|---|---|---|
| Customer | `serviceInstructions` (text ≤ 1000) | WO Overview callout, customer Overview/Details, phone record, step summary |
| Customer | `defaultBranchId` | customer header, WO step 3 default |
| Address | `serviceHours` (text ≤ 120) | Sites tab ("Receives technicians"), WO Overview |
| Equipment | `criticality` (LOW/MEDIUM/HIGH) | equipment header, tables, step summary |
| Equipment | `maintenanceIntervalDays` | equipment preventive panel; next preventive (calculated, not stored) |
| CatalogItem | `estimatedMinutes` (services) | item picker hint |
| WorkOrderType | `defaultPriority`, `estimatedMinutes`, `slaHours` | FSM-10, suggestions in steps 2–3 |
| WorkOrderType | `requiresEquipment` (bool) | FSM-10; step 1 makes equipment required |
| WorkOrderType | `countsAsPreventive` (bool) | FSM-10; equipment last/next preventive |
| WorkOrder | `estimatedMinutes` | step 3, dispatch blocks, side panel |
| WorkOrder | `contactId` (customer's contact) | step 1, side panel, contacts tab count |
| WorkOrder | `externalReference` (text ≤ 60) | step 2 "Customer reference", Details |

Derived, not stored: last/next preventive, "% of the time used", technician availability and load,
dispatch blocks, "Contact on site for N work orders".

Out of scope (V2 spec later): checklists, photos, signature, PDF report, recurrence/PMOC, dispatch
board with drag and drop, maps/GPS, offline app, notifications by e-mail.

---

## 10. Internationalization

Same rules as V1 board 05 / `docs/design/i18n.md`: EN default, pt-BR typed against it, keys by
domain in `apps/web/lib/i18n/messages/fsm.ts`, whole sentences with named variables, ICU plurals,
product names never translated. **Reuse the existing `fsm.ts` terms**; new keys follow this glossary:

| EN | pt-BR |
|---|---|
| Overview · Execution · History | Visão geral · Execução · Histórico |
| Details · Sites · Contacts · Equipment · Work orders | Dados (existing) · Locais (the customer's addresses) · Contatos · Equipamentos · Ordens de serviço |
| Service history | Histórico de atendimentos (existing key `equipment.record.workOrders`) |
| Step {n} of {total} · Customer and site · Service · Schedule · Review | Etapa {n} de {total} · Cliente e local · Serviço · Agendamento · Revisão |
| Continue · Back · Discard · Create work order · Save changes | Continuar · Voltar · Descartar · Criar ordem de serviço · Salvar alterações |
| Start · Put on hold · Resume · Complete · Cancel order | Iniciar · Pausar · Retomar · Concluir · Cancelar OS |
| Work log · Materials and services · Notes · Outcome | Registro de trabalho · Materiais e serviços · Notas · Resultado |
| Service instructions · Receives technicians · Contact on site | Instruções de atendimento · Recebe técnicos · Contato no local |
| Criticality · Preventive every · Next preventive · Last service | Criticidade · Preventiva a cada · Próxima preventiva · Último atendimento |
| Estimated duration · Due within (SLA) · Customer reference | Duração estimada · Prazo (SLA) · Referência do cliente |
| Requires equipment · Counts as preventive maintenance | Exige equipamento · Conta como manutenção preventiva |
| Operations overview · Today's dispatch · Needs attention · Team load | Visão da operação · Agenda de hoje · Precisa de atenção · Carga da equipe |
| Unassigned · Overdue · {n} d late · Due today {time} | Sem técnico · Atrasada · {n} d de atraso · Vence hoje {time} |
| Will open as {status} · Unsaved changes | Será aberta como {status} · Alterações não salvas |
| My work orders (phone title may shorten to "My work") · Today · Upcoming · Done | Minhas ordens (existing key) · Hoje · Próximas · Concluídas |

Equal-width record tabs must fit in pt-BR at 1280 ("Ordens de serviço" is the longest) — if a label
cannot fit, the tabs switch to scroll, never to truncation.

---

## 11. Pending decisions and limits

| # | Item | Status |
|---|---|---|
| D1 | **F01 sidebar scope.** | **Decided 2026-11-15: F01 is the navigation standard of every Oliveira product** (Platform, ERP, FSM), each with its own module names, icons and accent. Updated in the Foundation docs directly — not a new version. |
| D2 | Steps for **editing** a work order replace the V1 rule "single form, never steps" — for the FSM work order only. | Approved in round 3; recorded in `docs/design/components/forms.md`. |
| D3 | Widths 1024/768 are specified in § 6, not drawn. | Verified at 1024: record tabs fill the width from 1280 and scroll below it; header actions wrap under the title. |
| D4 | **Phones (390 px, M06–M08) are out of scope for the web app** (decided 2026-11-15): the web targets desktop and tablet; a dedicated mobile app is a future decision. The phone boards stay as reference for it. | Do not build phone layouts; do not break what exists below 768. |
| — | Dark theme, page transitions, a pseudo-locale, high-contrast mode | Not designed (as V1). |
| — | Boards are rendered with the canvas runtime and fallback fonts in captures | They are references, not production code. |

---

## 12. Files

| File | Purpose |
|---|---|
| `HANDOFF-FSM.md` | this spec |
| `oliveira-fsm-tokens.css` | FSM tokens: V1 semantics redefined under `[data-product="fsm"]` + `--fsm-*` |
| `oliveira-fsm-components.css` | exact, de-duplicated board CSS (hex values — map to tokens) |
| canvas `project/Fsm*.dc.html` | the 30 FSM boards (F01, FSM-00 … FSM-10, M06–M08) |
| repo `docs/oliveira-fsm-design-handoff.zip` | snapshot: these files + board sources + PNG captures |

Foundation V1 files (`../HANDOFF.md`, `../oliveira-tokens.css`, `../oliveira-components.css`,
`../brand/*`) are unchanged and still apply to the Platform, the ERP and the shared shell.
