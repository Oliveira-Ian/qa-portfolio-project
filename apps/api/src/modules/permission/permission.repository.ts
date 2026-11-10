import type { Product } from '@oliveira/schemas';
import { prisma } from '../../config/prisma.js';

export const permissionRepository = {
  /** One product's section of the catalog. */
  findMany(product: Product) {
    return prisma.permission.findMany({
      where: { product },
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  },

  /** How many of `ids` exist in `product`'s catalog — a profile may only hold those. */
  countInProduct(ids: number[], product: Product): Promise<number> {
    return prisma.permission.count({ where: { id: { in: ids }, product } });
  },
};
