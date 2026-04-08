// Centralized Prisma Client instance
// Import this from any file that needs database access
// Do NOT create new PrismaClient instances elsewhere

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
