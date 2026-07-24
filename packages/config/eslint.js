import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Shared base config. Legacy trees (frontend/, backend/) stay out of scope
// until their own migration phase replaces them. All of tests/ is now
// TypeScript (Vitest/Playwright) and linted normally.
export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', 'frontend/**', 'backend/**'],
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
