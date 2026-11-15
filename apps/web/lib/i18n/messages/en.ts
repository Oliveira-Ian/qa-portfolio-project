/**
 * English — the default language and the fallback. Keys are grouped by domain
 * (`auth.signIn.title`), sentences are whole messages with named variables, and
 * product names never appear here: they are proper nouns, passed in as
 * variables from `PRODUCT_LABELS` (`@oliveira/schemas`).
 *
 * `pt-BR.ts` is typed against this file: a key added here and not there fails
 * the typecheck.
 */
import { erpEn } from './erp';
import { tableEn } from './table';

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
    remove: 'Remove',
    previousSlide: 'Previous slide',
    nextSlide: 'Next slide',
    select: 'Select…',
    noResults: 'No results found.',
    pickDate: 'Select a date…',
    pickRange: 'Select a date range…',
    breadcrumb: 'Breadcrumb',
    uploadClick: 'Click to upload',
    uploadOr: 'or drag and drop',
    fixErrors: 'Please fix the errors above',
    checkFields: '{count, plural, one {Check # field} other {Check # fields}}',
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
      remember: 'Remember my email',
      submit: 'Sign in',
      submitting: 'Signing in…',
      forgotUnavailable: 'Password recovery isn’t available yet.',
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

  pagination: {
    summary: 'Showing {from}–{to} of {total}',
    empty: 'Nothing to show',
    rowsPerPage: 'Rows per page',
    previous: 'Previous page',
    next: 'Next page',
    page: 'Page {page}',
    navLabel: 'Pagination',
  },

  company: {
    overview: {
      title: 'Company',
      meta: '{count, plural, one {# active member} other {# active members}}',
      contracts: 'Contracts',
      contractsNote:
        'The licenses your company holds for each product. Oliveira raises a limit on request.',
      product: 'Product',
      status: 'Status',
      licenses: 'Licenses in use',
      unlimited: 'Unlimited',
      used: '{used} of {limit}',
      noContracts: 'Your company has no product contracts yet.',
      statusActive: 'Active',
      statusSuspended: 'Suspended',
      manageMembers: 'Manage members',
      manageAccess: 'Manage product access',
    },
    members: {
      title: 'Members',
      meta: '{count, plural, one {# member} other {# members}}',
      add: 'Add member',
      search: 'Search by name or email',
      roleFilter: 'Role: {value}',
      statusFilter: 'Status: {value}',
      all: 'All',
      role: {
        admin: 'Admin',
        member: 'Member',
        adminHelp: 'Manages company details, members and product access.',
        memberHelp: 'Uses the products they have access to.',
      },
      status: { active: 'Active', inactive: 'Inactive' },
      columns: {
        member: 'Member',
        role: 'Role',
        status: 'Status',
        joined: 'Joined',
        actions: 'Actions',
      },
      empty: 'No members match your search.',
      rowActions: 'Actions for {name}',
      viewDetails: 'View details',
    },
    drawer: {
      close: 'Close member details',
      roleHeading: 'Role in {company}',
      accessHeading: 'Product access',
      accessHelp: 'Decides whether this member can open each product.',
      canOpen: 'Can open {product}',
      comingSoon: 'Coming soon — not available yet',
      insideNote: 'What they can do inside is set by their access profile in {product}.',
      manage: 'Manage in {product}',
      inactiveNote: 'Inactive members can’t open any product and don’t use a license.',
      deactivate: 'Deactivate member',
      reactivate: 'Reactivate member',
      deactivateTitle: 'Deactivate {name}?',
      deactivateBody:
        'They won’t be able to open any Oliveira product, and their licenses are freed. You can reactivate them later.',
      deactivateConfirm: 'Deactivate',
      cancel: 'Cancel',
      save: 'Save changes',
      deactivated: 'Member deactivated',
      reactivated: 'Member reactivated',
      saved: 'Member updated',
      nothingToSave: 'No changes to save',
    },
    add: {
      title: 'Add member',
      description: 'Add someone who already has an Oliveira account to {company}.',
      email: 'Email',
      placeholder: 'name@company.com',
      note: 'They get no product access until you grant it.',
      submit: 'Add member',
      cancel: 'Cancel',
    },
    access: {
      title: 'Product access',
      meta: '{used} of {total} active members can open {product}',
      decidedHere: 'Product access · decided here',
      decidedHereBody: 'Who can open each Oliveira product.',
      permissions: 'Permissions · decided inside each product',
      permissionsBody: 'What people can do once inside, such as the Oliveira ERP access profiles.',
      tabs: 'Products',
      soon: 'Soon',
      search: 'Search by name or email',
      unsaved: '{count, plural, one {# unsaved change} other {# unsaved changes}}',
      discard: 'Discard',
      save: 'Save changes',
      column: 'Access to {product}',
      granted: 'Access',
      none: 'No access',
      unsavedTag: 'Unsaved',
      licenses: '{used} of {limit} licenses',
      unlimited: '{used} licenses (no limit)',
      overLimit:
        'There aren’t enough licenses: this would use {used} of {limit}. Take access away from someone first.',
      suspended:
        'Your company has no active contract for {product}, so access can’t be granted right now.',
      empty: 'No members match your search.',
      inactive: 'Inactive',
      toggle: '{product} access for {name}',
      saved: 'Product access saved',
    },
  },

  guard: {
    backToHome: 'Back to Home',
    companyAdmin: {
      overline: 'Company administration',
      title: 'Company administration is for company admins',
      body: 'Your account is signed in, but it isn’t an admin of {company}. Only company admins can manage members and product access.',
      bodyNoCompany:
        'Your account isn’t linked to a company yet, so there is nothing to administer.',
    },
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
      invalidBirthDate: 'Invalid birth date',
      unknownPermission: 'One or more permissions do not exist',
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
      memberAdded:
        'If an account with this email exists and doesn’t belong to a company yet, it was added to yours.',
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
      documentTaken: 'A person with this document already exists',
      profileNameTaken: 'A profile with this name already exists',
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

  erp: erpEn,

  table: tableEn,

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
