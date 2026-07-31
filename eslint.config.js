import nextConfig from 'eslint-config-next';
import baseConfig from './packages/config/eslint.js';

// eslint-config-next's rule/plugin entries use generic globs (**/*.tsx, ...);
// scope them to apps/web so React/Next rules don't run against the backend
// or the Node-only packages. Its ignores-only entry stays global on purpose.
const scopedNextConfig = nextConfig.map((entry) =>
  entry.files ? { ...entry, files: entry.files.map((glob) => `apps/web/${glob}`) } : entry,
);

export default [
  // Third-party skill content installed via `npx skills add` — includes its
  // own template/example source files (e.g. .tsx starter templates meant to
  // be copied into a project, not linted as part of this one).
  { ignores: ['.agents/skills/**', '.claude/skills/**'] },
  ...baseConfig,
  ...scopedNextConfig,
];
