/**
 * English — the default language and the fallback. Keys are grouped by domain
 * (`auth.signIn.title`), sentences are whole messages with named variables, and
 * product names never appear here: they are proper nouns, passed in as
 * variables from `PRODUCT_LABELS` (`@oliveira/schemas`).
 *
 * `pt-BR.ts` is typed against this file: a key added here and not there fails
 * the typecheck.
 */
export const en = {
  common: {
    appName: 'Oliveira',
    skipToContent: 'Skip to content',
    language: 'Language',
    notAvailable: '—',
    notifications: 'Notifications',
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    back: 'Back',
  },

  breadcrumb: {
    new: 'New',
    edit: 'Edit',
    details: 'Details',
  },

  nav: {
    platform: {
      home: 'Home',
      companyAdmin: 'Company admin',
      company: 'Company',
      members: 'Members',
      productAccess: 'Product access',
    },
    erp: {
      overview: 'Overview',
      records: 'Records',
      people: 'People',
      access: 'Access',
      accessControl: 'Access control',
      settings: 'Settings',
      accessProfiles: 'Access profiles',
      users: 'Users',
    },
  },

  access: {
    badge: {
      granted: 'Access granted',
      none: 'No access',
      soon: 'Coming soon',
    },
  },

  home: {
    greeting: 'Hello, {name}.',
    role: { admin: 'Admin', member: 'Member' },
    lead: {
      company: 'The Oliveira products your company uses, and your access to each one.',
      noCompany:
        'Your account is ready. To use Oliveira products, you first need to belong to a company.',
    },
    products: {
      heading: 'Products',
      note: 'Access is granted by company admins. What you can do inside each product is set by that product.',
    },
    card: {
      erp: {
        kind: 'Enterprise resource planning',
        description: 'Construction back office: people, records and access profiles.',
      },
      fsm: {
        kind: 'Field service management',
        description: 'In development. Not available to any company yet.',
      },
      open: 'Open {product}',
      askAdmin: 'Ask a company admin',
      noAccessChip: 'No access',
      soonChip: 'Coming soon',
      noAccessReason: 'You don’t have access to {product}. Ask a company admin to grant it.',
      soonReason: '{product} is in development and not available yet.',
    },
    strip: {
      members: 'Members',
      access: '{product} access',
      ofLimit: '{used} of {limit}',
    },
    noCompany: {
      join: {
        title: 'Join an existing company',
        body: 'Ask a company admin to add you using this email. Once you are added, your company and its products appear here.',
      },
      note: 'Creating an account doesn’t grant access to any product. Product access is always granted by a company admin.',
    },
  },

  guard: {
    backToHome: 'Back to Home',
    noAccess: {
      overline: 'Product access',
      title: 'You don’t have access to {product}',
      withCompany:
        'Your Oliveira account and your membership in {company} are active, but {product} hasn’t been enabled for you. Product access is granted by a company admin.',
      noCompany:
        'Your account isn’t linked to a company yet. Ask a company admin to add you, then to grant you access to {product}.',
    },
    noPermission: {
      overline: 'Permission',
      title: 'You can’t view {screen}',
      body: 'Your access profile in {product} doesn’t include the View permission for this screen. What you can do inside {product} is set by your access profile there.',
      note: 'This is different from product access: you can open {product}, but not this screen.',
      back: 'Back to {product}',
    },
  },

  fsm: {
    overline: 'Field service management',
    soon: 'Coming soon',
    body: 'In development. Not available to any company yet.',
  },

  errors: {
    boundary: {
      overline: 'Something broke',
      title: 'This page couldn’t load',
      fallback: 'The request didn’t come back. Check that the API is running, then try again.',
      retry: 'Try again',
      reference: 'Reference {digest}',
    },
    notFound: {
      title: 'There’s nothing at this address',
      body: 'The page may have been renamed, or the record it pointed at was deleted.',
    },
  },

  shell: {
    nav: { label: 'Main' },
    products: {
      heading: 'Products',
      switch: 'Switch product. Current: {product}',
      current: 'Current product',
      access: 'Access',
      noAccess: 'No access',
      soon: 'Soon',
    },
    account: {
      menuFor: 'Account menu for {name}',
      signOut: 'Sign out',
    },
    search: {
      label: 'Search screens',
      placeholder: 'Search screens…',
      empty: 'No screens found.',
      prompt: 'Start typing to search…',
      screen: 'Screen',
      openNewTab: 'Open in new tab',
      favorite: 'Add to favorites',
      unfavorite: 'Remove from favorites',
      open: 'Search',
      close: 'Close search',
    },
    drawer: {
      open: 'Open menu',
      close: 'Close menu',
      title: 'Menu',
      description: 'Company, products, navigation and language',
    },
  },
};

type DeepString<T> = { [K in keyof T]: T[K] extends string ? string : DeepString<T[K]> };

export type Messages = DeepString<typeof en>;
