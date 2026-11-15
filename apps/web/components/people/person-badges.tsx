'use client';

import { Briefcase, Building2, Truck, User, type LucideIcon } from 'lucide-react';
import type { PersonTypeValue } from '@oliveira/schemas';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { useT } from '@/lib/i18n/provider';
import type { MessageKey } from '@/lib/i18n/translate';
import { cn } from '@/lib/utils';

/**
 * A person's type is a **tag** (a category: Archivo, sentence case, a pill with
 * an icon) and their status is a **state** (mono, uppercase, a dot) — the two
 * marks the design keeps visibly apart (handoff § 4). Neither is a product
 * colour: a type says nothing about access.
 */
const TYPE_LABEL: Record<PersonTypeValue, MessageKey> = {
  CLIENT: 'erp.personType.client',
  SUPPLIER: 'erp.personType.supplier',
  USER: 'erp.personType.user',
  EMPLOYEE: 'erp.personType.employee',
};

export const PERSON_TYPE_ICON: Record<PersonTypeValue, LucideIcon> = {
  CLIENT: Building2,
  SUPPLIER: Truck,
  USER: User,
  EMPLOYEE: Briefcase,
};

export function PersonTypeBadge({
  type,
  className,
  onRemove,
  removeLabel,
}: {
  type: PersonTypeValue;
  className?: string;
  /** Set only when this badge doubles as a removable tag — e.g. inside a MultiSelect. */
  onRemove?: () => void;
  removeLabel?: string;
}) {
  const t = useT();
  const Icon = PERSON_TYPE_ICON[type];
  const label = t(TYPE_LABEL[type]);

  return (
    <Badge
      variant="default"
      className={className}
      removeLabel={removeLabel ?? t('table.filters.remove', { label })}
      {...(onRemove ? { onRemove } : {})}
    >
      <Icon aria-hidden="true" />
      {label}
    </Badge>
  );
}

/** A person can hold more than one role at once — render one badge per type. */
export function PersonTypeBadges({
  types,
  className,
}: {
  types: PersonTypeValue[];
  className?: string;
}) {
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1', className)}>
      {types.map((type) => (
        <PersonTypeBadge key={type} type={type} />
      ))}
    </span>
  );
}

export function PersonStatusBadge({ active, className }: { active: boolean; className?: string }) {
  const t = useT();

  return (
    <StatusBadge tone={active ? 'success' : 'neutral'} className={className}>
      {t(active ? 'erp.status.active' : 'erp.status.inactive')}
    </StatusBadge>
  );
}
