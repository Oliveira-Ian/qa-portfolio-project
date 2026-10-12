import { AsyncLocalStorage } from 'node:async_hooks';
import type { SessionAccount } from '@oliveira/schemas';

/**
 * Who is making the request, for code that has no `request` in hand — in
 * practice the repository layer. Specification:
 * `docs/especificacoes/request-context.md`; why it is built this way:
 * `docs/adr/0016-request-context.md`.
 *
 * The actor, and the caller's active company. The company is set in the same
 * place as the actor, after `requireAuth` has read the caller's membership from
 * the database (docs/adr/0018) — the tenancy work (#60) is the consumer that
 * turns it into a query filter; until then it scopes the company's own data
 * (members, the accounts listing).
 */
export interface Actor {
  accountId: SessionAccount['id'];
  personId: SessionAccount['personId'];
  role: SessionAccount['role'];
}

export interface RequestContext {
  actor?: Actor;
  /** Absent for an account with no active membership. */
  companyId?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

/**
 * Runs `callback` with `context` as the ambient context. `plugins/request-context.ts`
 * does it once per request; the seed, a background job or a test does it
 * explicitly, since there is no ambient actor outside a request.
 */
export function runWithRequestContext<T>(context: RequestContext, callback: () => T): T {
  return storage.run(context, callback);
}

/** The caller, or `undefined` — a route that never authenticates has none. */
export function getActor(): Actor | undefined {
  return storage.getStore()?.actor;
}

/**
 * For code that cannot do its job without a caller. A missing actor here is a
 * bug (a route without `requireAuth`, a job that never opened a context), not
 * an authentication failure — so it throws a plain `Error`, which the error
 * handler answers as a 500, and never falls back to a default actor.
 */
export function requireActor(): Actor {
  const actor = getActor();

  if (!actor) {
    throw new Error('No actor in the request context');
  }

  return actor;
}

/**
 * Called by `requireAuth`, once the account has been loaded and checked.
 * Refuses to run without a context, so a hook that was never registered fails
 * on the first request instead of silently losing the actor.
 */
export function setActor(actor: Actor): void {
  const context = storage.getStore();

  if (!context) {
    throw new Error('No request context to set the actor on');
  }

  context.actor = actor;
}

/** The caller's active company, or `undefined` — an account with no membership has none. */
export function getCompanyId(): string | undefined {
  return storage.getStore()?.companyId;
}

/**
 * For code that only makes sense inside a company. A missing company here is a
 * bug (a route that never checked the caller belongs to one), so like
 * `requireActor` it throws a plain `Error` — a 500, never a fallback.
 */
export function requireCompanyId(): string {
  const companyId = getCompanyId();

  if (!companyId) {
    throw new Error('No company in the request context');
  }

  return companyId;
}

/** Called by `requireAuth` alongside `setActor`, and only when the caller has a membership. */
export function setCompanyId(companyId: string): void {
  const context = storage.getStore();

  if (!context) {
    throw new Error('No request context to set the company on');
  }

  context.companyId = companyId;
}
