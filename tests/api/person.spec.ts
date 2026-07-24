import { expect, test } from '@playwright/test';

test.describe('POST /api/persons validation', () => {
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

test.describe('Person CRUD', () => {
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
