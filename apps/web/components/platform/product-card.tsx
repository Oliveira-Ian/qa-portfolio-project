'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Info, Lock } from 'lucide-react';
import type { Product } from '@oliveira/schemas';
import { BrandMark } from '@/components/brand/wordmark';
import { useT } from '@/lib/i18n/provider';
import { AREA_HOME } from '@/lib/navigation/nav';
import { PRODUCT_AVAILABILITY, areaName, areaScope, areaShortName } from '@/lib/products';
import { cn } from '@/lib/utils';
import { AccessBadge } from './access-badge';
import { ProductArt } from './product-art';

interface ProductCardProps {
  product: Product;
  /** Whether the signed-in user holds a seat in it. */
  hasAccess: boolean;
}

/**
 * A product on the Platform's Home (design S03–S06). Three states, and the third
 * is not a variant of the second:
 *
 * - **access** — the whole card is one link into the product (no button inside a
 *   clickable card), and lifts on hover;
 * - **no access** — visible but disabled (`aria-disabled`, still focusable, so a
 *   keyboard or screen-reader user learns why). It never opens. The reason is a
 *   tooltip on hover-capable devices and an inline message on tap or focus;
 * - **coming soon** — announced, not built (the FSM): disabled, with no ask
 *   attached, because there is nobody to ask for it yet.
 *
 * The product's accent colours its own name and its link; the access badge keeps
 * the Platform's colours (handoff § 2).
 */
export function ProductCard({ product, hasAccess }: ProductCardProps) {
  const t = useT();
  const [isMessageShown, setIsMessageShown] = useState(false);
  const isAvailable = PRODUCT_AVAILABILITY[product].available;
  const state = !isAvailable ? 'soon' : hasAccess ? 'access' : 'noAccess';
  const scope = areaScope(product);
  const name = areaName(product);
  const isDisabled = state !== 'access';
  const messageId = `product-${scope}-message`;

  const content = (
    <>
      <div className="relative h-[172px] overflow-hidden rounded-t-[11px] bg-shell">
        <ProductArt product={product} />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
          <span className="inline-flex items-center gap-2" translate="no" data-product={scope}>
            <BrandMark tone="dark" height={24} />
            <span className="text-sm leading-none font-semibold text-white">
              Oliveira <span className="font-medium text-accent-300">{areaShortName(product)}</span>
            </span>
          </span>
          {state !== 'access' ? (
            <span
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-white/20 bg-shell/60 px-2.5 text-xs font-medium text-white"
              data-testid={`product-card-${scope}-chip`}
            >
              {state === 'noAccess' ? (
                <Lock className="size-3" aria-hidden="true" />
              ) : (
                <Info className="size-3" aria-hidden="true" />
              )}
              {t(state === 'noAccess' ? 'home.card.noAccessChip' : 'home.card.soonChip')}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-6 pt-5 pb-5" data-product={scope}>
        <p className="olv-overline text-accent-600">
          {t(product === 'ERP' ? 'home.card.erp.kind' : 'home.card.fsm.kind')}
        </p>
        <h3 className="text-xl leading-7" translate="no">
          {name}
        </h3>
        <p className="text-sm leading-[1.5] text-text-2">
          {t(product === 'ERP' ? 'home.card.erp.description' : 'home.card.fsm.description')}
        </p>
      </div>

      <div
        className={cn(
          'flex min-h-14 items-center justify-between gap-3 border-t border-divider px-6 py-3',
          isDisabled && 'bg-surface-hover',
        )}
      >
        <AccessBadge
          state={state === 'access' ? 'granted' : state === 'noAccess' ? 'none' : 'soon'}
        />
        {state === 'access' ? (
          <span
            data-product={scope}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-600"
          >
            {t('home.card.open', { product: name })}
            <ArrowRight
              className="size-4 transition-transform duration-150 group-hover/prod:translate-x-[3px]"
              aria-hidden="true"
            />
          </span>
        ) : state === 'noAccess' ? (
          <span className="text-[13px] text-text-3">{t('home.card.askAdmin')}</span>
        ) : null}
      </div>
    </>
  );

  if (state === 'access') {
    return (
      <Link
        href={AREA_HOME[product]}
        data-testid={`product-card-${scope}`}
        className="group/prod flex flex-col rounded-xl border border-border bg-card text-left transition-[border-color,box-shadow,transform] duration-150 outline-none hover:-translate-y-0.5 hover:border-[#c9c4b9] hover:shadow-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="group/wrap relative" data-testid={`product-card-${scope}`}>
      <button
        type="button"
        aria-disabled="true"
        aria-describedby={messageId}
        onClick={() => setIsMessageShown((shown) => !shown)}
        onBlur={() => setIsMessageShown(false)}
        className="group/prod flex w-full cursor-not-allowed flex-col rounded-xl border border-border bg-surface-hover text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {content}
      </button>

      {/* On hover-capable devices the reason is a tooltip; on touch and for the
          keyboard it is this message, shown on tap or focus. `aria-describedby`
          points at it either way, so a screen reader reads it with the card. */}
      <span
        id={messageId}
        className={cn(
          'pointer-events-none absolute inset-x-0 -bottom-2 z-10 translate-y-full rounded-md bg-shell px-3 py-2 text-[13px] leading-[1.4] font-medium text-white opacity-0 shadow-menu transition-opacity delay-200 duration-150 [@media(hover:hover)]:group-hover/wrap:opacity-100',
          isMessageShown && 'opacity-100 delay-0',
        )}
      >
        {state === 'soon'
          ? t('home.card.soonReason', { product: name })
          : t('home.card.noAccessReason', { product: name })}
      </span>
    </div>
  );
}
