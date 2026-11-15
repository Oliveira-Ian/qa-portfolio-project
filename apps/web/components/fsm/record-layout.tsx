import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/*
 * The Oliveira FSM's record layout (Design System V2, HANDOFF-FSM § 5.8–5.10):
 * a header card with the record's identity, facts and equal-width tabs, then
 * cards. Server-safe (no hooks): pass already-translated text in.
 */

export function IconTile({
  icon: Icon,
  size = 'md',
  tone = 'accent',
  className,
  children,
}: {
  icon?: LucideIcon;
  size?: 'md' | 'lg';
  tone?: 'accent' | 'slate';
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center',
        size === 'lg' ? 'size-12 rounded-xl' : 'size-8 rounded-lg',
        tone === 'accent' ? 'bg-accent-50 text-accent-600' : 'bg-divider text-text-2',
        className,
      )}
    >
      {Icon ? <Icon className={size === 'lg' ? 'size-[22px]' : 'size-4'} /> : children}
    </span>
  );
}

interface FsmCardProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Right of the title: a link or a small button. */
  action?: React.ReactNode;
  /** `false` when the body is a table that runs to the card's edges. */
  padded?: boolean;
  className?: string;
  bodyClassName?: string;
  children?: React.ReactNode;
  testId?: string;
  as?: 'section' | 'aside' | 'div';
}

export function FsmCard({
  title,
  description,
  action,
  padded = true,
  className,
  bodyClassName,
  children,
  testId,
  as: Tag = 'section',
}: FsmCardProps) {
  return (
    <Tag
      data-testid={testId}
      className={cn(
        'min-w-0 rounded-xl border border-border bg-surface shadow-fsm-card',
        className,
      )}
    >
      {title || action ? (
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            {title ? <h2 className="text-[15px] leading-[22px] font-semibold">{title}</h2> : null}
            {description ? (
              <p className="text-[12.5px] leading-[18px] text-text-3">{description}</p>
            ) : null}
          </div>
          {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
        </div>
      ) : null}
      {children !== undefined ? (
        <div
          className={cn(
            padded && 'px-5 pb-5',
            !title && !action && padded && 'pt-5',
            bodyClassName,
          )}
        >
          {children}
        </div>
      ) : null}
    </Tag>
  );
}

export interface RecordFact {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}

interface RecordHeaderProps {
  tile: React.ReactNode;
  overline: React.ReactNode;
  title: string;
  titleTestId?: string;
  /** Pills and signals under the title. */
  chips?: React.ReactNode;
  actions?: React.ReactNode;
  /** Under the identity: a strip of facts, or the lifecycle progress. */
  strip?: React.ReactNode;
  /** The record's tabs, on the card's bottom edge. */
  tabs?: React.ReactNode;
  testId?: string;
}

export function RecordHeader({
  tile,
  overline,
  title,
  titleTestId,
  chips,
  actions,
  strip,
  tabs,
  testId,
}: RecordHeaderProps) {
  return (
    <section
      data-testid={testId}
      className="min-w-0 rounded-xl border border-border bg-surface shadow-fsm-card"
    >
      <div className="flex flex-wrap items-start gap-x-[18px] gap-y-4 p-[22px] pb-[18px]">
        {tile}
        <div className="flex min-w-[min(100%,24rem)] flex-1 flex-col gap-2">
          <span className="olv-overline text-text-3">{overline}</span>
          <h1
            data-testid={titleTestId}
            className="!text-[22px] !leading-[28px] font-semibold tracking-[-0.015em] text-foreground"
          >
            {title}
          </h1>
          {chips ? <div className="flex flex-wrap items-center gap-2.5">{chips}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {strip}
      {tabs ? <div className="px-2.5">{tabs}</div> : null}
    </section>
  );
}

export function RecordFacts({ facts }: { facts: RecordFact[] }) {
  return (
    <dl
      className="grid border-t border-border"
      style={{ gridTemplateColumns: `repeat(${facts.length}, minmax(0, 1fr))` }}
    >
      {facts.map((fact) => (
        <div
          key={fact.label}
          className="flex min-w-0 flex-col gap-0.5 border-r border-border px-[22px] py-3.5 last:border-r-0"
        >
          <dt className="text-[12.5px] text-text-3">{fact.label}</dt>
          <dd className="truncate text-[15px] font-semibold tabular-nums text-foreground">
            {fact.value}
          </dd>
          {fact.hint ? <dd className="truncate text-[12.5px] text-text-3">{fact.hint}</dd> : null}
        </div>
      ))}
    </dl>
  );
}

export interface RecordTab {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string;
  count?: number;
  /** Shown but not reachable (e.g. a read-only list while editing). */
  disabled?: boolean;
  /** A red count: this tab's fields have errors. */
  errorCount?: number;
  testId?: string;
}

/**
 * Equal-width record tabs (HANDOFF-FSM § 5.3): real links (`?tab=`), so a link
 * and Back restore the tab, and the server renders only what is open.
 */
export function RecordTabs({
  tabs,
  current,
  label,
  fill = true,
}: {
  tabs: RecordTab[];
  current: string;
  label: string;
  fill?: boolean;
}) {
  return (
    <nav aria-label={label} className="border-t border-border">
      <ul className={cn('flex gap-0.5 overflow-x-auto', fill && 'xl:overflow-visible')}>
        {tabs.map((tab) => {
          const isCurrent = tab.key === current;
          const Icon = tab.icon;
          const content = (
            <>
              <Icon
                aria-hidden="true"
                className={cn('size-4 shrink-0 text-text-muted', isCurrent && 'text-accent-600')}
              />
              <span className="whitespace-nowrap">{tab.label}</span>
              {tab.errorCount ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FEE4E2] px-1.5 text-[11.5px] font-semibold text-[#B42318] tabular-nums">
                  {tab.errorCount}
                </span>
              ) : tab.count !== undefined ? (
                <span
                  className={cn(
                    'inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-divider px-1.5 text-[11.5px] font-semibold text-text-3 tabular-nums',
                    isCurrent && 'bg-accent-50 text-accent-700',
                  )}
                >
                  {tab.count}
                </span>
              ) : null}
            </>
          );
          const className = cn(
            'relative flex h-[46px] items-center justify-center gap-2 rounded-t-lg px-3.5 text-sm font-medium text-text-3 outline-none transition-colors focus-visible:shadow-[inset_0_0_0_2px_var(--olv-accent-600)]',
            fill && 'xl:flex-1',
            isCurrent
              ? 'font-semibold text-foreground after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-t-sm after:bg-accent-600'
              : 'hover:bg-surface-hover hover:text-foreground',
            tab.disabled &&
              'cursor-not-allowed text-text-disabled hover:bg-transparent hover:text-text-disabled',
          );

          return (
            <li key={tab.key} className={cn('flex', fill && 'xl:flex-1')}>
              {tab.disabled ? (
                <span
                  aria-disabled="true"
                  data-testid={tab.testId}
                  className={cn(className, 'w-full')}
                >
                  {content}
                </span>
              ) : (
                <Link
                  href={tab.href}
                  scroll={false}
                  aria-current={isCurrent ? 'page' : undefined}
                  data-testid={tab.testId}
                  className={cn(className, 'w-full')}
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Label / value pairs in two columns (`fx-kv`). */
export function KeyValues({
  items,
  labelWidth = 116,
}: {
  items: { label: string; value: React.ReactNode }[];
  labelWidth?: number;
}) {
  return (
    <dl
      className="m-0 grid gap-3 text-[13.5px] leading-5"
      style={{ gridTemplateColumns: `${labelWidth}px minmax(0, 1fr)` }}
    >
      {items.map((item) => (
        <div key={item.label} className="contents">
          <dt className="text-text-3">{item.label}</dt>
          <dd className="m-0 min-w-0 text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** What the technician must read (accent tint) — service instructions. */
export function Callout({
  icon: Icon,
  title,
  children,
  testId,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      className="flex gap-3 rounded-[10px] border border-accent-100 bg-accent-50 px-4 py-3.5 text-[13.5px] leading-5 text-foreground"
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-700" />
      <div className="min-w-0">
        <b className="mb-0.5 block text-[12.5px] font-semibold text-accent-700">{title}</b>
        <span className="whitespace-pre-line">{children}</span>
      </div>
    </div>
  );
}

/** A system hint (blue): a suggestion, a rule, what happens next. */
export function Hint({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-[10px] border border-fsm-info-border bg-fsm-info-bg px-3.5 py-3 text-[13px] leading-[19px] text-fsm-info-fg">
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** The "New" badge of a field the redesign added. */
export function NewBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex h-5 items-center rounded-full bg-accent-50 px-[7px] text-[11px] font-semibold tracking-[0.02em] text-accent-700">
      {label}
    </span>
  );
}

/**
 * A section of a record (`fx-sec`): icon tile, title, a line of description,
 * "Optional" or "New" beside the title, and a 12-column field grid.
 */
export function SectionCard({
  icon,
  title,
  description,
  badge,
  children,
  testId,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <section
      data-testid={testId}
      className="rounded-xl border border-border bg-surface shadow-fsm-card"
    >
      <div className="flex items-start gap-3 px-[22px] pt-[18px] pb-1">
        <IconTile icon={icon} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-center gap-2">
            <h2 className="text-base font-semibold">{title}</h2>
            {badge}
          </span>
          {description ? <p className="m-0 text-[13px] text-text-3">{description}</p> : null}
        </div>
      </div>
      <div className="grid grid-cols-12 gap-x-5 gap-y-[18px] px-[22px] pt-4 pb-[22px]">
        {children}
      </div>
    </section>
  );
}

/**
 * A field in view mode (HANDOFF-FSM § 5.2): the label, then the value on a
 * hairline — full contrast, no box, "—" when empty. `span` is the 12-column
 * grid span (`col-span-*`, literal so Tailwind generates it).
 */
export function ReadOnlyField({
  label,
  value,
  span = 'col-span-12 md:col-span-6',
  mono = false,
  multiline = false,
}: {
  label: string;
  value: React.ReactNode;
  span?: string;
  mono?: boolean;
  multiline?: boolean;
}) {
  const isEmpty = value === null || value === undefined || value === '';

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', span)}>
      <span className="text-[13px] font-medium text-text-2">{label}</span>
      <span
        className={cn(
          'flex min-h-10 min-w-0 items-center gap-2 border-b border-border pb-0.5 text-[14.5px] font-medium text-foreground',
          multiline && 'items-start py-2.5 leading-[21px] font-normal whitespace-pre-line',
          mono && 'font-mono text-[13.5px]',
          isEmpty && 'font-normal text-text-muted',
        )}
      >
        {isEmpty ? '—' : value}
      </span>
    </div>
  );
}

/** "Optional" written once on a section. */
export function OptionalBadge({ label }: { label: string }) {
  return (
    <span className="text-[11px] font-semibold tracking-[0.06em] text-text-3 uppercase">
      {label}
    </span>
  );
}
