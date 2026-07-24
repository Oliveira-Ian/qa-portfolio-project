import { expect, test } from '@playwright/test';

test('shows validation errors matching the shared schema', async ({ page }) => {
  await page.goto('/people/new');
  await page.getByTestId('person-form-button-save').click();

  await expect(page.getByTestId('person-form-error-name')).toHaveText('Name is required');
  await expect(page.getByTestId('person-form-error-document')).toHaveText('Document is required');
});

test('rejects an invalid CPF length', async ({ page }) => {
  await page.goto('/people/new');
  await page.getByTestId('person-form-input-name').fill('QA Web Person');
  await page.getByTestId('person-form-input-document').fill('123');
  await page.getByTestId('person-form-button-save').click();

  await expect(page.getByTestId('person-form-error-document')).toHaveText(
    'Invalid document format',
  );
});

test('creates, edits, views and deletes a person', async ({ page }) => {
  const document = String(Date.now()).slice(-11).padStart(11, '0');

  await test.step('create', async () => {
    await page.goto('/people/new');
    await page.getByTestId('person-form-input-name').fill('QA Web Person');
    await page.getByTestId('person-form-input-document').fill(document);
    await page.getByTestId('person-form-button-save').click();
    await page.waitForURL('**/people');
  });

  const row = page.locator('[data-testid="person-list-tbody"] tr', {
    has: page.getByText('QA Web Person'),
  });

  await test.step('select and edit', async () => {
    await expect(row).toBeVisible();
    await row.locator('button[role="checkbox"]').click();
    await expect(page.getByTestId('person-button-edit')).toBeEnabled();

    await page.getByTestId('person-button-edit').click();
    await page.waitForURL('**/people/*/edit');
    await page.getByTestId('person-form-input-name').fill('QA Web Person Edited');
    await page.getByTestId('person-form-button-save').click();
    await page.waitForURL('**/people');
    await expect(
      page.locator('[data-testid="person-list-tbody"] tr', {
        has: page.getByText('QA Web Person Edited'),
      }),
    ).toBeVisible();
  });

  await test.step('view (read-only)', async () => {
    await page
      .locator('[data-testid="person-list-tbody"] tr', {
        has: page.getByText('QA Web Person Edited'),
      })
      .dblclick();
    await page.waitForURL(/\/people\/[^/]+$/);
    await expect(page.getByTestId('person-form-input-name')).toBeDisabled();
    await expect(page.getByTestId('person-form-button-save')).toHaveCount(0);
    await page.goto('/people');
  });

  await test.step('delete', async () => {
    const editedRow = page.locator('[data-testid="person-list-tbody"] tr', {
      has: page.getByText('QA Web Person Edited'),
    });
    await editedRow.locator('button[role="checkbox"]').click();
    await page.getByTestId('person-button-delete').click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
    await expect(editedRow).toHaveCount(0);
  });
});
