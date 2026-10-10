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

  auth: {
    builtAs: 'Built as a QA automation portfolio.',
    copyright: '© {year} Oliveira',
    panel: {
      signIn: { headline: 'One account for every Oliveira product.' },
      register: { headline: 'Start with your account. Your company comes next.' },
      products: {
        platform: 'Company, members and product access',
        erp: 'Construction back office',
        fsm: 'Coming soon',
      },
      steps: {
        account: { title: 'Your account', body: 'Name, email and password' },
        company: { title: 'Your company', body: 'Added by a company admin' },
        access: { title: 'Product access', body: 'Granted by a company admin' },
      },
    },
    fields: {
      email: 'Email',
      workEmail: 'Work email',
      emailPlaceholder: 'name@company.com',
      password: 'Password',
      fullName: 'Full name',
      fullNamePlaceholder: 'Ana Oliveira',
      birthDate: 'Birth date',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
    },
    signIn: {
      title: 'Sign in',
      lead: 'Use your Oliveira account to reach your company’s products.',
      forgot: 'Forgot password?',
      remember: 'Remember me',
      submit: 'Sign in',
      submitting: 'Signing in…',
      notImplemented: 'Not implemented',
      newHere: 'New to Oliveira?',
      createAccount: 'Create an account',
      failedTitle: 'We couldn’t sign you in',
      failedBody: 'Check your details and try again.',
    },
    register: {
      title: 'Create your account',
      lead: 'One account for every Oliveira product.',
      submit: 'Create account',
      submitting: 'Creating account…',
      haveAccount: 'Already have an account?',
      signIn: 'Sign in',
      takenTitle: 'That address already has an account',
      takenBody: 'Sign in with it instead, or use a different address.',
    },
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

  /**
   * What `apps/api` and `packages/schemas` say, in the user's language. The
   * originals are English contract strings (docs/api/http_responses.md) and stay
   * as they are; `translateApiMessage` maps each one to a key here and shows the
   * original when it doesn't know a message.
   */
  api: {
    generic: {
      invalidData: 'Invalid data',
      unauthorized: 'Unauthorized',
      forbidden: 'Forbidden',
      serverError: 'Something went wrong on our side. Try again.',
      routeNotFound: 'Route not found',
      networkError: 'Could not reach the server. Check that the API is running and try again.',
      malformedResponse: 'The server sent a response this app could not read.',
    },
    validation: {
      nameRequired: 'Name is required',
      typeRequired: 'At least one type is required',
      invalidEmail: 'Invalid email',
      emailRequired: 'Valid email is required',
      passwordRequired: 'Password is required',
      fullNameRequired: 'Full name is required',
      birthDateRequired: 'Birth date is required',
      documentRequired: 'Document is required',
      documentTypeRequired: 'Document type is required',
      invalidDocumentFormat: 'Invalid document format',
      idRequired: 'At least one id is required',
      personRequired: 'Person is required',
      updateFieldRequired: 'Provide at least one field to update',
      columnRequired: 'At least one column is required',
      invalidGridKey: 'Invalid grid key',
      unknownProduct: 'Unknown product',
    },
    auth: {
      missingFields: 'Please fill in email and password',
      invalidEmailFormat: 'Invalid email format',
      invalidCredentials: 'Invalid email or password',
      loginSuccess: 'Login successful',
      registerMissingFields: 'Please fill in all required fields',
      emailTaken: 'Email already exists',
      registerSuccess: 'User created successfully',
      registered: 'Registration successful',
      personHasAccount: 'This person already has an account',
    },
    access: {
      noAccess: 'No access to {product}',
      accountNoAccess: 'This account has no access to {product}',
      noContract: 'Your company has no active contract for {product}',
      noLicenses: 'No licenses left for {product}. Contact Oliveira to raise the limit.',
      memberInactive: 'This member is inactive',
      multipleCompanies: 'This account belongs to more than one company',
    },
    notFound: {
      member: 'Member not found',
      account: 'Account not found',
      company: 'Company not found',
      person: 'Person not found',
      people: 'One or more people were not found',
      profile: 'Profile not found',
    },
    guard: {
      lastCompanyAdmin: 'The company must keep at least one administrator',
      lastProfileManager: 'At least one member must keep the ability to manage profiles',
      lastSuperAdmin: 'Cannot remove the last active super admin',
      ownSuperAdmin: 'A super admin cannot remove their own access',
      protectedProfile: 'This profile is protected and cannot be deleted',
    },
    done: {
      personCreated: 'Person created successfully',
      personUpdated: 'Person updated successfully',
      personDeleted: 'Person deleted',
      peopleDeleted: '{count} people deleted',
      profileDeleted: 'Profile deleted',
      profilesDeleted: '{count} profiles deleted',
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
