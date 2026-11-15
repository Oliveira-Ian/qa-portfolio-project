'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2, UserCheck } from 'lucide-react';
import { useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import {
  PRODUCT_LABELS,
  PRODUCTS,
  memberEditFormSchema,
  type MemberEditFormValues,
  type Product,
} from '@oliveira/schemas';
import { FormCard, FormCardHeader } from '@/components/forms/form-card';
import { FormSection } from '@/components/forms/form-section';
import { useEntityForm } from '@/components/forms/use-entity-form';
import { SoonChip } from '@/components/platform/access-badge';
import { RoleTag } from '@/components/platform/member-parts';
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
import { Combobox } from '@/components/ui/combobox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import type { ActionResult } from '@/lib/actions';
import { translateApiMessage } from '@/lib/i18n/api-messages';
import { useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { cn } from '@/lib/utils';
import {
  setMemberProfileAction,
  updateMemberAccountAction,
} from '../../../../_actions/member-access';
import { saveMemberAction, setMemberStatusAction } from '../../../../_actions/update-member';
import type { MemberView } from '../../../_data-access/get-member-view';

function initialValues(view: MemberView): MemberEditFormValues {
  const seat = (product: Product) => view.member.products.includes(product);
  const profile = (product: Product) => {
    const entry = view.products.find((candidate) => candidate.product === product);
    return entry?.profile ? String(entry.profile.id) : '';
  };

  return {
    role: view.member.role,
    seats: { ERP: seat('ERP'), FSM: seat('FSM') },
    profiles: { ERP: profile('ERP'), FSM: profile('FSM') },
    platformRole: view.member.accountRole === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'USER',
    accountActive: view.member.accountActive,
  };
}

/** Applies what changed, in order, stopping at the first refusal (see `MemberEditForm`). */
async function saveMemberEdit(
  view: MemberView,
  initial: MemberEditFormValues,
  values: MemberEditFormValues,
): Promise<ActionResult> {
  const { member } = view;
  const changedSeats = PRODUCTS.filter(
    (product) => values.seats[product] !== initial.seats[product],
  ).map((product) => ({ product, granted: values.seats[product] }));

  if (values.role !== initial.role || changedSeats.length > 0) {
    const result = await saveMemberAction({
      membershipId: member.id,
      ...(values.role !== initial.role ? { role: values.role } : {}),
      seats: changedSeats,
    });

    if (!result.success) {
      return result;
    }
  }

  for (const entry of view.products) {
    const { product } = entry;
    const wanted = values.profiles[product];

    if (entry.canManageProfiles && values.seats[product] && wanted !== initial.profiles[product]) {
      const result = await setMemberProfileAction(member.accountId, product, wanted);

      if (!result.success) {
        return result;
      }
    }
  }

  if (
    view.viewerIsSuperAdmin &&
    (values.platformRole !== initial.platformRole || values.accountActive !== initial.accountActive)
  ) {
    return updateMemberAccountAction(member.accountId, {
      ...(values.platformRole !== initial.platformRole ? { role: values.platformRole } : {}),
      ...(values.accountActive !== initial.accountActive ? { active: values.accountActive } : {}),
    });
  }

  return { success: true };
}

/**
 * The member's edit page. One Save applies, in order, what changed: the
 * company role and the product access (Platform), then each product's profile
 * (through that product's API, offered only to someone who manages it there),
 * then — for a `SUPER_ADMIN` — the account's Platform role and status. A
 * refusal stops there; what was already applied stays applied and the page
 * shows the truth on return. Deactivating the membership is its own action,
 * behind a confirmation.
 */
export function MemberEditForm({ view }: { view: MemberView }) {
  const t = useT();
  const router = useRouter();
  const { member } = view;
  const isActive = member.status === 'ACTIVE';
  const isSelf = view.viewerAccountId === member.accountId;
  const recordHref = ROUTES.company.member(member.id);
  const initial = initialValues(view);
  const [isConfirmingDeactivate, setConfirmingDeactivate] = useState(false);
  const [isChangingStatus, startStatusChange] = useTransition();

  const { form, isPending, onSubmit } = useEntityForm<MemberEditFormValues>(
    zodResolver(memberEditFormSchema),
    initial,
    async (values) => {
      const result = await saveMemberEdit(view, initial, values);

      if (result.success) {
        toast.success(t('company.drawer.saved'));
        router.push(recordHref);
      }

      router.refresh();
      return result;
    },
  );
  const seats = useWatch({ control: form.control, name: 'seats' });

  function handleStatusChange(status: 'ACTIVE' | 'INACTIVE') {
    startStatusChange(async () => {
      const result = await setMemberStatusAction(member.id, status);
      setConfirmingDeactivate(false);

      if (!result.success) {
        toast.error(translateApiMessage(result.message ?? '', t));
        return;
      }

      toast.success(
        t(status === 'ACTIVE' ? 'company.drawer.reactivated' : 'company.drawer.deactivated'),
      );
      router.push(recordHref);
      router.refresh();
    });
  }

  return (
    <>
      <FormCard
        containerTestId="company-member-form-container"
        formTestId="company-member-form"
        form={form}
        onSubmit={onSubmit}
        header={
          <FormCardHeader
            title={member.name}
            titleTestId="company-member-form-title"
            description={member.email}
          />
        }
        footer={
          <div className="flex w-full flex-wrap items-center gap-2">
            {isActive ? (
              <Button
                type="button"
                variant="destructive-soft"
                disabled={isSelf}
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
                loading={isChangingStatus}
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
                onClick={() => router.push(recordHref)}
                data-testid="company-member-cancel"
              >
                {t('company.drawer.cancel')}
              </Button>
              <Button
                type="submit"
                variant="create"
                loading={isPending}
                data-testid="company-member-save"
              >
                {t('company.drawer.save')}
              </Button>
            </span>
          </div>
        }
      >
        <div className="divide-y divide-border">
          <div className="px-6 py-7">
            <FormSection
              title={t('company.member.sections.account', { company: view.companyName })}
              description={t('company.member.sections.accountHelp')}
            >
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('company.member.fields.role')}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid gap-3 sm:grid-cols-2"
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>
          </div>

          <div className="px-6 py-7">
            <FormSection
              title={t('company.member.sections.products')}
              description={t('company.member.sections.productsEditHelp')}
            >
              {!isActive ? (
                <p className="mb-3 text-[13px] text-text-2">{t('company.drawer.inactiveNote')}</p>
              ) : null}
              <ul className="overflow-hidden rounded-lg border border-border">
                {view.products.map((entry) => {
                  const label = PRODUCT_LABELS[entry.product];
                  const hasActiveContract = entry.contract?.status === 'ACTIVE';
                  const hadSeat = initial.seats[entry.product];
                  const isGranted = seats[entry.product];
                  const isOutOfLicenses =
                    isGranted &&
                    !hadSeat &&
                    entry.contract?.seatLimit != null &&
                    entry.contract.seatsUsed >= entry.contract.seatLimit;

                  return (
                    <li
                      key={entry.product}
                      className="border-b border-divider px-4 py-3.5 last:border-b-0"
                      data-product="platform"
                    >
                      <FormField
                        control={form.control}
                        name={`seats.${entry.product}`}
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-3">
                            <div className="min-w-0 flex-1">
                              <FormLabel
                                className="flex items-center gap-2 font-semibold"
                                translate="no"
                              >
                                {label}
                                {!entry.available ? <SoonChip /> : null}
                              </FormLabel>
                              <span className="block text-[13px] text-text-3">
                                {entry.available
                                  ? t('company.drawer.canOpen', { product: label })
                                  : t('company.drawer.comingSoon')}
                              </span>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={
                                  !isActive || !entry.available || (!hasActiveContract && !hadSeat)
                                }
                                data-testid={`company-member-seat-${entry.product.toLowerCase()}`}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {isOutOfLicenses && entry.contract?.seatLimit != null ? (
                        <p role="status" className="mt-2 text-[13px] text-danger-on">
                          {t('company.access.overLimit', {
                            used: entry.contract.seatsUsed + 1,
                            limit: entry.contract.seatLimit,
                          })}
                        </p>
                      ) : null}

                      {isGranted && entry.available ? (
                        entry.canManageProfiles ? (
                          <FormField
                            control={form.control}
                            name={`profiles.${entry.product}`}
                            render={({ field }) => (
                              <FormItem className="mt-3">
                                <FormLabel>
                                  {t('company.member.fields.profileIn', { product: label })}
                                </FormLabel>
                                <FormControl>
                                  <Combobox
                                    options={[
                                      { value: '', label: t('accessControl.users.noProfile') },
                                      ...entry.profiles.map((profile) => ({
                                        value: String(profile.id),
                                        label: profile.name,
                                      })),
                                    ]}
                                    value={field.value}
                                    onChange={field.onChange}
                                    searchPlaceholder={t('accessControl.users.form.search')}
                                    emptyText={t('accessControl.users.form.noMatch')}
                                    data-testid={`company-member-profile-${entry.product.toLowerCase()}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : (
                          <p className="mt-3 rounded-md bg-surface-2 px-3 py-2.5 text-[13px] text-text-2">
                            {t('company.member.profileManaged', { product: label })}
                          </p>
                        )
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </FormSection>
          </div>

          {view.viewerIsSuperAdmin ? (
            <div className="px-6 py-7">
              <FormSection
                title={t('company.member.sections.platform')}
                description={t('company.member.sections.platformHelp')}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="platformRole"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('company.member.fields.platformRole')}</FormLabel>
                        <FormControl>
                          <Combobox
                            options={[
                              { value: 'USER', label: t('company.member.platformRoles.user') },
                              {
                                value: 'SUPER_ADMIN',
                                label: t('company.member.platformRoles.superAdmin'),
                              },
                            ]}
                            value={field.value}
                            onChange={field.onChange}
                            disabled={isSelf}
                            data-testid="company-member-platform-role"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accountActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between gap-4 self-end rounded-lg border border-border px-4 py-2.5">
                        <FormLabel>{t('company.member.fields.accountActive')}</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSelf}
                            data-testid="company-member-account-active"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </FormSection>
            </div>
          ) : null}
        </div>
      </FormCard>

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
              disabled={isChangingStatus}
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
    </>
  );
}
