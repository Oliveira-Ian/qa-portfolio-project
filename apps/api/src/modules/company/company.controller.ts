import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  memberAddSchema,
  memberUpdateSchema,
  productSchema,
  type Product,
} from '@oliveira/schemas';
import { BadRequestError } from '../../shared/errors.js';
import { message, sendSuccess } from '../../shared/http.js';
import type { WithId, WithParams } from '../../shared/params.js';
import { parseOrThrow } from '../../shared/validation.js';
import { companyService } from './company.service.js';

export type WithSeat = WithParams<'id' | 'product'>;

/**
 * The same answer whether the address had an account or not — the route must
 * not tell a company administrator which e-mails are registered (rule 7 of
 * docs/especificacoes/platform-access-model.md).
 */
const ADD_MEMBER_ANSWER =
  'If an account with this e-mail exists and does not belong to a company yet, it was added to yours.';

function parseProduct(raw: string): Product {
  const parsed = productSchema.safeParse(raw);

  if (!parsed.success) {
    throw new BadRequestError('Unknown product');
  }

  return parsed.data;
}

/**
 * The audit trail of access changes (docs/adr/0018): a structured log line per
 * grant, revocation and membership change, with who did it, in which company and
 * to whom. Ids only — no e-mail, no name. The OpenTelemetry pipeline carries it
 * to Loki; a persisted, queryable trail is F-15 (#7).
 *
 * `requireCompanyAdmin` (wired at the routes) guarantees `request.account` and
 * `request.access.membership` here.
 */
function auditAccess(
  request: FastifyRequest,
  event: string,
  details: Record<string, string | number | boolean | undefined>,
) {
  request.log.info(
    {
      event,
      actorAccountId: request.account!.id,
      companyId: request.access!.membership!.companyId,
      ...details,
    },
    event,
  );
}

export const companyController = {
  async listMembers(_request: FastifyRequest, reply: FastifyReply) {
    return sendSuccess(reply, 200, await companyService.listMembers());
  },

  async addMember(request: FastifyRequest, reply: FastifyReply) {
    const input = parseOrThrow(memberAddSchema, request.body);
    const added = await companyService.addMember(input);

    if (added) {
      auditAccess(request, 'access.membership.added', {
        membershipId: added.id,
        targetAccountId: added.accountId,
      });
    }

    return sendSuccess(reply, 200, message(ADD_MEMBER_ANSWER));
  },

  async updateMember(request: FastifyRequest<WithId>, reply: FastifyReply) {
    const input = parseOrThrow(memberUpdateSchema, request.body);
    const member = await companyService.updateMember(request.params.id, input);

    auditAccess(request, 'access.membership.updated', {
      membershipId: member.id,
      targetAccountId: member.accountId,
      status: input.status,
      role: input.role,
    });

    return sendSuccess(reply, 200, member);
  },

  async grantSeat(request: FastifyRequest<WithSeat>, reply: FastifyReply) {
    const product = parseProduct(request.params.product);
    const result = await companyService.grantSeat(request.params.id, product, request.account!.id);

    if (result.changed) {
      auditAccess(request, 'access.product.granted', {
        membershipId: request.params.id,
        product,
      });
    }

    return sendSuccess(reply, 200, result);
  },

  async revokeSeat(request: FastifyRequest<WithSeat>, reply: FastifyReply) {
    const product = parseProduct(request.params.product);
    const result = await companyService.revokeSeat(request.params.id, product);

    if (result.changed) {
      auditAccess(request, 'access.product.revoked', {
        membershipId: request.params.id,
        product,
      });
    }

    return sendSuccess(reply, 200, result);
  },
};
