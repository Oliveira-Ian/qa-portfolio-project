import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, Mail, ShieldCheck } from 'lucide-react';
import { PRODUCT_LABELS, PRODUCTS } from '@oliveira/schemas';
import { ProductCard } from '@/components/platform/product-card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTranslator } from '@/lib/i18n/server';
import { ROUTES } from '@/lib/navigation/routes';
import { getMe } from '@/lib/permissions';
import { PLATFORM_NAME } from '@/lib/products';
import { getCompanyMembers } from '../company/_data-access/get-company-members';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();

  return { title: t('nav.platform.home') };
}

/**
 * The Platform's Home (design S03–S06): a catalogue of the systems the signed-in
 * user's company uses, and the user's access to each. Every state is one page:
 *
 * - a **member** sees the products and whether each is open to them;
 * - a **company admin** also sees a compact strip of their company (members,
 *   seats) linking to the administration;
 * - an account with **no company** sees how to get into one — which here is
 *   only "ask a company admin to add you with this e-mail": nothing in the API
 *   creates a company (docs/adr/0018), so the design's "Create a company" is not
 *   offered.
 *
 * A product the user can't open is shown, never hidden, and never opens. The
 * design's "pending invitations" count is not shown either: there are no
 * invitations until they are built.
 */
export default async function HomePage() {
  const [t, me] = await Promise.all([getTranslator(), getMe()]);
  const firstName = me.person.name.trim().split(/\s+/)[0] ?? me.person.name;
  const membership = me.membership;
  const isCompanyAdmin = membership?.role === 'ADMIN';

  return (
    <div data-testid="home-page">
      <header className="mb-10">
        <p className="olv-overline text-text-3" data-testid="home-overline">
          {membership
            ? `${membership.companyName} · ${t(isCompanyAdmin ? 'home.role.admin' : 'home.role.member')}`
            : PLATFORM_NAME}
        </p>
        <h1 className="olv-display mt-2 text-foreground" data-testid="home-page-title">
          {t('home.greeting', { name: firstName })}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-6 text-text-2">
          {membership ? t('home.lead.company') : t('home.lead.noCompany')}
        </p>
      </header>

      {membership ? (
        <>
          <section aria-labelledby="home-products-heading">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h2 id="home-products-heading">{t('home.products.heading')}</h2>
              <p className="text-[13px] text-text-3">{t('home.products.note')}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {PRODUCTS.map((product) => (
                <ProductCard
                  key={product}
                  product={product}
                  hasAccess={me.products.includes(product)}
                />
              ))}
            </div>
          </section>

          {isCompanyAdmin ? <CompanyStrip /> : null}
        </>
      ) : (
        <section aria-labelledby="home-join-heading">
          <div className="max-w-xl rounded-xl border border-border bg-card p-6">
            <span className="grid size-9 place-items-center rounded-lg bg-[var(--olv-navy-50)] text-[var(--olv-navy-600)]">
              <Mail className="size-[18px]" aria-hidden="true" />
            </span>
            <h2 id="home-join-heading" className="mt-4">
              {t('home.noCompany.join.title')}
            </h2>
            <p className="mt-2 text-sm leading-[1.5] text-text-2">
              {t('home.noCompany.join.body')}
            </p>
            <p className="mt-4 inline-flex max-w-full items-center gap-2 rounded-md bg-subtle px-3 py-2 text-[13px] text-text-2">
              <Mail className="size-4 shrink-0" aria-hidden="true" />
              <span className="olv-data truncate" data-testid="home-account-email">
                {me.account.email}
              </span>
            </p>
          </div>

          <Alert variant="info" className="mt-6 max-w-xl">
            <AlertDescription>{t('home.noCompany.note')}</AlertDescription>
          </Alert>
        </section>
      )}
    </div>
  );
}

/** The admin's compact view of their company — the counts come from the API, not from the page. */
async function CompanyStrip() {
  const [t, company] = await Promise.all([getTranslator(), getCompanyMembers()]);
  const erp = company.products.find((product) => product.product === 'ERP');
  const activeMembers = company.members.filter((member) => member.status === 'ACTIVE').length;

  return (
    <section
      aria-label={company.company.name}
      data-testid="home-company-strip"
      className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[var(--olv-navy-50)] text-[var(--olv-navy-600)]">
          <Building2 className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-foreground">{company.company.name}</p>
          <Badge variant="admin" className="mt-1">
            <ShieldCheck aria-hidden="true" />
            {t('home.role.admin')}
          </Badge>
        </div>
      </div>

      <dl className="flex flex-wrap gap-x-10 gap-y-3">
        <div>
          <dt className="olv-overline text-text-3">{t('home.strip.members')}</dt>
          <dd
            className="olv-data mt-1 text-[15px] text-foreground"
            data-testid="home-strip-members"
          >
            {activeMembers}
          </dd>
        </div>
        {erp ? (
          <div>
            <dt className="olv-overline text-text-3">
              {t('home.strip.access', { product: PRODUCT_LABELS.ERP })}
            </dt>
            <dd
              className="olv-data mt-1 text-[15px] text-foreground"
              data-testid="home-strip-erp-seats"
            >
              {erp.seatLimit === null
                ? erp.seatsUsed
                : t('home.strip.ofLimit', { used: erp.seatsUsed, limit: erp.seatLimit })}
            </dd>
          </div>
        ) : null}
      </dl>

      <Button
        asChild
        variant="outline"
        size="sm"
        className="ml-auto"
        data-testid="home-strip-admin"
      >
        <Link href={ROUTES.company.members}>
          {t('nav.platform.companyAdmin')}
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </section>
  );
}
