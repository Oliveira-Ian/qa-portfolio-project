'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, ChevronsUpDown, Pencil, Plus, Search } from 'lucide-react';
import {
  PRODUCT_LABELS,
  PRODUCTS,
  type CompanyMembersDto,
  type MembershipRole,
  type MembershipStatus,
} from '@oliveira/schemas';
import { AccessBadge, SoonChip } from '@/components/platform/access-badge';
import { MemberIdentity, MembershipStatusBadge, RoleTag } from '@/components/platform/member-parts';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ListPagination } from '@/components/ui/list-pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateMedium } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n/provider';
import { ROUTES } from '@/lib/navigation/routes';
import { PRODUCT_AVAILABILITY } from '@/lib/products';
import { FilterMenu } from './filter-menu';

type RoleFilter = 'all' | MembershipRole;
type StatusFilter = 'all' | MembershipStatus;
type SortKey = 'name' | 'joined';

interface MemberListProps {
  company: CompanyMembersDto;
}

/**
 * The company's members (design S10): search, role and status filters, and a
 * table with each member's role, state and product access. A click selects a
 * member, a double click (or Enter) opens their page, and Add and Edit live in
 * the header (docs/design/patterns/listing_pages.md) — no per-row menu.
 *
 * The API returns every member at once, so searching, filtering, sorting and
 * paging happen here.
 */
export function MemberList({ company }: MemberListProps) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<RoleFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc',
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visibleMembers = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = company.members.filter(
      (member) =>
        (role === 'all' || member.role === role) &&
        (status === 'all' || member.status === status) &&
        (term === '' ||
          member.name.toLowerCase().includes(term) ||
          member.email.toLowerCase().includes(term)),
    );
    const direction = sort.direction === 'asc' ? 1 : -1;

    return filtered.sort((a, b) =>
      sort.key === 'name'
        ? direction * a.name.localeCompare(b.name, locale)
        : direction * (Date.parse(a.createdAt) - Date.parse(b.createdAt)),
    );
  }, [company.members, search, role, status, sort, locale]);

  const pageCount = Math.max(Math.ceil(visibleMembers.length / pageSize), 1);
  const currentPage = Math.min(page, pageCount);
  const pageMembers = visibleMembers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function handleToggle(id: string) {
    setSelectedId((current) => (current === id ? null : id));
  }

  function handleSortChange(key: SortKey) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    );
  }

  function ariaSortOf(key: SortKey): 'ascending' | 'descending' | 'none' {
    return sort.key === key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none';
  }

  const allLabel = t('company.members.all');

  return (
    <div data-testid="company-members-page">
      <PageHeader
        title={t('company.members.title')}
        titleTestId="company-members-title"
        meta={t('company.members.meta', { count: company.members.length })}
        actions={
          <>
            <Button
              variant="outline"
              disabled={selectedId === null}
              onClick={() => selectedId && router.push(ROUTES.company.memberEdit(selectedId))}
              data-testid="company-members-edit"
            >
              <Pencil aria-hidden="true" />
              {t('company.members.edit')}
            </Button>
            <Button asChild data-testid="company-members-add">
              <Link href={ROUTES.company.memberNew}>
                <Plus aria-hidden="true" />
                {t('company.members.add')}
              </Link>
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-80 min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-3"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={t('company.members.search')}
            aria-label={t('company.members.search')}
            className="h-9 pl-9"
            data-testid="company-members-search"
          />
        </div>

        <FilterMenu<RoleFilter>
          testId="company-members-filter-role"
          label={t('company.members.roleFilter', {
            value:
              role === 'all'
                ? allLabel
                : t(
                    role === 'ADMIN' ? 'company.members.role.admin' : 'company.members.role.member',
                  ),
          })}
          value={role}
          options={[
            { value: 'all', label: allLabel },
            { value: 'ADMIN', label: t('company.members.role.admin') },
            { value: 'MEMBER', label: t('company.members.role.member') },
          ]}
          onChange={(next) => {
            setRole(next);
            setPage(1);
          }}
        />

        <FilterMenu<StatusFilter>
          testId="company-members-filter-status"
          label={t('company.members.statusFilter', {
            value:
              status === 'all'
                ? allLabel
                : t(
                    status === 'ACTIVE'
                      ? 'company.members.status.active'
                      : 'company.members.status.inactive',
                  ),
          })}
          value={status}
          options={[
            { value: 'all', label: allLabel },
            { value: 'ACTIVE', label: t('company.members.status.active') },
            { value: 'INACTIVE', label: t('company.members.status.inactive') },
          ]}
          onChange={(next) => {
            setStatus(next);
            setPage(1);
          }}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <Table stacked data-testid="company-members-table">
          <TableHeader>
            <TableRow className="h-10 hover:bg-transparent">
              <TableHead className="w-10">
                <span className="sr-only">{t('company.members.columns.select')}</span>
              </TableHead>
              <TableHead aria-sort={ariaSortOf('name')}>
                <SortButton
                  label={t('company.members.columns.member')}
                  direction={sort.key === 'name' ? sort.direction : null}
                  onClick={() => handleSortChange('name')}
                  testId="company-members-sort-name"
                />
              </TableHead>
              <TableHead>{t('company.members.columns.role')}</TableHead>
              <TableHead>{t('company.members.columns.status')}</TableHead>
              {PRODUCTS.map((product) => (
                <TableHead key={product}>
                  <span className="inline-flex items-center gap-2">
                    <span translate="no">{PRODUCT_LABELS[product]}</span>
                    {!PRODUCT_AVAILABILITY[product].available ? <SoonChip /> : null}
                  </span>
                </TableHead>
              ))}
              <TableHead aria-sort={ariaSortOf('joined')}>
                <SortButton
                  label={t('company.members.columns.joined')}
                  direction={sort.key === 'joined' ? sort.direction : null}
                  onClick={() => handleSortChange('joined')}
                  testId="company-members-sort-joined"
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageMembers.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={4 + PRODUCTS.length}
                  className="h-24 text-center text-text-3"
                  data-testid="company-members-empty"
                >
                  {t('company.members.empty')}
                </TableCell>
              </TableRow>
            ) : (
              pageMembers.map((member) => (
                <TableRow
                  key={member.id}
                  className="h-[58px] cursor-pointer focus-visible:-outline-offset-2 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
                  tabIndex={0}
                  aria-selected={member.id === selectedId}
                  data-state={member.id === selectedId ? 'selected' : undefined}
                  onClick={() => handleToggle(member.id)}
                  onDoubleClick={() => router.push(ROUTES.company.member(member.id))}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) {
                      return;
                    }

                    if (event.key === 'Enter') {
                      event.preventDefault();
                      router.push(ROUTES.company.member(member.id));
                    } else if (event.key === ' ') {
                      event.preventDefault();
                      handleToggle(member.id);
                    }
                  }}
                  data-testid={`company-member-row-${member.id}`}
                >
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    <Checkbox
                      checked={member.id === selectedId}
                      onCheckedChange={() => handleToggle(member.id)}
                      aria-label={t('company.members.select', { name: member.name })}
                      data-testid={`company-member-select-${member.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <MemberIdentity member={member} />
                  </TableCell>
                  <TableCell data-label={t('company.members.columns.role')}>
                    <RoleTag role={member.role} />
                  </TableCell>
                  <TableCell data-label={t('company.members.columns.status')}>
                    <MembershipStatusBadge status={member.status} />
                  </TableCell>
                  {PRODUCTS.map((product) => (
                    <TableCell key={product} data-label={PRODUCT_LABELS[product]}>
                      {member.status === 'ACTIVE' && PRODUCT_AVAILABILITY[product].available ? (
                        <AccessBadge
                          state={member.products.includes(product) ? 'granted' : 'none'}
                        />
                      ) : (
                        <span className="text-text-3">—</span>
                      )}
                    </TableCell>
                  ))}
                  <TableCell
                    className="olv-data text-text-2"
                    data-label={t('company.members.columns.joined')}
                  >
                    {formatDateMedium(member.createdAt, locale)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ListPagination
        page={currentPage}
        pageSize={pageSize}
        total={visibleMembers.length}
        onPageChange={setPage}
        onPageSizeChange={(next) => {
          setPageSize(next);
          setPage(1);
        }}
        testIdPrefix="company-members"
      />
    </div>
  );
}

function SortButton({
  label,
  direction,
  onClick,
  testId,
}: {
  label: string;
  direction: 'asc' | 'desc' | null;
  onClick: () => void;
  testId: string;
}) {
  const Icon = direction === 'asc' ? ArrowUp : direction === 'desc' ? ArrowDown : ChevronsUpDown;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2.5 h-7 gap-1.5 px-2.5 text-[13px] font-semibold text-foreground"
      onClick={onClick}
      data-testid={testId}
    >
      {label}
      <Icon className="size-3.5 text-text-3" aria-hidden="true" />
    </Button>
  );
}
