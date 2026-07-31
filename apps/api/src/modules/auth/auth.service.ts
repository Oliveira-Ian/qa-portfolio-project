import {
  authMessages,
  type LoginInput,
  type MeResponse,
  type RegisterInput,
  type SessionAccount,
} from '@oliveira/schemas';
import { UnauthorizedError, BadRequestError } from '../../shared/errors.js';
import { accountRepository } from '../account/account.repository.js';
import { getEffectivePermissions } from './permissions.service.js';
import { hashPassword, verifyPassword } from './password.js';
import { signSessionToken } from './token.js';

export interface LoginResult {
  token: string;
  user: SessionAccount;
}

export const authService = {
  async register({ fullName, email, password, birthDate }: RegisterInput): Promise<void> {
    const existing = await accountRepository.findByEmail(email);

    if (existing) {
      // 400, not 409 — docs/api/http_responses.md documents a duplicate e-mail
      // as a validation failure, and that is what the API has always answered.
      throw new BadRequestError(authMessages.register.emailTaken);
    }

    await accountRepository.createWithPerson({
      name: fullName,
      email,
      passwordHash: await hashPassword(password),
      birthDate: new Date(birthDate),
    });
  },

  async login({ email, password }: LoginInput): Promise<LoginResult> {
    const account = await accountRepository.findByEmail(email);

    // One message covers every failure reason — unknown e-mail, wrong
    // password, deactivated account, or a SYSTEM account (reserved for
    // integrations/jobs, never interactive login) — so the response can't be
    // used to enumerate which addresses are registered or which are admins.
    if (
      !account ||
      !(await verifyPassword(password, account.password)) ||
      !account.active ||
      account.role === 'SYSTEM'
    ) {
      throw new UnauthorizedError(authMessages.login.invalidCredentials);
    }

    const sessionAccount: SessionAccount = {
      id: account.id,
      personId: account.personId,
      name: account.person.name,
      email: account.email,
      role: account.role,
    };

    return { token: await signSessionToken(sessionAccount), user: sessionAccount };
  },

  async getMe(accountId: number): Promise<MeResponse> {
    const account = await accountRepository.findById(accountId);

    if (!account) {
      // The token was valid but the account is gone — treat it the same as
      // no session at all rather than leaking that distinction.
      throw new UnauthorizedError();
    }

    const permissions = await getEffectivePermissions(accountId);

    return {
      account: {
        id: account.id,
        personId: account.personId,
        email: account.email,
        role: account.role,
        active: account.active,
      },
      person: { id: account.person.id, name: account.person.name },
      permissions: [...permissions],
    };
  },
};
