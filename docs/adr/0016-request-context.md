# 0016 — Request context through AsyncLocalStorage

## Context

The tenancy work ([0012](0012-tenant-isolation-extension-and-rls.md)), the audit fields and logical
deletion all need to know, at the repository layer, **who is making the request**. Today that stops at
the controller: `requireAuth` knows the account, `request.account` carries it as far as the controllers,
and a couple of services take it as an explicit argument. The specification is
[`docs/especificacoes/request-context.md`](../especificacoes/request-context.md); this records why the
mechanism is what it is.

## Decision

**An `AsyncLocalStorage` holds a small context object per request**, in
`apps/api/src/shared/request-context.ts`, with four functions: `runWithRequestContext`, `getActor`,
`requireActor` and `setActor`. It is our own module, not `@fastify/request-context`: the plugin solves
the in-request half, but gives no way to establish a context **outside** a request (the seed, background
jobs the audit work will need, tests), and the module is a few lines.

**The context is opened in `preValidation`, as a precaution.** The official request-context plugin
advises opening it after the body is parsed when body parsers or event-emitter based plugins
(multipart) are involved, because events emitted from the HTTP parser can run outside a context. That
could not be reproduced in this stack: a probe on Node 22.19 and Fastify 5.10 showed a context opened in
`onRequest` surviving JSON bodies sent with the head, after it, and as 640 KB in many packets. So this
is defensive, not a fix, and free: `preValidation` still runs before `preHandler`, where `requireAuth`
runs and calls `setActor`. The hook uses the callback style because `run()` has to wrap the
continuation of the hook chain.

**It holds only the actor.** The active company is added by #60 to the same object, in the same place,
after validating the caller's membership in the database. Nothing is stored ahead of a consumer.

**A Prisma extension can read it.** Prisma batches concurrent `findUnique` calls into one query, which
suggested that an extension callback might run under another request's context — the cross-company leak
[0012](0012-tenant-isolation-extension-and-rls.md) exists to prevent. Measured, it does not: with Prisma
7.10 and `@prisma/adapter-pg`, 240 concurrent calls (80 batched `findUnique`, 80 `findFirst`, 80
`findUnique` again), each awaited inside its own context, showed the callback the calling request's
context every time. The batching happens below the extension. So company scoping can read the context
from inside the extension, and repositories need no change to benefit.

**A Prisma query runs in the context of whoever awaits it.** The promise Prisma returns is lazy: it only
executes when awaited. A query built in one context and awaited in another — a promise returned out of
`runWithRequestContext` and awaited outside it — runs with no context at all (60 of 60 calls did, in the
same measurement). Await inside the context.

**Outside a request there is no ambient actor.** `getActor()` is `undefined`; `requireActor()` and
`setActor()` throw, which is a `500`: a missing actor is a bug, never an authentication failure, and it
must not fall back to a default.

## Consequences

- Repositories can read the actor without every service and repository signature carrying it.
- A hook registered in the wrong place, or a new plugin that breaks the async chain (a multipart upload,
  for example), loses the context. `setActor` and `requireActor` refuse to run without one, so this
  fails on the first request instead of silently. The concurrency test (over a real socket, body
  arriving after the head) covers the current app and would catch a Node or Fastify upgrade that changes
  the behaviour; an upload plugin would need its own check.
- The seed and future jobs must open a context explicitly to run anything that reads it.
- One more thing depends on `node:async_hooks`, which is stable in the Node versions this project
  requires.
