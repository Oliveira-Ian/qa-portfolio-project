import { AsyncLocalStorage } from 'node:async_hooks';
import type { SessionAccount } from '@oliveira/schemas';

/**
 * Who is making the request, for code that has no `request` in hand — in
 * practice the repository layer. Specification:
 * `docs/especificacoes/request-context.md`; why it is built this way:
 * `docs/adr/0016-request-context.md`.
 *
 * Deliberately just the actor. The active company arrives with the tenancy
 * work (#60), added to `RequestContext` and set in the same place; nothing is
 * stored ahead of something that reads it.
 */
export interface Actor {
  accountId: SessionAccount['id'];
  personId: SessionAccount['personId'];
  role: SessionAccount['role'];
}

export interface RequestContext {
  actor?: Actor;
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
