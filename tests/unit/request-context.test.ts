import http from 'node:http';
import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { registerRequestContext } from '../../apps/api/src/plugins/request-context.js';
import {
  getActor,
  requireActor,
  runWithRequestContext,
  setActor,
  type Actor,
} from '../../apps/api/src/shared/request-context.js';

/**
 * The property company isolation is built on: two requests in flight at once
 * never see each other's actor — through `await`, `Promise.all` and a JSON body
 * that arrives after the request head, when the body events come from the HTTP
 * parser rather than from our own code. The official request-context plugin warns
 * that a context can be lost on that path; on Node 22.19 and Fastify 5.10 it is
 * not, and this pins that, so an upgrade or a new upload plugin that changes it
 * fails here instead of leaking an actor between requests.
 *
 * It does not, by itself, tie the hook to `preValidation`: a context opened in
 * `onRequest` passes too (see the note in `plugins/request-context.ts`).
 */
const sleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

/**
 * A POST whose head goes out at once and whose body follows later, so the body events
 * reach the server after the request handling has started. `fetch` and `app.inject`
 * hand the server the head and the body together, which is the easy case.
 */
function postJsonWithLateBody(
  port: number,
  headers: Record<string, string>,
  payload: unknown,
  bodyDelayMilliseconds: number,
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        host: '127.0.0.1',
        port,
        path: '/echo',
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () =>
          resolve({
            status: response.statusCode ?? 0,
            body: JSON.parse(Buffer.concat(chunks).toString()),
          }),
        );
      },
    );

    request.on('error', reject);
    request.flushHeaders();
    setTimeout(() => request.end(JSON.stringify(payload)), bodyDelayMilliseconds);
  });
}

interface EchoBody {
  accountId: number;
}

interface EchoResult {
  afterAwait: Actor | undefined;
  insidePromiseAll: Actor | undefined;
}

/**
 * The real hook, plus a stand-in for `requireAuth`: the identity comes from a
 * header instead of a token and a database lookup — the part under test is the
 * context, not the authentication.
 */
function buildApp() {
  const app = Fastify();

  registerRequestContext(app);

  app.addHook('preHandler', async (request) => {
    const accountId = Number(request.headers['x-account-id']);
    setActor({ accountId, personId: `person-${accountId}`, role: 'USER' });
  });

  app.post<{ Body: EchoBody }>('/echo', async (request): Promise<EchoResult> => {
    // A different wait for every request, so they overlap and finish out of order.
    await sleep((request.body.accountId * 7) % 13);
    const afterAwait = getActor();

    const [insidePromiseAll] = await Promise.all([
      (async () => {
        await sleep((request.body.accountId * 3) % 11);
        return getActor();
      })(),
      sleep(1),
    ]);

    return { afterAwait, insidePromiseAll };
  });

  return app;
}

describe('request context', () => {
  // Over a real socket, with the body arriving after the head — the path a real server sees
  // for anything but a tiny request, and the one `app.inject` cannot reproduce.
  it('keeps concurrent requests apart, when the JSON body arrives after the head', async () => {
    const app = buildApp();
    await app.listen({ port: 0, host: '127.0.0.1' });
    const { port } = app.server.address() as { port: number };
    const accountIds = Array.from({ length: 60 }, (_, index) => index + 1);

    try {
      const responses = await Promise.all(
        accountIds.map((accountId) =>
          postJsonWithLateBody(
            port,
            { 'x-account-id': String(accountId) },
            { accountId },
            10 + ((accountId * 5) % 25),
          ),
        ),
      );

      responses.forEach(({ status, body }, index) => {
        const accountId = accountIds[index];
        const expected: Actor = {
          accountId: accountId!,
          personId: `person-${accountId}`,
          role: 'USER',
        };
        const result = body as EchoResult;

        expect(status).toBe(200);
        expect(result.afterAwait).toEqual(expected);
        expect(result.insidePromiseAll).toEqual(expected);
      });
    } finally {
      await app.close();
    }
  });

  it('gives a route that never authenticates a context without an actor', async () => {
    const app = Fastify();

    registerRequestContext(app);
    app.get('/public', async () => ({ actor: getActor() ?? null }));

    const response = await app.inject({ method: 'GET', url: '/public' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ actor: null });

    await app.close();
  });

  it('has no ambient actor outside a request, and refuses to invent one', () => {
    expect(getActor()).toBeUndefined();
    expect(() => requireActor()).toThrow('No actor in the request context');
    expect(() => setActor({ accountId: 1, personId: 'person-1', role: 'ADMIN' })).toThrow(
      'No request context',
    );
  });

  it('lets a seed or a job establish a context explicitly, and keeps it from leaking', () => {
    const actor: Actor = { accountId: 7, personId: 'person-7', role: 'SYSTEM' };

    const inside = runWithRequestContext({}, () => {
      setActor(actor);
      return requireActor();
    });

    expect(inside).toEqual(actor);
    expect(getActor()).toBeUndefined();
  });

  it('isolates nested contexts from each other', () => {
    const outer: Actor = { accountId: 1, personId: 'person-1', role: 'ADMIN' };
    const inner: Actor = { accountId: 2, personId: 'person-2', role: 'USER' };

    runWithRequestContext({ actor: outer }, () => {
      runWithRequestContext({ actor: inner }, () => {
        expect(getActor()).toEqual(inner);
      });

      expect(getActor()).toEqual(outer);
    });
  });
});
