import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = [
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'home', path: '/home' },
  { name: 'people list', path: '/people' },
  { name: 'people form (new)', path: '/people/new' },
];

for (const { name, path } of pages) {
  test(`${name} has no automatically detectable accessibility violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}
