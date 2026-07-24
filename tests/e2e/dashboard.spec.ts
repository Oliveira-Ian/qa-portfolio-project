import { expect, test } from '@playwright/test';

// No auth guard exists yet (matches the legacy dashboard pages), so these
// tests hit the dashboard routes directly instead of going through login.

test('sidebar navigation highlights the active route', async ({ page }) => {
  await page.goto('/home');
  await expect(page.getByTestId('dashboard-header')).toBeVisible();
  await expect(page.getByTestId('dashboard-sidebar')).toBeVisible();

  await page.getByTestId('dashboard-nav-people').click();
  await page.waitForURL('**/people');
  await expect(page.getByTestId('dashboard-nav-people')).toHaveClass(/bg-primary/);
  await expect(page.getByTestId('dashboard-nav-users')).not.toHaveClass(/bg-primary/);

  await page.getByTestId('dashboard-nav-users').click();
  await page.waitForURL('**/users');
  await expect(page.getByTestId('dashboard-nav-users')).toHaveClass(/bg-primary/);
});

test('sidebar toggle collapses and expands the sidebar', async ({ page }) => {
  await page.goto('/home');
  const sidebar = page.getByTestId('dashboard-sidebar');

  const openBox = await sidebar.boundingBox();
  expect(openBox?.x).toBe(0);

  await page.getByTestId('dashboard-sidebar-toggle').click();
  await expect(async () => {
    const collapsedBox = await sidebar.boundingBox();
    expect(collapsedBox?.x).toBeLessThan(0);
  }).toPass();

  await page.getByTestId('dashboard-sidebar-toggle').click();
  await expect(async () => {
    const reopenedBox = await sidebar.boundingBox();
    expect(reopenedBox?.x).toBe(0);
  }).toPass();
});

test('user dropdown: About stays, SignOut redirects to login', async ({ page }) => {
  await page.goto('/home');

  await page.getByTestId('header-user-avatar').click();
  await expect(page.getByTestId('header-dropdown-about')).toBeVisible();
  await expect(page.getByTestId('header-dropdown-signout')).toBeVisible();

  await page.getByTestId('header-dropdown-about').click();
  await expect(page.getByTestId('header-dropdown-about')).toBeHidden();
  await expect(page).toHaveURL(/\/home$/);

  await page.getByTestId('header-user-avatar').click();
  await page.getByTestId('header-dropdown-signout').click();
  await page.waitForURL('**/login');
});
