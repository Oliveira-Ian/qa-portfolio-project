import type { AccountRole } from '@oliveira/schemas';
import { ConflictError } from '../../shared/errors.js';
import { accountRepository } from './account.repository.js';

/**
 * Blocks two specific changes to `PATCH /api/accounts/:id` (called from
 * `accountService.update()`), each a distinct way an admin change could leave
 * the system with no account able to manage accounts, profiles or
 * permissions — a state only fixable by direct database access:
 *
 * 1. An `ADMIN` account demoting **itself** away from `ADMIN` — blocked
 *    unconditionally, even if other active admins exist, since it's the
 *    single most common way to lock yourself out by mistake.
 * 2. The **last active** `ADMIN` account being deactivated or demoted, by
 *    anyone else.
 *
 * See `docs/product/access_control.md`'s "Lockout guards" for the product-level
 * description of both rules.
 */
export async function assertAdminChangeAllowed(params: {
  accountId: number;
  /** The account making this change — `request.account.id` at the route. */
  actorAccountId: number;
  currentRole: AccountRole;
  currentActive: boolean;
  nextRole: AccountRole;
  nextActive: boolean;
}): Promise<void> {
  const wasActiveAdmin = params.currentRole === 'ADMIN' && params.currentActive;
  const staysActiveAdmin = params.nextRole === 'ADMIN' && params.nextActive;

  if (!wasActiveAdmin || staysActiveAdmin) {
    return;
  }

  if (params.accountId === params.actorAccountId) {
    throw new ConflictError('An admin cannot remove their own admin access');
  }

  const remainingActiveAdmins = await accountRepository.countActiveAdmins(params.accountId);

  if (remainingActiveAdmins === 0) {
    throw new ConflictError('Cannot remove the last active admin');
  }
}
