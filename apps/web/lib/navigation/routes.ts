/**
 * Typed hrefs for every route the app links to, redirects to, or revalidates
 * — the single place a routine's URL is spelled out. `lib/navigation/catalog.ts`
 * is the source of truth for the *shape* of the ERP's paths (module/group/routine,
 * under its `/erp` area — docs/adr/0007 and 0019); this file exists because a
 * href is needed in dozens of places that don't have (and shouldn't need) the
 * whole catalog — a `redirect()` in a Server Action, a `revalidatePath()` call, a
 * `<Link href>`.
 *
 * Renaming a catalog slug means updating the corresponding entry here once;
 * every call site gets a compile error instead of a silent 404, which is
 * exactly what hard-coding the string everywhere used to make impossible.
 */
/** The four pages of a record routine: its list, a new one, one record, and its edit form. */
function record(list: string) {
  return {
    list,
    new: `${list}/new`,
    view: (id: string) => `${list}/${id}`,
    edit: (id: string) => `${list}/${id}/edit`,
  };
}

export const ROUTES = {
  /** The Platform's home: the systems the signed-in user can open. */
  home: '/home',
  login: '/login',
  register: '/register',

  /** The Platform's company administration (company admins only). */
  company: {
    overview: '/company',
    edit: '/company/edit',
    members: '/company/members',
    member: (membershipId: string) => `/company/members/${membershipId}`,
    memberEdit: (membershipId: string) => `/company/members/${membershipId}/edit`,
    memberNew: '/company/members/new',
    productAccess: (product?: string) =>
      product ? `/company/product-access/${product}` : '/company/product-access',
  },

  /** Oliveira ERP — an area of its own under `/erp`. */
  erp: {
    home: '/erp',
  },
  people: {
    list: '/erp/records/people/people',
    new: '/erp/records/people/people/new',
    view: (id: string) => `/erp/records/people/people/${id}`,
    edit: (id: string) => `/erp/records/people/people/${id}/edit`,
  },
  profiles: {
    list: '/erp/administration/access-control/profiles',
    new: '/erp/administration/access-control/profiles/new',
    view: (id: number) => `/erp/administration/access-control/profiles/${id}`,
    edit: (id: number) => `/erp/administration/access-control/profiles/${id}/edit`,
  },
  accounts: {
    list: '/erp/administration/access-control/users',
  },

  /** Oliveira FSM — an area of its own under `/fsm` (catalog in `catalog.ts`). */
  fsm: {
    home: '/fsm',
    customers: record('/fsm/records/customers/customers'),
    equipment: record('/fsm/records/customers/equipment'),
    catalogItems: record('/fsm/records/catalog/products-services'),
    workOrderTypes: record('/fsm/settings/work-orders/work-order-types'),
    branches: record('/fsm/settings/company/branches'),
    profiles: {
      list: '/fsm/administration/access-control/profiles',
      new: '/fsm/administration/access-control/profiles/new',
      view: (id: number) => `/fsm/administration/access-control/profiles/${id}`,
      edit: (id: number) => `/fsm/administration/access-control/profiles/${id}/edit`,
    },
    users: { list: '/fsm/administration/access-control/users' },
  },
} as const;
