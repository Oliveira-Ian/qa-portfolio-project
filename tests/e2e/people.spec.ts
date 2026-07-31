import { expect, test } from '@playwright/test';

// Disabled — written against the pre-auth, pre-navigation-catalog UI: `/people`
// now requires a session (`proxy.ts` redirects to `/login`), the real testids
// are `person-list-button-edit`/`person-list-button-delete` (not
// `person-button-edit`/`person-button-delete`), and the row `dblclick` to open
// a record no longer navigates — `DataTable` only selects on click by design.
// Left in place rather than rewritten or removed: the full E2E test strategy
// (login fixture/storageState, current testids) is a deliberate later phase —
// see docs/qa/testing-status.md.
test.fixme('shows validation errors matching the shared schema', async ({ page }) => {
  await page.goto('/people/new');
  await page.getByTestId('person-form-button-save').click();

  await expect(page.getByTestId('person-form-error-name')).toHaveText('Name is required');
  await expect(page.getByTestId('person-form-error-document')).toHaveText('Document is required');
});

test.fixme('rejects an invalid CPF length', async ({ page }) => {
  await page.goto('/people/new');
  await page.getByTestId('person-form-input-name').fill('QA Web Person');
  await page.getByTestId('person-form-input-document').fill('123');
  await page.getByTestId('person-form-button-save').click();

  await expect(page.getByTestId('person-form-error-document')).toHaveText(
    'Invalid document format',
  );
});

test.fixme('creates, edits, views and deletes a person', async ({ page }) => {
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
