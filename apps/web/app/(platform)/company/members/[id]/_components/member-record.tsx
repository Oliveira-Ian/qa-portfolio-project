import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { PRODUCT_LABELS } from '@oliveira/schemas';
import { FormSection } from '@/components/forms/form-section';
import { PageHeader } from '@/components/layout/page-header';
import { AccessBadge, SoonChip } from '@/components/platform/access-badge';
import { MembershipStatusBadge, RoleTag } from '@/components/platform/member-parts';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DescriptionList } from '@/components/ui/description-list';
import { formatDateMedium } from '@/lib/format';
import { getLocale, getTranslator } from '@/lib/i18n/server';
import { ROUTES } from '@/lib/navigation/routes';
import type { MemberView } from '../../_data-access/get-member-view';

/**
 * One member, read-only, in the three responsibilities the access model keeps
 * apart: their place in the company account (the Platform's), the products
 * they may open (the Platform's), and what they do inside each product (that
 * product's profiles — shown only to someone who manages them there).
 */
export async function MemberRecord({ view }: { view: MemberView }) {
  const [t, locale] = await Promise.all([getTranslator(), getLocale()]);
  const { member } = view;

  return (
    <div className="max-w-[60rem]" data-testid="company-member-record">
      <PageHeader
        title={member.name}
        titleTestId="company-member-record-title"
        meta={member.email}
        actions={
          <>
            <Button variant="ghost" asChild data-testid="company-member-record-back">
              <Link href={ROUTES.company.members}>{t('company.member.back')}</Link>
            </Button>
            <Button asChild data-testid="company-member-record-edit">
              <Link href={ROUTES.company.memberEdit(member.id)}>
                <Pencil aria-hidden="true" />
                {t('company.member.edit')}
              </Link>
            </Button>
          </>
        }
      />

      <div className="divide-y divide-border rounded-xl border border-border bg-surface">
        <div className="px-6 py-7">
          <FormSection
            title={t('company.member.sections.account', { company: view.companyName })}
            description={t('company.member.sections.accountHelp')}
          >
            <DescriptionList
              items={[
                { label: t('company.member.fields.role'), value: <RoleTag role={member.role} /> },
                {
                  label: t('company.member.fields.status'),
                  value: <MembershipStatusBadge status={member.status} />,
                },
                {
                  label: t('company.member.fields.joined'),
                  value: (
                    <span className="olv-data">{formatDateMedium(member.createdAt, locale)}</span>
                  ),
                },
              ]}
            />
          </FormSection>
        </div>

        <div className="px-6 py-7">
          <FormSection
            title={t('company.member.sections.products')}
            description={t('company.member.sections.productsHelp')}
          >
            <ul className="overflow-hidden rounded-lg border border-border">
              {view.products.map((entry) => {
                const label = PRODUCT_LABELS[entry.product];

                return (
                  <li
                    key={entry.product}
                    className="grid gap-2 border-b border-divider px-4 py-3.5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto]"
                    data-testid={`company-member-product-${entry.product.toLowerCase()}`}
                  >
                    <div className="min-w-0">
                      <span
                        className="flex items-center gap-2 text-sm font-semibold"
                        translate="no"
                      >
                        {label}
                        {!entry.available ? <SoonChip /> : null}
                      </span>
                      <span className="block text-[13px] text-text-3">
                        {!entry.hasSeat
                          ? t('company.member.noAccess', { product: label })
                          : entry.profile === undefined
                            ? t('company.member.profileManaged', { product: label })
                            : t('company.member.profileIs', {
                                profile: entry.profile?.name ?? t('accessControl.users.noProfile'),
                              })}
                      </span>
                    </div>
                    {entry.available ? (
                      <AccessBadge
                        state={member.status === 'ACTIVE' && entry.hasSeat ? 'granted' : 'none'}
                      />
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
              <DescriptionList
                items={[
                  {
                    label: t('company.member.fields.platformRole'),
                    value: t(
                      member.accountRole === 'SUPER_ADMIN'
                        ? 'company.member.platformRoles.superAdmin'
                        : 'company.member.platformRoles.user',
                    ),
                  },
                  {
                    label: t('company.member.fields.accountActive'),
                    value: (
                      <StatusBadge tone={member.accountActive ? 'success' : 'neutral'}>
                        {t(
                          member.accountActive
                            ? 'company.member.accountStates.active'
                            : 'company.member.accountStates.inactive',
                        )}
                      </StatusBadge>
                    ),
                  },
                ]}
              />
            </FormSection>
          </div>
        ) : null}
      </div>
    </div>
  );
}
