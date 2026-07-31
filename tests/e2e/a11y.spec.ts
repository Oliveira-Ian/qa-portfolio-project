import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// `home`/`people list`/`people form (new)` are disabled — those routes now
// require a session (`proxy.ts` redirects an anonymous visit to `/login`),
// so without a logged-in `page` these three silently audit `/login` instead
// of the page they claim to. That made the suite pass while covering nothing
// past the login screen — a false positive, not a real gate. `login`/
// `register` are public and still audited for real. Left in place rather
// than rewritten: a login fixture (so these run authenticated) is part of
// the deliberate later testing-strategy phase — see docs/qa/testing-status.md.
const pages = [
  { name: 'login', path: '/login', fixme: false },
  { name: 'register', path: '/register', fixme: false },
  { name: 'home', path: '/home', fixme: true },
  { name: 'people list', path: '/people', fixme: true },
  { name: 'people form (new)', path: '/people/new', fixme: true },
];

for (const { name, path, fixme } of pages) {
  const runTest = fixme ? test.fixme : test;

  runTest(`${name} has no automatically detectable accessibility violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}
