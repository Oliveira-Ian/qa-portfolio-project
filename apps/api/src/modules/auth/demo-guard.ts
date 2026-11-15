import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { ForbiddenError } from '../../shared/errors.js';

/**
 * The public demo's account (`DEMO_ACCOUNT_EMAIL`, docs/operations/environments.md)
 * stays as it was seeded: its role, status, seats, profiles and sign-in can't be
 * changed, and the profiles it holds can't be edited or deleted — otherwise one
 * visitor could lock the next one out. The demo is reset every day anyway; this
 * keeps it usable in between. Outside the demo (the variable unset) nothing is
 * checked.
 */
const DEMO_LOCKED = 'The demo account cannot be changed';

async function isDemoAccount(accountId: number): Promise<boolean> {
  if (!env.DEMO_ACCOUNT_EMAIL) {
    return false;
  }

  const account = await prisma.accessAccount.findUnique({
    where: { id: accountId },
    select: { email: true },
  });

  return account?.email.toLowerCase() === env.DEMO_ACCOUNT_EMAIL;
}

export async function assertNotDemoAccount(accountId: number): Promise<void> {
  if (await isDemoAccount(accountId)) {
    throw new ForbiddenError(DEMO_LOCKED);
  }
}

export async function assertNotDemoMembership(membershipId: string): Promise<void> {
  if (!env.DEMO_ACCOUNT_EMAIL) {
    return;
  }

  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    select: { accountId: true },
  });

  if (membership) {
    await assertNotDemoAccount(membership.accountId);
  }
}

/** A profile the demo account holds keeps its name and permissions. */
export async function assertNotDemoProfile(profileId: number): Promise<void> {
  if (!env.DEMO_ACCOUNT_EMAIL) {
    return;
  }

  const holders = await prisma.membershipProfile.findMany({
    where: { profileId },
    select: { membership: { select: { account: { select: { email: true } } } } },
  });

  if (
    holders.some(
      (holder) => holder.membership.account.email.toLowerCase() === env.DEMO_ACCOUNT_EMAIL,
    )
  ) {
    throw new ForbiddenError(DEMO_LOCKED);
  }
}
