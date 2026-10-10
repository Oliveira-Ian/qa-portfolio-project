'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Blocks, Info, Search, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { PRODUCT_LABELS, PRODUCTS, type CompanyMembersDto, type Product } from '@oliveira/schemas';
import { PageHeader } from '@/components/layout/page-header';
import { SoonChip } from '@/components/platform/access-badge';
import { MemberIdentity, MembershipStatusBadge, RoleTag } from '@/components/platform/member-parts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsCount, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { translateApiMessage } from '@/lib/i18n/api-messages';
import { useT } from '@/lib/i18n/provider';
import { PRODUCT_AVAILABILITY } from '@/lib/products';
import { cn } from '@/lib/utils';
import { saveProductAccessAction } from '../../_actions/save-product-access';

interface ProductAccessEditorProps {
  company: CompanyMembersDto;
  /** The tab that is open: always a product that can be opened. */
  product: Product;
}

/**
 * Who can open each product (design S13): one switch per member, and an explicit
 * **Save changes** — access is never saved on toggle (handoff § 4). Nothing is sent
 * until then; **Discard** puts every switch back, and an "N unsaved changes"
 * line says how many have moved.
 *
 * Product access is the Platform's answer; what a person can do *inside* the
 * product is the product's — the two cards at the top say so. The licence limit
 * is checked here against what Save would leave in use (the API refuses the
 * rest), and the switches follow the contract: no active contract, no new access.
 */
export function ProductAccessEditor({ company, product }: ProductAccessEditorProps) {
  const t = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');

  const initial = useMemo(
    () =>
      Object.fromEntries(
        company.members.map((member) => [member.id, member.products.includes(product)]),
      ) as Record<string, boolean>,
    [company.members, product],
  );
  const [draft, setDraft] = useState<Record<string, boolean>>(initial);

  const label = PRODUCT_LABELS[product];
  const contract = company.products.find((entry) => entry.product === product);
  const hasActiveContract = contract?.status === 'ACTIVE';

  const changes = company.members
    .filter((member) => member.status === 'ACTIVE' && draft[member.id] !== initial[member.id])
    .map((member) => ({
      membershipId: member.id,
      product,
      granted: draft[member.id] === true,
    }));
  const isDirty = changes.length > 0;

  const activeMembers = company.members.filter((member) => member.status === 'ACTIVE');
  const withAccess = activeMembers.filter((member) => draft[member.id]).length;

  const projectedUsed =
    (contract?.seatsUsed ?? 0) +
    changes.filter((change) => change.granted).length -
    changes.filter((change) => !change.granted).length;
  const seatLimit = contract?.seatLimit ?? null;
  const isOverLimit = seatLimit !== null && projectedUsed > seatLimit;

  const term = search.trim().toLowerCase();
  const visibleMembers = company.members.filter(
    (member) =>
      term === '' ||
      member.name.toLowerCase().includes(term) ||
      member.email.toLowerCase().includes(term),
  );

  // Leaving with switches that haven't been saved loses them: ask the browser to confirm.
  useEffect(() => {
    if (!isDirty) {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  function handleDiscard() {
    setDraft(initial);
  }

  function handleSave() {
    if (isPending || !isDirty || isOverLimit) {
      return;
    }

    startTransition(async () => {
      const result = await saveProductAccessAction({ changes });

      if (!result.success) {
        toast.error(translateApiMessage(result.message ?? '', t));
        // What was applied before the refusal stays applied: show the truth.
        router.refresh();
        return;
      }

      toast.success(t('company.access.saved'));
      router.refresh();
    });
  }

  return (
    <div data-testid="company-product-access-page">
      <PageHeader
        title={t('company.access.title')}
        titleTestId="company-product-access-title"
        meta={t('company.access.meta', {
          used: withAccess,
          total: activeMembers.length,
          product: label,
        })}
        actions={
          <>
            <Button
              variant="ghost"
              disabled={!isDirty || isPending}
              onClick={handleDiscard}
              data-testid="company-access-discard"
            >
              {t('company.access.discard')}
            </Button>
            <Button
              loading={isPending}
              disabled={!isDirty || isOverLimit}
              onClick={handleSave}
              data-testid="company-access-save"
            >
              {t('company.access.save')}
            </Button>
          </>
        }
      />

      <div className="mb-6 grid overflow-hidden rounded-xl border border-border bg-card md:grid-cols-2 md:divide-x md:divide-border">
        <div className="flex items-center gap-3 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--olv-navy-50)] text-[var(--olv-navy-600)]">
            <Blocks className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {t('company.access.decidedHere')}
            </p>
            <p className="text-[13px] text-text-3">{t('company.access.decidedHereBody')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-border p-4 md:border-t-0">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-50 text-accent-600">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {t('company.access.permissions')}
            </p>
            <p className="text-[13px] text-text-3">{t('company.access.permissionsBody')}</p>
          </div>
        </div>
      </div>

      <Tabs value={product}>
        <TabsList aria-label={t('company.access.tabs')}>
          {PRODUCTS.map((entry) => {
            const isAvailable = PRODUCT_AVAILABILITY[entry].available;

            return (
              <TabsTrigger
                key={entry}
                value={entry}
                disabled={!isAvailable}
                data-testid={`company-access-tab-${entry.toLowerCase()}`}
              >
                <span translate="no">{PRODUCT_LABELS[entry]}</span>
                {entry === product ? <TabsCount>{withAccess}</TabsCount> : null}
                {!isAvailable ? <SoonChip /> : null}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={product} className="pt-5">
          <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="relative w-full max-w-80 min-w-56 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-3"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('company.access.search')}
                aria-label={t('company.access.search')}
                className="h-9 pl-9"
                data-testid="company-access-search"
              />
            </div>

            <p className="olv-data ml-auto flex items-center gap-4 text-text-3">
              {contract ? (
                <span data-testid="company-access-licenses">
                  {seatLimit === null
                    ? t('company.access.unlimited', { used: projectedUsed })
                    : t('company.access.licenses', { used: projectedUsed, limit: seatLimit })}
                </span>
              ) : null}
              {isDirty ? (
                <span
                  className="inline-flex items-center gap-1.5"
                  data-testid="company-access-unsaved"
                >
                  <Info className="size-4" aria-hidden="true" />
                  {t('company.access.unsaved', { count: changes.length })}
                </span>
              ) : null}
            </p>
          </div>

          {!hasActiveContract ? (
            <Alert variant="warning" className="mb-4" data-testid="company-access-suspended">
              <AlertDescription>
                {t('company.access.suspended', { product: label })}
              </AlertDescription>
            </Alert>
          ) : null}

          {isOverLimit && seatLimit !== null ? (
            <Alert variant="destructive" className="mb-4" data-testid="company-access-over-limit">
              <AlertDescription>
                {t('company.access.overLimit', { used: projectedUsed, limit: seatLimit })}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <Table data-testid="company-access-table">
              <TableHeader>
                <TableRow className="h-10 hover:bg-transparent">
                  <TableHead>{t('company.members.columns.member')}</TableHead>
                  <TableHead>{t('company.members.columns.role')}</TableHead>
                  <TableHead>{t('company.members.columns.status')}</TableHead>
                  <TableHead>{t('company.access.column', { product: label })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleMembers.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={4} className="h-24 text-center text-text-3">
                      {t('company.access.empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleMembers.map((member) => {
                    const isActive = member.status === 'ACTIVE';
                    const isGranted = draft[member.id] === true;
                    const hasChanged = isActive && isGranted !== initial[member.id];
                    const isDisabled = !isActive || (!hasActiveContract && !initial[member.id]);

                    return (
                      <TableRow
                        key={member.id}
                        className="h-[58px]"
                        data-testid={`company-access-row-${member.id}`}
                      >
                        <TableCell>
                          <MemberIdentity member={member} />
                        </TableCell>
                        <TableCell>
                          <RoleTag role={member.role} />
                        </TableCell>
                        <TableCell>
                          <MembershipStatusBadge status={member.status} />
                        </TableCell>
                        <TableCell data-product="platform">
                          <span className="flex items-center gap-3">
                            <Switch
                              checked={isActive && isGranted}
                              disabled={isDisabled}
                              onCheckedChange={(checked) =>
                                setDraft((current) => ({ ...current, [member.id]: checked }))
                              }
                              aria-label={t('company.access.toggle', {
                                product: label,
                                name: member.name,
                              })}
                              data-testid={`company-access-switch-${member.id}`}
                            />
                            <span
                              className={cn(
                                'text-sm',
                                isActive && isGranted
                                  ? 'font-semibold text-foreground'
                                  : 'text-text-3',
                              )}
                            >
                              {isActive
                                ? t(isGranted ? 'company.access.granted' : 'company.access.none')
                                : t('company.access.inactive')}
                            </span>
                            {hasChanged ? (
                              <span className="inline-flex h-[22px] items-center gap-1.5 rounded-xs bg-info-light px-2 font-mono text-[11px] font-medium tracking-[0.08em] text-info-on uppercase">
                                <i
                                  aria-hidden="true"
                                  className="size-1.5 rounded-full bg-current"
                                />
                                {t('company.access.unsavedTag')}
                              </span>
                            ) : null}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
