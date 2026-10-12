'use client';

import Link from 'next/link';
import { Check, ChevronDown, Lock } from 'lucide-react';
import { PRODUCTS, type Product } from '@oliveira/schemas';
import { BrandMark } from '@/components/brand/wordmark';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useT } from '@/lib/i18n/provider';
import { AREA_HOME, type AreaKey } from '@/lib/navigation/nav';
import { PRODUCT_AVAILABILITY, areaName, areaScope, areaShortName } from '@/lib/products';
import { cn } from '@/lib/utils';

interface ProductSwitcherProps {
  area: AreaKey;
  /** The products the signed-in user may open. */
  products: readonly Product[];
  className?: string;
}

/**
 * The global bar's product switcher (handoff § 5): every product with its
 * access state — the one you are in, one you can open, one you can't, one that
 * is coming. A product you can't open stays in the list and links to its URL,
 * which explains why (the guard state, S07); it is never hidden, so a user
 * always knows the system exists and whom to ask.
 */
export function ProductSwitcher({ area, products, className }: ProductSwitcherProps) {
  const t = useT();

  const items: { area: AreaKey; state: 'current' | 'access' | 'noAccess' | 'soon' }[] = [
    { area: 'platform', state: area === 'platform' ? 'current' : 'access' },
    ...PRODUCTS.map((product) => ({
      area: product as AreaKey,
      state: !PRODUCT_AVAILABILITY[product].available
        ? ('soon' as const)
        : area === product
          ? ('current' as const)
          : products.includes(product)
            ? ('access' as const)
            : ('noAccess' as const),
    })),
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid="product-switcher"
          aria-label={t('shell.products.switch', { product: areaName(area) })}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-md border border-shell-border bg-shell-control px-2.5 text-sm font-medium text-accent-300 transition-colors duration-100 outline-none hover:bg-shell-control-hover focus-visible:ring-focus-shell aria-expanded:bg-shell-control-hover',
            className,
          )}
        >
          <span translate="no">{areaShortName(area)}</span>
          <ChevronDown className="size-3.5 text-shell-text-muted" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-72 min-w-72"
        data-testid="product-switcher-menu"
      >
        <DropdownMenuLabel className="olv-overline px-2.5 py-1.5 text-text-3">
          {t('shell.products.heading')}
        </DropdownMenuLabel>

        {items.map((item) => {
          const scope = areaScope(item.area);
          const isSoon = item.state === 'soon';

          return (
            <DropdownMenuItem
              key={item.area}
              asChild={!isSoon}
              disabled={isSoon}
              data-testid={`product-switcher-${scope}`}
              className="min-h-11 gap-3"
            >
              {isSoon ? (
                <span>
                  <SwitcherRow area={item.area} state={item.state} />
                </span>
              ) : (
                <Link
                  href={AREA_HOME[item.area]}
                  aria-current={item.state === 'current' ? 'page' : undefined}
                >
                  <SwitcherRow area={item.area} state={item.state} />
                </Link>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SwitcherRow({
  area,
  state,
}: {
  area: AreaKey;
  state: 'current' | 'access' | 'noAccess' | 'soon';
}) {
  const t = useT();

  return (
    <>
      <BrandMark tone="light" height={24} />
      <span className="min-w-0 flex-1 truncate font-medium text-foreground" translate="no">
        Oliveira{' '}
        <span className="text-accent-600" data-product={areaScope(area)}>
          {areaShortName(area)}
        </span>
      </span>
      {state === 'current' ? (
        <Check
          className="size-4 shrink-0 text-foreground"
          aria-label={t('shell.products.current')}
        />
      ) : (
        <span className="olv-overline inline-flex shrink-0 items-center gap-1 text-text-3">
          {state === 'noAccess' ? <Lock className="size-3" aria-hidden="true" /> : null}
          {t(
            state === 'access'
              ? 'shell.products.access'
              : state === 'noAccess'
                ? 'shell.products.noAccess'
                : 'shell.products.soon',
          )}
        </span>
      )}
    </>
  );
}
