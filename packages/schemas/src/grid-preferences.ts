import { z } from 'zod';

/**
 * Per-user column show/hide + order for a listing screen, saved by
 * `GridCustomizationModal` and read back into `useDataTable`'s initial
 * `columnVisibility`/`columnOrder` state. `gridKey` identifies the screen
 * (e.g. "person-list") — the same shape and endpoints serve every future
 * listing without a new schema per screen.
 */
export const gridColumnPreferenceItemSchema = z.object({
  key: z.string().trim().min(1),
  visible: z.boolean(),
});

export const gridColumnPreferenceSaveSchema = z.object({
  columns: z.array(gridColumnPreferenceItemSchema).min(1, 'At least one column is required'),
});

export type GridColumnPreferenceItem = z.infer<typeof gridColumnPreferenceItemSchema>;
export type GridColumnPreferenceSaveInput = z.infer<typeof gridColumnPreferenceSaveSchema>;

/** `null` (via the DTO being absent) means the account never saved a preference for this grid yet. */
export interface GridColumnPreferenceDto {
  gridKey: string;
  columns: GridColumnPreferenceItem[];
  updatedAt: string;
}
