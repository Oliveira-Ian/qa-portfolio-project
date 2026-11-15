import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { PRODUCT_LABELS, type AccountDto, type Product } from '@oliveira/schemas';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DescriptionList } from '@/components/ui/description-list';
import { getTranslator } from '@/lib/i18n/server';

interface UserRecordProps {
  product: Product;
  account: AccountDto;
  /** The list's URL — Back goes there, Edit to `${basePath}/:id/edit`. */
  basePath: string;
}

/**
 * One member as a product sees them, read-only: who they are and the profile
 * they hold in this product. What they can open and their role in the company
 * are the Platform's (Company admin › Members), so they are not shown here.
 */
export async function UserRecord({ product, account, basePath }: UserRecordProps) {
  const t = await getTranslator();
  const productName = PRODUCT_LABELS[product];

  return (
    <div className="max-w-[60rem]" data-testid="user-record">
      <PageHeader
        title={account.personName}
        titleTestId="user-record-title"
        meta={account.email}
        actions={
          <>
            <Button variant="ghost" asChild data-testid="user-record-button-back">
              <Link href={basePath}>{t('accessControl.users.record.back')}</Link>
            </Button>
            <Button asChild variant="edit" data-testid="user-record-button-edit">
              <Link href={`${basePath}/${account.id}/edit`}>
                <Pencil aria-hidden="true" />
                {t('accessControl.users.record.edit')}
              </Link>
            </Button>
          </>
        }
      />

      <section className="rounded-xl border border-border bg-surface px-6 py-7">
        <DescriptionList
          items={[
            { label: t('accessControl.users.columns.name'), value: account.personName },
            {
              label: t('accessControl.users.columns.email'),
              value: <span className="olv-data">{account.email}</span>,
            },
            {
              label: t('accessControl.users.record.profileIn', { product: productName }),
              value: account.profile?.name ?? (
                <span className="text-text-3">{t('accessControl.users.noProfile')}</span>
              ),
            },
            {
              label: t('accessControl.users.columns.status'),
              value: (
                <StatusBadge tone={account.active ? 'success' : 'neutral'}>
                  {t(
                    account.active ? 'accessControl.users.active' : 'accessControl.users.inactive',
                  )}
                </StatusBadge>
              ),
            },
          ]}
        />
      </section>
    </div>
  );
}
