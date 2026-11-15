import Link from 'next/link';
import { ArrowRight, Building2, Blocks, ShieldCheck, Users } from 'lucide-react';
import { PRODUCT_LABELS } from '@oliveira/schemas';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getTranslator } from '@/lib/i18n/server';
import { ROUTES } from '@/lib/navigation/routes';
import { getCompanyMembers } from '../_data-access/get-company-members';

/**
 * The company, read-only (handoff § 9a: "content defined by ADRs/specs — not
 * designed"): its name, the contracts it holds for each product and how many of
 * each product's licenses are in use. There is nothing to edit here — a limit is
 * raised by Oliveira, not by the company (docs/adr/0018) — so the page links to
 * the two places where something can be done: members and product access.
 */
export async function CompanyOverview() {
  const [t, company] = await Promise.all([getTranslator(), getCompanyMembers()]);
  const activeMembers = company.members.filter((member) => member.status === 'ACTIVE').length;

  return (
    <div data-testid="company-overview-page">
      <PageHeader
        title={t('company.overview.title')}
        titleTestId="company-overview-title"
        meta={t('company.overview.meta', { count: activeMembers })}
        actions={
          <>
            <Button asChild variant="outline" data-testid="company-overview-members">
              <Link href={ROUTES.company.members}>
                <Users aria-hidden="true" />
                {t('company.overview.manageMembers')}
              </Link>
            </Button>
            <Button asChild data-testid="company-overview-access">
              <Link href={ROUTES.company.productAccess()}>
                <Blocks aria-hidden="true" />
                {t('company.overview.manageAccess')}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </>
        }
      />

      <section className="mb-8 flex items-center gap-4 rounded-xl border border-border bg-card p-5">
        <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-[var(--olv-navy-50)] text-[var(--olv-navy-600)]">
          <Building2 className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p
            className="truncate text-xl font-semibold text-foreground"
            data-testid="company-overview-name"
          >
            {company.company.name}
          </p>
          <Badge variant="admin" className="mt-1">
            <ShieldCheck aria-hidden="true" />
            {t('company.members.role.admin')}
          </Badge>
        </div>
      </section>

      <section aria-labelledby="company-contracts-heading">
        <h2 id="company-contracts-heading">{t('company.overview.contracts')}</h2>
        <p className="mt-1 mb-4 text-[13px] text-text-3">{t('company.overview.contractsNote')}</p>

        {company.products.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-6 text-sm text-text-2">
            {t('company.overview.noContracts')}
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <Table stacked data-testid="company-contracts-table">
              <TableHeader>
                <TableRow className="h-10 hover:bg-transparent">
                  <TableHead>{t('company.overview.product')}</TableHead>
                  <TableHead>{t('company.overview.status')}</TableHead>
                  <TableHead>{t('company.overview.licenses')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.products.map((contract) => (
                  <TableRow
                    key={contract.product}
                    data-testid={`company-contract-${contract.product.toLowerCase()}`}
                  >
                    <TableCell className="font-medium" translate="no">
                      {PRODUCT_LABELS[contract.product]}
                    </TableCell>
                    <TableCell data-label={t('company.overview.status')}>
                      <StatusBadge tone={contract.status === 'ACTIVE' ? 'success' : 'warning'}>
                        {t(
                          contract.status === 'ACTIVE'
                            ? 'company.overview.statusActive'
                            : 'company.overview.statusSuspended',
                        )}
                      </StatusBadge>
                    </TableCell>
                    <TableCell
                      className="olv-data tabular"
                      data-label={t('company.overview.licenses')}
                    >
                      {contract.seatLimit === null
                        ? `${contract.seatsUsed} · ${t('company.overview.unlimited')}`
                        : t('company.overview.used', {
                            used: contract.seatsUsed,
                            limit: contract.seatLimit,
                          })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
