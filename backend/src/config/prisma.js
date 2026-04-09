// Centralized Prisma Client instance
// Import this from any file that needs database access

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
