import type { Prisma } from '@prisma/client';
import type { GridColumnPreferenceItem } from '@oliveira/schemas';
import { prisma } from '../../config/prisma.js';

export const gridPreferenceRepository = {
  findByAccountAndKey(accountId: number, gridKey: string) {
    return prisma.gridColumnPreference.findUnique({
      where: { accountId_gridKey: { accountId, gridKey } },
    });
  },

  upsert(accountId: number, gridKey: string, columns: GridColumnPreferenceItem[]) {
    const columnsJson = columns as unknown as Prisma.InputJsonValue;

    return prisma.gridColumnPreference.upsert({
      where: { accountId_gridKey: { accountId, gridKey } },
      create: { accountId, gridKey, columns: columnsJson },
      update: { columns: columnsJson },
    });
  },
};
