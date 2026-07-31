import { expect, test } from '@playwright/test';

test('empty login submit shows the documented toast', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('auth-login-button-submit').click();
  await expect(page.getByText('Please fill in email and password')).toBeVisible();
});

test('invalid credentials show the documented toast', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('auth-login-input-email').fill('nobody@example.com');
  await page.getByTestId('auth-login-input-password').fill('wrong-password');
  await page.getByTestId('auth-login-button-submit').click();
  await expect(page.getByText('Invalid email or password')).toBeVisible();
});

test('register, log in and land on the home placeholder', async ({ page }) => {
  const email = `qa-web-e2e-${Date.now()}@example.com`;
  const password = 'secret123';

  await test.step('register a new user', async () => {
    await page.goto('/register');
    await page.getByTestId('auth-register-input-fullname').fill('QA Web E2E User');
    await page.getByTestId('auth-register-input-email').fill(email);
    await page.getByTestId('auth-register-input-password').fill(password);
    await page.getByTestId('auth-register-input-birthdate').fill('1990-01-01');
    await page.getByTestId('auth-register-button-submit').click();
    await expect(page.getByText('Registration successful')).toBeVisible();
    await page.waitForURL('**/login', { timeout: 10_000 });
  });

  await test.step('log in with the new account', async () => {
    await page.getByTestId('auth-login-input-email').fill(email);
    await page.getByTestId('auth-login-input-password').fill(password);
    await page.getByTestId('auth-login-button-submit').click();
    await page.waitForURL('**/home');
    await expect(page.getByTestId('home-page')).toBeVisible();
  });
});
