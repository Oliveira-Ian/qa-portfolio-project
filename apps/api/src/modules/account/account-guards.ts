import type { AccountRole } from '@oliveira/schemas';
import { ConflictError } from '../../shared/errors.js';
import { accountRepository } from './account.repository.js';

/**
 * Blocks two specific changes to `PATCH /api/accounts/:id` (called from
 * `accountService.update()`), each a distinct way an admin change could leave
 * the system with no account able to manage accounts, profiles or
 * permissions — a state only fixable by direct database access:
 *
 * 1. A `SUPER_ADMIN` account demoting **itself** away from `SUPER_ADMIN` — blocked
 *    unconditionally, even if other active admins exist, since it's the
 *    single most common way to lock yourself out by mistake.
 * 2. The **last active** `SUPER_ADMIN` account being deactivated or demoted, by
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
  const wasActiveSuperAdmin = params.currentRole === 'SUPER_ADMIN' && params.currentActive;
  const staysActiveSuperAdmin = params.nextRole === 'SUPER_ADMIN' && params.nextActive;

  if (!wasActiveSuperAdmin || staysActiveSuperAdmin) {
    return;
  }

  if (params.accountId === params.actorAccountId) {
    throw new ConflictError('A super admin cannot remove their own access');
  }

  const remainingActiveSuperAdmins = await accountRepository.countActiveSuperAdmins(
    params.accountId,
  );

  if (remainingActiveSuperAdmins === 0) {
    throw new ConflictError('Cannot remove the last active super admin');
  }
}
