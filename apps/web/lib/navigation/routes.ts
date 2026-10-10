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
export const ROUTES = {
  /** The Platform's home: the systems the signed-in user can open. */
  home: '/home',
  login: '/login',
  register: '/register',

  /** The Platform's company administration (company admins only). */
  company: {
    overview: '/company',
    members: '/company/members',
    member: (membershipId: string) => `/company/members/${membershipId}`,
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
    edit: (id: number) => `/erp/administration/access-control/profiles/${id}/edit`,
  },
  accounts: {
    list: '/erp/administration/access-control/users',
  },

  /** Oliveira FSM — a placeholder, nothing inside it yet. */
  fsm: {
    home: '/fsm',
  },
} as const;
