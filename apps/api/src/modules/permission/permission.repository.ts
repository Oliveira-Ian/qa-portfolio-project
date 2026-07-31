import { prisma } from '../../config/prisma.js';

/** Read-only — the catalog is seeded (`prisma/seed.ts`), never written via the API. */
export const permissionRepository = {
  findMany() {
    return prisma.permission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }] });
  },
};
