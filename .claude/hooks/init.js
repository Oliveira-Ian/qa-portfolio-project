/**
 * SessionStart hook — injects a short summary of the repository's git state at
 * the start of a session: branch, sync with the tracking ref, last commit,
 * working tree, and a warning when the branch departs from the standard in
 * `docs/process/development-workflow.md` (ADR 0009).
 *
 * Read-only and offline: no fetch, no writes. Any git failure degrades into a
 * shorter summary or silence — a session never fails because of this hook.
 */

import { execFileSync } from 'node:child_process';
import { basename } from 'node:path';

/** Branches that integrate work rather than hold it. */
const LONG_LIVED_BRANCHES = ['main', 'develop'];

/** `<type>/<issue-number>-<slug>`, with the Conventional Commit types in use. */
const BRANCH_NAME_PATTERN = /^(feat|feature|fix|docs|refactor|chore|ci|test|perf|style)\/\d+-.+/;

/** Keeps a large working tree from flooding the session context. */
const MAX_LISTED_FILES = 20;

const cwd = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

/** Runs a git command, returning its trimmed output or null if it fails. */
function git(...args) {
  try {
    // stderr is discarded: an expected failure (no upstream, no commits) must
    // not print a `fatal:` line next to the summary.
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

const root = git('rev-parse', '--show-toplevel');

// Not a git repository: say nothing.
if (!root) process.exit(0);

const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
const isDetached = branch === 'HEAD';
const upstream = git('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}');
const lastCommit = git('log', '-1', '--pretty=format:%h %s');
const status = git('status', '--short');

/** Compares against the local tracking ref, which a `git fetch` would refresh. */
function describeSync() {
  if (!upstream) return 'No upstream';

  const counts = git('rev-list', '--left-right', '--count', `HEAD...${upstream}`);
  if (!counts) return `Unknown (could not compare with ${upstream})`;

  const [ahead, behind] = counts.split(/\s+/).map(Number);
  if (ahead && behind) return `Diverged (${ahead} ahead, ${behind} behind ${upstream})`;
  if (ahead) return `Ahead ${ahead} of ${upstream}`;
  if (behind) return `Behind ${behind} of ${upstream}`;
  return `In sync with ${upstream}`;
}

function describeWorkingTree() {
  if (!status) return 'Clean';

  const files = status.split('\n');
  const listed = files.slice(0, MAX_LISTED_FILES).map((file) => `  ${file}`);
  if (files.length > MAX_LISTED_FILES) {
    listed.push(`  … and ${files.length - MAX_LISTED_FILES} more`);
  }
  return `${files.length} file(s) changed\n${listed.join('\n')}`;
}

function collectWarnings() {
  const warnings = [];

  if (isDetached) {
    warnings.push('Detached HEAD — commits here belong to no branch.');
  } else if (LONG_LIVED_BRANCHES.includes(branch)) {
    warnings.push(`Working on '${branch}' — work belongs on its own branch created from develop.`);
  } else if (!BRANCH_NAME_PATTERN.test(branch)) {
    warnings.push(`Branch '${branch}' does not follow <type>/<issue-number>-<slug>.`);
  }

  if (!upstream && !isDetached) {
    warnings.push(`Branch '${branch}' has no upstream — nothing to compare against.`);
  }

  return warnings;
}

const lines = [
  `📂 Repository: ${basename(root)}`,
  `🌿 Current branch: ${isDetached ? 'detached HEAD' : branch}`,
  `🔄 Git sync: ${describeSync()}`,
  `📝 Last commit: ${lastCommit ?? 'none yet'}`,
  `📄 Working tree: ${describeWorkingTree()}`,
];

const warnings = collectWarnings();
if (warnings.length > 0) {
  lines.push(`⚠️ Warnings:\n${warnings.map((warning) => `  - ${warning}`).join('\n')}`);
}

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: lines.join('\n'),
    },
  }),
);
