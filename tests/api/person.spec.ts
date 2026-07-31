import { expect, test } from '@playwright/test';

// Disabled — written against the pre-auth API (no Authorization header,
// singular `type` instead of `types`). Every request here now gets 401 from
// `requireAuth`, and the payload shape itself is stale. Left in place rather
// than rewritten or removed: the full API/E2E test strategy (auth fixtures,
// current payloads) is a deliberate later phase — see docs/qa/testing-status.md.
test.describe.fixme('POST /api/persons validation', () => {
  test('rejects creation with a missing name', async ({ request }) => {
    const response = await request.post('/api/persons', {
      data: { type: 'CLIENT', documentType: 'CPF', document: '12345678901' },
    });

    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: 'Name is required',
    });
  });

  test('rejects an invalid CPF length', async ({ request }) => {
    const response = await request.post('/api/persons', {
      data: { name: 'QA Client', type: 'CLIENT', documentType: 'CPF', document: '123' },
    });

    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: 'Invalid document format',
    });
  });
});

// Same reason as above — see docs/qa/testing-status.md.
test.describe.fixme('Person CRUD', () => {
  test('creates, lists, updates and deletes a person', async ({ request }) => {
    const document = String(Date.now()).slice(-11).padStart(11, '0');

    const created = await request.post('/api/persons', {
      data: { name: 'QA Client', type: 'CLIENT', documentType: 'CPF', document },
    });
    expect(created.status()).toBe(201);

    const list = await request.get('/api/persons', { params: { search: 'QA Client' } });
    expect(list.status()).toBe(200);
    const listBody = (await list.json()) as { data: Array<{ id: string; document: string }> };
    const found = listBody.data.find((person) => person.document === document);
    expect(found).toBeTruthy();

    const updated = await request.put(`/api/persons/${found!.id}`, {
      data: { name: 'QA Client Updated', type: 'CLIENT', documentType: 'CPF', document },
    });
    expect(updated.status()).toBe(200);

    const deleted = await request.delete(`/api/persons/${found!.id}`);
    expect(deleted.status()).toBe(200);
  });
});
