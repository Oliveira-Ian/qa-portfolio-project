import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Shared base config. All of tests/ is TypeScript (Vitest/Playwright) and
// linted normally.
export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
);
