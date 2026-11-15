/**
 * The application layer of tenant isolation (docs/adr/0012): puts the active
 * company on the arguments of every operation on a company-scoped model. Pure —
 * no Prisma import — so it can be reasoned about and tested on its own; the
 * client extension in `prisma.ts` is what calls it.
 *
 * The database layer (row-level security) does not depend on any of this: if a
 * code path skipped it, the policy would still hide and refuse other companies'
 * rows. This layer exists so that a missing filter is caught in the application
 * too, and so a company id smuggled into a write is refused rather than trusted.
 */

/**
 * Models whose rows belong to one company. Each has a NOT NULL `companyId` and a
 * forced row-level security policy in its migration; `tests/isolation` fails if
 * this list and the database ever disagree.
 */
export const TENANT_MODELS: ReadonlySet<string> = new Set(['Person']);

type Args = Record<string, unknown>;

export class TenantScopeError extends Error {}

function asRecord(value: unknown): Args {
  return value !== null && typeof value === 'object' ? (value as Args) : {};
}

function withCompanyWhere(where: unknown, companyId: string): Args {
  return where === undefined ? { companyId } : { AND: [where, { companyId }] };
}

/** `findUnique`/`update`/`delete` need a unique `where`; Prisma accepts extra non-unique fields on it. */
function withCompanyOnUniqueWhere(where: unknown, companyId: string): Args {
  return { ...asRecord(where), companyId };
}

function checkedCreateData(data: unknown, companyId: string, model: string): Args {
  const record = asRecord(data);

  if ('company' in record) {
    throw new TenantScopeError(
      `${model}: write the company as the scalar companyId, never as a "company" relation`,
    );
  }

  if (record.companyId !== undefined && record.companyId !== companyId) {
    throw new TenantScopeError(`${model}: companyId does not match the active company`);
  }

  return { ...record, companyId };
}

function checkedUpdateData(data: unknown, companyId: string, model: string): Args {
  const record = asRecord(data);

  if ('company' in record || (record.companyId !== undefined && record.companyId !== companyId)) {
    throw new TenantScopeError(`${model}: a row cannot move to another company`);
  }

  return record;
}

/**
 * Returns the arguments with the company applied, or throws for an operation it
 * does not know — a new Prisma operation must be handled here before it can
 * reach a company-scoped table.
 */
export function scopeToCompany(
  model: string,
  operation: string,
  args: unknown,
  companyId: string,
): Args {
  const next: Args = { ...asRecord(args) };

  switch (operation) {
    case 'findMany':
    case 'findFirst':
    case 'findFirstOrThrow':
    case 'count':
    case 'aggregate':
    case 'groupBy':
    case 'deleteMany':
      next.where = withCompanyWhere(next.where, companyId);
      return next;

    case 'updateMany':
    case 'updateManyAndReturn':
      next.where = withCompanyWhere(next.where, companyId);
      next.data = checkedUpdateData(next.data, companyId, model);
      return next;

    case 'findUnique':
    case 'findUniqueOrThrow':
    case 'delete':
      next.where = withCompanyOnUniqueWhere(next.where, companyId);
      return next;

    case 'update':
      next.where = withCompanyOnUniqueWhere(next.where, companyId);
      next.data = checkedUpdateData(next.data, companyId, model);
      return next;

    case 'upsert':
      next.where = withCompanyOnUniqueWhere(next.where, companyId);
      next.create = checkedCreateData(next.create, companyId, model);
      next.update = checkedUpdateData(next.update, companyId, model);
      return next;

    case 'create':
      next.data = checkedCreateData(next.data, companyId, model);
      return next;

    case 'createMany':
    case 'createManyAndReturn': {
      const rows = Array.isArray(next.data) ? next.data : [next.data];
      next.data = rows.map((row) => checkedCreateData(row, companyId, model));
      return next;
    }

    default:
      throw new TenantScopeError(`${model}.${operation} is not scoped to a company`);
  }
}
