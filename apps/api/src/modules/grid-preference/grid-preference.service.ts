import type { GridColumnPreferenceDto, GridColumnPreferenceSaveInput } from '@oliveira/schemas';
import { toGridColumnPreferenceDto } from './grid-preference.mapper.js';
import { gridPreferenceRepository } from './grid-preference.repository.js';

export const gridPreferenceService = {
  /** `null` means this account never saved a preference for this grid — the caller falls back to the screen's built-in default column set. */
  async get(accountId: number, gridKey: string): Promise<GridColumnPreferenceDto | null> {
    const row = await gridPreferenceRepository.findByAccountAndKey(accountId, gridKey);
    return row ? toGridColumnPreferenceDto(row) : null;
  },

  async save(
    accountId: number,
    gridKey: string,
    input: GridColumnPreferenceSaveInput,
  ): Promise<GridColumnPreferenceDto> {
    const row = await gridPreferenceRepository.upsert(accountId, gridKey, input.columns);
    return toGridColumnPreferenceDto(row);
  },
};
