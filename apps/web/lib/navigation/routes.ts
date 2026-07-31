/**
 * Typed hrefs for every route the app links to, redirects to, or revalidates
 * — the single place a routine's URL is spelled out. `lib/navigation/catalog.ts`
 * is the source of truth for the *shape* of these paths (module/group/routine);
 * this file exists because a href is needed in dozens of places that don't
 * have (and shouldn't need) the whole catalog — a `redirect()` in a Server
 * Action, a `revalidatePath()` call, a `<Link href>`.
 *
 * Renaming a catalog slug means updating the corresponding entry here once;
 * every call site gets a compile error instead of a silent 404, which is
 * exactly what hard-coding the string everywhere used to make impossible.
 */
export const ROUTES = {
  home: '/home',
  people: {
    list: '/records/people/people',
    new: '/records/people/people/new',
    view: (id: string) => `/records/people/people/${id}`,
    edit: (id: string) => `/records/people/people/${id}/edit`,
  },
  profiles: {
    list: '/administration/access-control/profiles',
    new: '/administration/access-control/profiles/new',
    edit: (id: number) => `/administration/access-control/profiles/${id}/edit`,
  },
  accounts: {
    list: '/administration/access-control/users',
  },
} as const;
