'use client';

import type { EquipmentStatus } from '@oliveira/schemas';
import { EquipmentStatusPill } from '@/components/fsm/status-pill';

export function EquipmentStatusBadge({ status }: { status: EquipmentStatus }) {
  return <EquipmentStatusPill status={status} />;
}
