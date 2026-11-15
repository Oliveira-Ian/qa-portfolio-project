'use client';

import type { EquipmentStatus } from '@oliveira/schemas';
import { StatusBadge } from '@/components/ui/badge';
import { useT } from '@/lib/i18n/provider';

const TONE = { ACTIVE: 'success', UNDER_MAINTENANCE: 'warning', INACTIVE: 'neutral' } as const;

export function EquipmentStatusBadge({ status }: { status: EquipmentStatus }) {
  const t = useT();

  return <StatusBadge tone={TONE[status]}>{t(`fsm.equipment.status.${status}`)}</StatusBadge>;
}
