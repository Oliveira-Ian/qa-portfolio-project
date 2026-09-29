/**
 * PostToolUse hook — notes the one thing worth knowing after an edit to a
 * config, infra, workflow, or migration-adjacent file, when nothing else in
 * the project already says it.
 *
 * PostToolUse cannot block or undo anything (the tool already ran), so the
 * only thing worth doing here is `additionalContext`: a quiet note for the
 * next turn, not a systemMessage banner. Claude decides whether it's worth
 * surfacing to the user — that's what keeps this low-noise.
 *
 * Deliberately narrow: docs, rules, skills, and app code are excluded, and so
 * is anything already covered elsewhere — ESLint/Prettier/tsc, CI
 * (.github/workflows/ci.yml), the PreToolUse confirmations in guard.js, or
 * `npm run dev:doctor`, which is already a followed rule, not a gap.
 *
 * Fail-open, like `guard.js` and `init.js`: any internal error exits 0 and
 * says nothing. A bug in here must never be able to wedge a session.
 */

import { execFileSync } from 'node:child_process';
import { relative, resolve } from 'node:path';

/** Runs a git command, returning trimmed output or null. */
function git(args, cwd) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

/** Same fallback chain as guard.js: CLAUDE_PROJECT_DIR, then git toplevel, then cwd. */
const PROJECT_DIR = resolve(
  process.env.CLAUDE_PROJECT_DIR ?? git(['rev-parse', '--show-toplevel']) ?? process.cwd(),
);

/**
 * Only a path check for most rules — a match on the file is reason enough.
 * `package.json` additionally requires `content` to look at what changed,
 * since it's edited far more often for scripts than for dependencies.
 */
const FILE_RULES = [
  {
    pattern: /^apps\/web\/next\.config\.\w+$/,
    note: "Next's dev server doesn't hot-reload next.config.* — restart apps/web (npm run dev:web) for this to take effect.",
  },
  {
    pattern: /(?:^|\/)\.env(?:\.|$)/,
    unless: /\.example$/,
    note: 'Env vars are read once at process startup — restart the affected dev server(s) to pick this up.',
  },
  {
    pattern: /^docker-compose[^/]*\.ya?ml$|(?:^|\/)Dockerfile[^/]*$/,
    note: "This redefines a container — an already-running one won't pick it up on its own; rebuild with npm run docker:up (or docker compose build).",
  },
  {
    pattern: /^\.github\/workflows\//,
    note: 'GitHub Actions workflows have no local validation — a mistake here only surfaces once CI runs on a pull request.',
  },
  {
    pattern: /^prisma\/schema\.prisma$/,
    note: 'Schema changed — run npm run db:migrate to create a migration, or npm run db:generate to just refresh the Prisma Client types.',
  },
  {
    pattern: /(?:^|\/)package(?:-lock)?\.json$/,
    note: 'This looks like a dependency change, not just a script — run npm install to sync the lockfile/node_modules.',
    contentMustMatch: /dependencies|devDependencies|peerDependencies|"[~^]?\d+\.\d+\.\d+"/,
  },
];

/** Emits the note for the next turn and stops. No output at all means "say nothing". */
function note(text) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: text,
      },
    }),
  );
  process.exit(0);
}

/** Text the file rules can inspect: the new content, however the tool reported it. */
function changedText(toolInput) {
  return [toolInput.content, toolInput.new_string, toolInput.old_string].filter(Boolean).join('\n');
}

function inspectFile(filePath, toolInput) {
  const withinProject = relative(PROJECT_DIR, resolve(filePath)).replace(/\\/g, '/');
  if (withinProject.startsWith('..')) return;

  for (const rule of FILE_RULES) {
    if (!rule.pattern.test(withinProject)) continue;
    if (rule.unless?.test(withinProject)) continue;
    if (rule.contentMustMatch && !rule.contentMustMatch.test(changedText(toolInput))) continue;
    note(rule.note);
  }
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  const payload = JSON.parse(await readStdin());
  const input = payload.tool_input ?? {};

  if (typeof input.file_path === 'string') inspectFile(input.file_path, input);
}

main().catch(() => process.exit(0));
