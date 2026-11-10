import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  companyProfileWriteSchema,
  type CompanyProfileDto,
  type CompanyProfileWriteInput,
} from '@oliveira/schemas';
import type { Company } from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import { docsOnlyValidatorCompiler } from '../../plugins/openapi.js';
import { NotFoundError } from '../../shared/errors.js';
import { sendSuccess } from '../../shared/http.js';
import { requireCompanyId } from '../../shared/request-context.js';
import { parseOrThrow } from '../../shared/validation.js';
import { requireCompanyAdmin, requireCompanyMember } from '../auth/authorize.js';
import { requireAuth } from '../auth/require-auth.js';

/**
 * The caller's company's registration — central Platform data (plan § 2.9).
 * Every member reads it (products show it as context); only the company's
 * account administrator edits it, and never the legal name or the CNPJ, which
 * identify the company to Oliveira. The company is the caller's own — there is
 * no id in the URL to tamper with. Small enough to keep its layers in one file.
 */

const orNull = (value: string): string | null => (value === '' ? null : value);

function toWriteData(input: CompanyProfileWriteInput) {
  return {
    tradeName: orNull(input.tradeName),
    stateRegistration: orNull(input.stateRegistration),
    municipalRegistration: orNull(input.municipalRegistration),
    email: orNull(input.email),
    phone: orNull(input.phone),
    website: orNull(input.website),
    zipCode: orNull(input.zipCode),
    street: orNull(input.street),
    number: orNull(input.number),
    complement: orNull(input.complement),
    district: orNull(input.district),
    city: orNull(input.city),
    state: input.state === '' ? null : input.state.toUpperCase(),
  };
}

function toDto(row: Company): CompanyProfileDto {
  return {
    id: row.id,
    legalName: row.legalName,
    document: row.document,
    tradeName: row.tradeName,
    stateRegistration: row.stateRegistration,
    municipalRegistration: row.municipalRegistration,
    email: row.email,
    phone: row.phone,
    website: row.website,
    zipCode: row.zipCode,
    street: row.street,
    number: row.number,
    complement: row.complement,
    district: row.district,
    city: row.city,
    state: row.state,
    updatedAt: row.updatedAt.toISOString(),
  };
}

const companyProfileRepository = {
  find(): Promise<Company | null> {
    return prisma.company.findUnique({ where: { id: requireCompanyId() } });
  },

  update(data: ReturnType<typeof toWriteData>): Promise<Company> {
    return prisma.company.update({ where: { id: requireCompanyId() }, data });
  },
};

const companyProfileController = {
  async get(_request: FastifyRequest, reply: FastifyReply) {
    const row = await companyProfileRepository.find();

    if (!row) {
      throw new NotFoundError('Company not found');
    }

    return sendSuccess(reply, 200, toDto(row));
  },

  async update(request: FastifyRequest, reply: FastifyReply) {
    const input = parseOrThrow(companyProfileWriteSchema, request.body);
    const row = await companyProfileRepository.update(toWriteData(input));

    request.log.info(
      { event: 'company.profile.updated', companyId: row.id },
      'Company profile updated',
    );

    return sendSuccess(reply, 200, toDto(row));
  },
};

export async function companyProfileRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get(
    '/',
    {
      preHandler: requireCompanyMember,
      schema: { tags: ['company'], security: [{ bearerAuth: [] }] },
      config: { errorMessage: 'Failed to get company' },
    },
    companyProfileController.get,
  );
  app.put(
    '/',
    {
      preHandler: requireCompanyAdmin,
      validatorCompiler: docsOnlyValidatorCompiler,
      schema: {
        tags: ['company'],
        body: companyProfileWriteSchema,
        security: [{ bearerAuth: [] }],
      },
      config: { errorMessage: 'Failed to update company' },
    },
    companyProfileController.update,
  );
}
