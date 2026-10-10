'use client';

import { useId, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Trash2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  PRODUCT_LABELS,
  PRODUCTS,
  type CompanyMemberDto,
  type CompanyProductDto,
  type MembershipRole,
  type Product,
} from '@oliveira/schemas';
import { BrandMark } from '@/components/brand/wordmark';
import { MembershipStatusBadge, MemberIdentity, RoleTag } from '@/components/platform/member-parts';
import { SoonChip } from '@/components/platform/access-badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { translateApiMessage } from '@/lib/i18n/api-messages';
import { useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { PRODUCT_AVAILABILITY } from '@/lib/products';
import { cn } from '@/lib/utils';
import { saveMemberAction, setMemberStatusAction } from '../../_actions/update-member';

type Seats = Record<Product, boolean>;

function seatsOf(member: CompanyMemberDto): Seats {
  return {
    ERP: member.products.includes('ERP'),
    FSM: member.products.includes('FSM'),
  };
}

interface MemberDrawerProps {
  member: CompanyMemberDto;
  companyName: string;
  contracts: readonly CompanyProductDto[];
  onClose: () => void;
}

/**
 * One member's details (design S11): their role in the company, and which
 * products they can open. Role and access are saved together with an explicit
 * **Save changes** — never on toggle (handoff § 4). It is the drawer of a route
 * (`/company/members/:id`), so a member can be linked to; the list owns whether
 * it is open.
 *
 * Adapted to ADR 0018: there is no "remove member" — a member is **deactivated**
 * (and reactivated), which frees their seats. What a member can *do* inside a
 * product is set by that product, so the drawer links to it rather than
 * offering permissions.
 */
export function MemberDrawer({ member, companyName, contracts, onClose }: MemberDrawerProps) {
  const t = useT();
  const router = useRouter();
  const roleHeadingId = useId();
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState<MembershipRole>(member.role);
  const [seats, setSeats] = useState<Seats>(() => seatsOf(member));
  const [isConfirmingDeactivate, setConfirmingDeactivate] = useState(false);

  const initialSeats = seatsOf(member);
  const isActive = member.status === 'ACTIVE';
  const changedSeats = PRODUCTS.filter((product) => seats[product] !== initialSeats[product]).map(
    (product) => ({ product, granted: seats[product] }),
  );
  const hasRoleChange = role !== member.role;
  const isDirty = hasRoleChange || changedSeats.length > 0;

  function contractOf(product: Product): CompanyProductDto | undefined {
    return contracts.find((contract) => contract.product === product);
  }

  /** Turning a seat on that the company has no licence left for can't succeed — say so before Save. */
  function isOutOfLicenses(product: Product): boolean {
    const contract = contractOf(product);

    return (
      seats[product] &&
      !initialSeats[product] &&
      contract !== undefined &&
      contract.seatLimit !== null &&
      contract.seatsUsed >= contract.seatLimit
    );
  }

  const hasBlockingProduct = PRODUCTS.some(isOutOfLicenses);

  function handleSave() {
    if (isPending || !isDirty || hasBlockingProduct) {
      return;
    }

    startTransition(async () => {
      const result = await saveMemberAction({
        membershipId: member.id,
        ...(hasRoleChange ? { role } : {}),
        seats: changedSeats,
      });

      if (!result.success) {
        toast.error(translateApiMessage(result.message ?? '', t));
        // Whatever was applied before the refusal stays applied: show the truth.
        router.refresh();
        return;
      }

      toast.success(t('company.drawer.saved'));
      router.refresh();
      onClose();
    });
  }

  function handleStatusChange(status: 'ACTIVE' | 'INACTIVE') {
    if (isPending) {
      return;
    }

    startTransition(async () => {
      const result = await setMemberStatusAction(member.id, status);

      if (!result.success) {
        toast.error(translateApiMessage(result.message ?? '', t));
        setConfirmingDeactivate(false);
        return;
      }

      toast.success(
        t(status === 'ACTIVE' ? 'company.drawer.reactivated' : 'company.drawer.deactivated'),
      );
      setConfirmingDeactivate(false);
      router.refresh();
      onClose();
    });
  }

  return (
    <Sheet open onOpenChange={(open) => (open ? undefined : onClose())}>
      <SheetContent className="gap-0 p-0" data-testid="company-member-drawer">
        <header className="flex flex-col gap-3 border-b border-border px-6 pt-5 pb-5 pr-14">
          <SheetTitle className="sr-only">{member.name}</SheetTitle>
          <SheetDescription className="sr-only">{member.email}</SheetDescription>
          <MemberIdentity member={member} size="lg" />
          <div className="flex flex-wrap items-center gap-2">
            <RoleTag role={member.role} />
            <MembershipStatusBadge status={member.status} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <section aria-labelledby={roleHeadingId}>
            <h3 id={roleHeadingId} className="mb-3 text-base">
              {t('company.drawer.roleHeading', { company: companyName })}
            </h3>
            <RadioGroup
              value={role}
              onValueChange={(value) => setRole(value as MembershipRole)}
              aria-labelledby={roleHeadingId}
              data-testid="company-member-role"
            >
              {(['ADMIN', 'MEMBER'] as const).map((value) => (
                <label
                  key={value}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-input-hover',
                    'has-data-[state=checked]:border-accent-600 has-data-[state=checked]:bg-accent-50 has-data-[state=checked]:shadow-[inset_0_0_0_1px_var(--olv-accent-600)]',
                  )}
                >
                  <RadioGroupItem
                    value={value}
                    className="mt-0.5"
                    data-testid={`company-member-role-${value.toLowerCase()}`}
                  />
                  <span className="grid gap-1.5">
                    <RoleTag role={value} className="w-fit" />
                    <span className="text-[13px] leading-[19px] text-text-2">
                      {t(
                        value === 'ADMIN'
                          ? 'company.members.role.adminHelp'
                          : 'company.members.role.memberHelp',
                      )}
                    </span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          </section>

          <section className="mt-8" data-product="platform">
            <h3 className="text-base">{t('company.drawer.accessHeading')}</h3>
            <p className="mt-1 mb-3 text-[13px] text-text-3">{t('company.drawer.accessHelp')}</p>

            {!isActive ? (
              <p
                className="mb-3 text-[13px] text-text-2"
                data-testid="company-member-inactive-note"
              >
                {t('company.drawer.inactiveNote')}
              </p>
            ) : null}

            <ul className="overflow-hidden rounded-lg border border-border bg-surface">
              {PRODUCTS.map((product) => {
                const label = PRODUCT_LABELS[product];
                const isAvailable = PRODUCT_AVAILABILITY[product].available;
                const contract = contractOf(product);
                const hasActiveContract = contract?.status === 'ACTIVE';
                const isGranted = seats[product];
                const isDisabled =
                  !isActive || !isAvailable || (!hasActiveContract && !initialSeats[product]);

                return (
                  <li key={product} className="border-b border-divider last:border-b-0">
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-subtle">
                        <BrandMark tone="light" height={22} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-sm font-semibold',
                              isAvailable ? 'text-foreground' : 'text-text-3',
                            )}
                            translate="no"
                          >
                            {label}
                          </span>
                          {!isAvailable ? <SoonChip /> : null}
                        </span>
                        <span className="block text-[13px] text-text-3">
                          {isAvailable
                            ? t('company.drawer.canOpen', { product: label })
                            : t('company.drawer.comingSoon')}
                        </span>
                      </span>
                      <Switch
                        checked={isGranted}
                        disabled={isDisabled}
                        onCheckedChange={(checked) =>
                          setSeats((current) => ({ ...current, [product]: checked }))
                        }
                        aria-label={t('company.access.toggle', {
                          product: label,
                          name: member.name,
                        })}
                        data-testid={`company-member-seat-${product.toLowerCase()}`}
                      />
                    </div>

                    {isAvailable && isGranted && isActive ? (
                      <p className="mx-4 mb-3.5 rounded-md bg-surface-2 px-3 py-2.5 text-[13px] leading-[19px] text-text-2">
                        {t('company.drawer.insideNote', { product: label })}{' '}
                        <Link
                          href={ROUTES.accounts.list}
                          className="inline-flex items-center gap-0.5 font-semibold text-foreground underline underline-offset-3"
                          data-testid="company-member-manage-link"
                        >
                          {t('company.drawer.manage', { product: label })}
                          <ArrowUpRight className="size-3.5" aria-hidden="true" />
                        </Link>
                      </p>
                    ) : null}

                    {isAvailable && !hasActiveContract && !initialSeats[product] ? (
                      <p className="mx-4 mb-3.5 text-[13px] text-text-3">
                        {t('company.access.suspended', { product: label })}
                      </p>
                    ) : null}

                    {isOutOfLicenses(product) && contract?.seatLimit != null ? (
                      <p
                        role="alert"
                        className="mx-4 mb-3.5 text-[13px] text-danger-on"
                        data-testid="company-member-over-limit"
                      >
                        {t('company.access.overLimit', {
                          used: contract.seatsUsed + 1,
                          limit: contract.seatLimit,
                        })}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <footer className="flex flex-wrap items-center gap-2 border-t border-border px-6 py-4">
          {isActive ? (
            <Button
              type="button"
              variant="destructive-soft"
              onClick={() => setConfirmingDeactivate(true)}
              data-testid="company-member-deactivate"
            >
              <Trash2 aria-hidden="true" />
              {t('company.drawer.deactivate')}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => handleStatusChange('ACTIVE')}
              data-testid="company-member-reactivate"
            >
              <UserCheck aria-hidden="true" />
              {t('company.drawer.reactivate')}
            </Button>
          )}

          <span className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              data-testid="company-member-cancel"
            >
              {t('company.drawer.cancel')}
            </Button>
            <Button
              type="button"
              loading={isPending}
              disabled={!isDirty || hasBlockingProduct}
              onClick={handleSave}
              data-testid="company-member-save"
            >
              {t('company.drawer.save')}
            </Button>
          </span>
        </footer>

        <AlertDialog open={isConfirmingDeactivate} onOpenChange={setConfirmingDeactivate}>
          <AlertDialogContent data-testid="company-member-deactivate-dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('company.drawer.deactivateTitle', { name: member.name })}
              </AlertDialogTitle>
              <AlertDialogDescription>{t('company.drawer.deactivateBody')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel variant="ghost" data-testid="company-member-deactivate-cancel">
                {t('company.drawer.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={isPending}
                onClick={(event) => {
                  event.preventDefault();
                  handleStatusChange('INACTIVE');
                }}
                data-testid="company-member-deactivate-confirm"
              >
                {t('company.drawer.deactivateConfirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
