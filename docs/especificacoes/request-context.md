# Request context — who is calling, available to the repository layer

Specification of Feature #36 (parent Epic: F-15 Audit, #7). It is the one deliberate exception the
workflow allows to "every Feature is vertical": shared infrastructure that delivers no observable
behaviour on its own, built once because three modules need it — company scoping (F-12, #6), audit
fields (F-15, #37) and logical deletion (F-17, #39). The reasoning behind the mechanism is in
[ADR 0016](../adr/0016-request-context.md).

## Objective

Make **who is making the request** available to the repository layer, where data is read and written,
without passing it down through every service and repository signature.

Today the actor stops at the controller: `requireAuth` knows the account (since #58 it is read from the
database on every request), `request.account` carries it to controllers, and a few services receive it
as an explicit argument (`accountService.update(id, actorAccountId, …)`). Nothing below the service
can see it.

## Functional requirements

1. A request has a **context** that lives for the whole of its handling and is invisible to every other
   request.
2. `requireAuth` puts the **actor** into that context: `accountId`, `personId` and `role`, taken from
   the account it already loads from the database.
3. Code anywhere below the route — in practice the repository layer — can read the actor
   **without receiving it as a parameter**.
4. Outside a request (the seed, a future background job, a test) there is no ambient actor. Code that
   has to run there establishes a context explicitly.
5. A route that never authenticates (`/health`, `POST /api/auth/login`, `POST /api/auth/register`) still
   has a context, without an actor.

## Business rules

- **The context holds only what exists today.** The actor, nothing else. The active company is *not*
  added here: no company exists yet, and nothing is built ahead of a consumer
  ([ADR 0011](../adr/0011-platform-shape.md)). The tenancy work (#60) adds `companyId` to the same
  object, set at the same place, after validating the caller's membership in the database.
- **Reading an actor that is not there is a programming error, not a user error.** A function that
  needs one (`requireActor()`) fails loudly, which surfaces as a `500`; it never falls back to a
  default, and never answers `401`.
- **A Prisma query runs in the context of whoever awaits it.** `prisma.x.findMany()` returns a lazy
  promise that only executes when awaited, so a query built in one context and awaited in another (a
  promise returned out of `runWithRequestContext` and awaited outside it) runs with no context at all.
  Await inside the context. This was measured, not assumed: 60 of 60 calls awaited outside the scope saw
  no context.
- **A Prisma extension can read the context.** Prisma batches concurrent `findUnique` calls, which
  suggested a callback might run under another request's context. It does not: with Prisma 7.10 and
  `@prisma/adapter-pg`, 240 concurrent calls (80 batched `findUnique`, 80 `findFirst`, 80 `findUnique`
  again), each awaited inside its own context, showed the extension callback the calling request's
  context every time. The batching happens below the extension. What #60 still has to prove is the
  wrapper it will put around each operation (`set_config` plus the query in one transaction) and
  interactive transactions, under concurrency, over the pool.

## Flows

```
request
  └─ preValidation   registerRequestContext: opens an empty context      (new)
       └─ preHandler   requireAuth: verifies the token, loads the account,
       │               rejects a missing or deactivated one (#58), then
       │               setActor({ accountId, personId, role })              (new)
            └─ handler → service → repository → getActor() / requireActor()
```

The context is opened in **`preValidation`** — after the body is parsed and before `preHandler`, where
`requireAuth` lives — as a precaution rather than a fix. The official `@fastify/request-context` plugin
advises opening it after parsing when body parsers or event-emitter based plugins (multipart) are
involved, since events emitted from the HTTP parser can run outside a context. That could not be
reproduced here: a probe on Node 22.19 and Fastify 5.10 showed a context opened in `onRequest` surviving
JSON bodies sent together with the head, sent after it, and sent as 640 KB in many packets. Choosing the
later hook costs nothing and stays correct if an upload plugin is ever added; the concurrency test
below is what guards the property itself.

## Screens

None.

## Permissions

None. Nothing about who may do what changes; this only carries the identity that is already
established.

## Validations

None on input. The one runtime check is that `setActor` and `requireActor` refuse to run without a
context, so a hook that was never registered fails on the first request instead of silently losing the
actor.

## Data model impact

None. No migration, no schema change, no new dependency (`node:async_hooks` is part of Node).

## Documentation impact

- ADR 0016 (new) and its line in the ADR index.
- ADR 0012: points here, and gains the assumption above in the list the spike must validate.
- `docs/index.md`: one line in the backend architecture.

## Out of scope

- The active company (#60).
- `createdBy`/`updatedBy` on records (#37) and the change trail (#38).
- Logical deletion (#39).
- Putting the actor in the log lines (F-18).
- Replacing the explicit `actorAccountId` argument of `accountService.update` with the context. Same
  behaviour either way; it can be done later if it is worth it.

## Acceptance criteria

1. A repository function reads the caller's actor without it being passed in.
2. Two concurrent requests with different actors never see each other's, including after an `await`,
   inside `Promise.all`, and **after a JSON body has been parsed**.
3. Outside a request there is no ambient actor: `getActor()` is `undefined`, `requireActor()` and
   `setActor()` throw, and `runWithRequestContext` establishes one explicitly.
4. `/health`, login and register keep working and see no actor.
5. No endpoint changes behaviour.

The second criterion is covered by an automated test (`tests/unit/request-context.test.ts`) — an
approved exception to the project's no-tests-unless-asked rule, because company isolation is built on
it. It runs over a real socket, with 60 requests in flight and the JSON body arriving after the head,
the path where the plugin authors warn a context can be lost. It guards the property, not the choice of
hook: a context opened in `onRequest` passes it too, on the current stack.
