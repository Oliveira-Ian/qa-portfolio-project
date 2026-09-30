import type { FastifyInstance } from 'fastify';
import { runWithRequestContext } from '../shared/request-context.js';

/**
 * Opens an empty request context around everything that runs after it —
 * `requireAuth` fills the actor in, the handler and the repositories read it
 * (`shared/request-context.ts`).
 *
 * `preValidation` rather than `onRequest`, as a precaution. The official
 * `@fastify/request-context` plugin advises opening the context after the body
 * has been parsed when body parsers or event-emitter based plugins (multipart)
 * are involved, because events emitted from the HTTP parser can run outside it.
 * That could not be reproduced here: on Node 22.19 and Fastify 5.10 a context
 * opened in `onRequest` survives JSON bodies, including ones that arrive in
 * several packets after the head. So this is a defensive choice, not a fix — and
 * a free one, since `preValidation` still runs before `preHandler`, where
 * `requireAuth` lives. `tests/unit/request-context.test.ts` pins what the
 * application relies on (concurrent requests stay apart over a real socket, with
 * the body arriving late), so a Node or Fastify upgrade, or an upload plugin,
 * that changes it is caught.
 *
 * The callback style (`done`) is not a choice: `run()` has to wrap the
 * continuation of the hook chain, which an `async` hook cannot do.
 */
export function registerRequestContext(app: FastifyInstance) {
  app.addHook('preValidation', (_request, _reply, done) => {
    runWithRequestContext({}, () => done());
  });
}
