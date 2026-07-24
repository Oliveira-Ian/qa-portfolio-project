import { expect, test } from '@playwright/test';

test.describe('POST /api/auth/login', () => {
  test('empty body returns the documented 400 message', async ({ request }) => {
    const response = await request.post('/api/auth/login', { data: {} });

    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: 'Please fill in email and password',
    });
  });

  test('invalid email format returns 400', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { email: 'not-an-email', password: 'x' },
    });

    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: 'Invalid email format',
    });
  });

  test('unknown credentials return 401', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { email: 'nobody@example.com', password: 'wrong' },
    });

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({
      success: false,
      error: 'Invalid email or password',
    });
  });
});

test.describe('POST /api/auth/register', () => {
  test('missing fields return the documented 400 message', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: { email: 'a@a.com' },
    });

    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: 'Please fill in all required fields',
    });
  });

  test('registering the same email twice is rejected', async ({ request }) => {
    const payload = {
      fullName: 'QA User',
      email: `qa-${Date.now()}@example.com`,
      password: 'secret123',
      birthDate: '1990-01-01',
    };

    const created = await request.post('/api/auth/register', { data: payload });
    expect(created.status()).toBe(201);

    const duplicate = await request.post('/api/auth/register', { data: payload });
    expect(duplicate.status()).toBe(400);
    expect(await duplicate.json()).toEqual({
      success: false,
      error: 'Email already exists',
    });
  });
});
