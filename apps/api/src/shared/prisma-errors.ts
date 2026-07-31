/** Prisma's "record required but not found" code. */
export const RECORD_NOT_FOUND = 'P2025';

/** Prisma's "unique constraint violated" code. */
export const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

/** Prisma's "foreign key constraint violated" code — a dependent row still references this one. */
export const FOREIGN_KEY_VIOLATION = 'P2003';

export function isPrismaCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === code;
}
