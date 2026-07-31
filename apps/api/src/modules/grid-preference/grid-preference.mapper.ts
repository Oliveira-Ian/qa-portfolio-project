import type { GridColumnPreference } from '@prisma/client';
import type { GridColumnPreferenceDto, GridColumnPreferenceItem } from '@oliveira/schemas';

export function toGridColumnPreferenceDto(row: GridColumnPreference): GridColumnPreferenceDto {
  return {
    gridKey: row.gridKey,
    columns: row.columns as GridColumnPreferenceItem[],
    updatedAt: row.updatedAt.toISOString(),
  };
}
