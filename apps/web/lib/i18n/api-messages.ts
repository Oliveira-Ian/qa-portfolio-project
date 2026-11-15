import type { MessageKey, TranslateVars, Translator } from './translate';

/**
 * `apps/api`, `packages/schemas` and the Server Actions speak in English
 * contract strings (docs/api/http_responses.md): tests and clients assert them
 * verbatim, so they never change. The UI shows them in the user's language by
 * looking each one up here — a message nobody mapped is shown as it came, never
 * swallowed.
 */
const EXACT: Record<string, MessageKey> = {
  // Transport
  'Could not reach the server. Check that the API is running and try again.':
    'api.generic.networkError',
  'The server sent a response this app could not read.': 'api.generic.malformedResponse',
  'Server error': 'api.generic.serverError',
  Unauthorized: 'api.generic.unauthorized',
  Forbidden: 'api.generic.forbidden',
  'Route not found': 'api.generic.routeNotFound',
  'Invalid data': 'api.generic.invalidData',

  // Validation (packages/schemas and the API's own checks)
  'Name is required': 'api.validation.nameRequired',
  'At least one type is required': 'api.validation.typeRequired',
  'Invalid email': 'api.validation.invalidEmail',
  'Valid email is required': 'api.validation.emailRequired',
  'Password is required': 'api.validation.passwordRequired',
  'Full name is required': 'api.validation.fullNameRequired',
  'Birth date is required': 'api.validation.birthDateRequired',
  'Document is required': 'api.validation.documentRequired',
  'Document type is required': 'api.validation.documentTypeRequired',
  'Invalid document format': 'api.validation.invalidDocumentFormat',
  'At least one id is required': 'api.validation.idRequired',
  'Person is required': 'api.validation.personRequired',
  'Provide at least one field to update': 'api.validation.updateFieldRequired',
  'At least one column is required': 'api.validation.columnRequired',
  'Invalid grid key': 'api.validation.invalidGridKey',
  'Unknown product': 'api.validation.unknownProduct',

  // Auth
  'Please fill in email and password': 'api.auth.missingFields',
  'Invalid email format': 'api.auth.invalidEmailFormat',
  'Invalid email or password': 'api.auth.invalidCredentials',
  'Login successful': 'api.auth.loginSuccess',
  'Please fill in all required fields': 'api.auth.registerMissingFields',
  'Email already exists': 'api.auth.emailTaken',
  'User created successfully': 'api.auth.registerSuccess',
  'Registration successful': 'api.auth.registered',
  'This person already has an account': 'api.auth.personHasAccount',
  'If an account with this e-mail exists and does not belong to a company yet, it was added to yours.':
    'api.auth.memberAdded',

  // Company, members and seats
  'This member is inactive': 'api.access.memberInactive',
  'This account belongs to more than one company': 'api.access.multipleCompanies',
  'Member not found': 'api.notFound.member',
  'Account not found': 'api.notFound.account',
  'Company not found': 'api.notFound.company',
  'Person not found': 'api.notFound.person',
  'One or more people were not found': 'api.notFound.people',
  'Profile not found': 'api.notFound.profile',
  'The company must keep at least one administrator': 'api.guard.lastCompanyAdmin',
  'At least one member must keep the ability to manage profiles': 'api.guard.lastProfileManager',
  'Cannot remove the last active super admin': 'api.guard.lastSuperAdmin',
  'A super admin cannot remove their own access': 'api.guard.ownSuperAdmin',
  'This profile is protected and cannot be deleted': 'api.guard.protectedProfile',

  // Confirmations a Server Action sends back
  'Person created successfully': 'api.done.personCreated',
  'Person updated successfully': 'api.done.personUpdated',
  'Person deleted': 'api.done.personDeleted',
  'Profile deleted': 'api.done.profileDeleted',
};

interface MessagePattern {
  pattern: RegExp;
  key: MessageKey;
  /** Turns the regexp match into the variables the catalogue sentence takes. */
  vars: (match: RegExpMatchArray) => TranslateVars;
}

/** The product is a proper noun ("Oliveira ERP"): it goes in as it came, never translated. */
const productVars = (match: RegExpMatchArray): TranslateVars => ({ product: match[1] ?? '' });
const countVars = (match: RegExpMatchArray): TranslateVars => ({ count: Number(match[1]) });

const PATTERNS: readonly MessagePattern[] = [
  { pattern: /^No access to (.+)$/, key: 'api.access.noAccess', vars: productVars },
  {
    pattern: /^This account has no access to (.+)$/,
    key: 'api.access.accountNoAccess',
    vars: productVars,
  },
  {
    pattern: /^Your company has no active contract for (.+)$/,
    key: 'api.access.noContract',
    vars: productVars,
  },
  {
    pattern: /^No licenses left for (.+?)\. Contact Oliveira to raise the limit\.$/,
    key: 'api.access.noLicenses',
    vars: productVars,
  },
  { pattern: /^(\d+) people deleted$/, key: 'api.done.peopleDeleted', vars: countVars },
  { pattern: /^(\d+) profiles deleted$/, key: 'api.done.profilesDeleted', vars: countVars },
];

/** The message in the user's language, or the original when it isn't one the app knows. */
export function translateApiMessage(message: string, t: Translator): string {
  const exact = Object.hasOwn(EXACT, message) ? EXACT[message] : undefined;

  if (exact) {
    return t(exact);
  }

  for (const { pattern, key, vars } of PATTERNS) {
    const match = message.match(pattern);

    if (match) {
      return t(key, vars(match));
    }
  }

  return message;
}
