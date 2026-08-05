/**
 * PreToolUse hook — stops the handful of mistakes that are expensive in this
 * repository, and stays out of the way for everything else.
 *
 * Three outcomes:
 *   deny  — irreversible and never legitimate here (wiping the repo, force
 *           pushing an integration branch).
 *   ask   — legitimate sometimes, too costly to happen by accident (dropping
 *           the dev database, discarding uncommitted work, editing a secret).
 *   defer — silence. Everything that matches no rule falls through to the
 *           normal permission flow.
 *
 * The design constraint is near-zero false positives: a hook that interrupts
 * routine work trains the habit of approving without reading, and then it is
 * no longer protecting anything.
 *
 * Fail-open, like `init.js`: any internal error exits 0 and decides nothing.
 * A bug in here must never be able to wedge a session.
 */

import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { basename, parse, relative, resolve } from 'node:path';

/** Runs a git command from `cwd`, returning trimmed output or null. */
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

/**
 * Claude Code always sets CLAUDE_PROJECT_DIR, but falling straight back to
 * `cwd` is fragile: invoked from anywhere else, every project-relative path
 * resolves outside the repository and the file rules silently stop matching.
 * The git toplevel is the honest fallback.
 */
const PROJECT_DIR = resolve(
  process.env.CLAUDE_PROJECT_DIR ?? git(['rev-parse', '--show-toplevel']) ?? process.cwd(),
);

/** Integration branches — ADR 0009. Releases are tagged from them. */
const PROTECTED_BRANCHES = ['main', 'develop'];

/** Directories whose recursive deletion is routine and cheap to redo. */
const DISPOSABLE = ['node_modules', '.next', 'dist', 'build', 'test-results', 'playwright-report'];

/**
 * Destructive commands. Scanned against the whole command string, so `&&`,
 * `;`, pipes and `$(...)` are covered without parsing the shell.
 */
const COMMAND_RULES = [
  {
    pattern: /\bgit\s+reset\b[^;&|]*--hard\b/,
    reason: 'git reset --hard discards every uncommitted change in the working tree.',
  },
  {
    pattern: /\bgit\s+clean\b[^;&|]*\s-[a-zA-Z]*f/,
    reason: 'git clean -f deletes untracked files permanently — git cannot recover them.',
  },
  {
    pattern: /\bgit\s+(?:checkout\s+--|restore)\s+\.(?:\s|$)/,
    reason: 'This discards uncommitted changes across the whole working tree.',
  },
  {
    pattern: /\bgit\s+branch\s+(?:-D|--delete\s+--force)/,
    reason: 'git branch -D deletes the branch even if it was never merged.',
  },
  {
    pattern: /\bgit\s+push\b[^;&|]*\s--delete\b/,
    reason: 'This deletes the branch on the remote.',
  },
  {
    pattern: /\bgit\s+commit\b[^;&|]*--no-verify\b/,
    reason:
      'git commit --no-verify skips pre-commit validation. (No commit hooks are installed in this repository yet, so this currently skips nothing.)',
  },
  {
    pattern: /\bprisma\s+migrate\s+reset\b/,
    reason: 'prisma migrate reset drops the development database and everything seeded into it.',
  },
  {
    pattern: /\bprisma\s+db\s+push\b[^;&|]*--force-reset\b/,
    reason: '--force-reset drops the development database before pushing the schema.',
  },
  {
    pattern: /\bdocker[\s-]compose\b[^;&|]*\bdown\b[^;&|]*(?:\s-v\b|--volumes\b)/,
    reason:
      'down -v removes the postgres-data volume — the development database and its seed are gone with it.',
  },
  {
    pattern: /\bdocker\s+volume\s+rm\b/,
    reason: 'Removing a docker volume destroys the data inside it, including postgres-data.',
  },
  {
    pattern: /\bdocker\s+(?:system|volume)\s+prune\b/,
    reason: 'docker prune can remove the postgres-data volume along with unused resources.',
  },
];

/**
 * Files worth a confirmation: secrets, CI, the container definition, the
 * dependency contract, Claude's own configuration, and applied migrations.
 * Paths are repository-relative and posix-separated.
 *
 * Everything else is deliberately absent — app code, `docs/**`,
 * `prisma/schema.prisma`, `.claude/rules/**`, workspace manifests and the
 * lint/format/test configs are edited routinely, and breakage in them surfaces
 * immediately in the editor or CI.
 */
const FILE_RULES = [
  {
    pattern: /(?:^|\/)\.env(?:\.|$)/,
    unless: /\.example$/,
    reason: 'This file holds real credentials and is deliberately kept out of git.',
  },
  {
    pattern: /^\.github\/workflows\//,
    reason: 'This is the CI pipeline that gates every pull request.',
  },
  {
    pattern: /^docker-compose[^/]*\.ya?ml$/,
    reason: 'This defines the database and service containers for the whole project.',
  },
  {
    pattern: /^package(?:-lock)?\.json$/,
    reason:
      'This is the dependency contract for the monorepo. Prefer npm commands over editing it by hand.',
  },
  {
    pattern: /^\.claude\/(?:settings[^/]*\.json$|hooks\/)/,
    reason: "This changes Claude Code's own behavior in this project.",
  },
  {
    pattern: /^prisma\/migrations\/.+\/migration\.sql$/,
    reason:
      'Prisma checksums applied migrations — editing one that already ran corrupts migration state. If it has run, create a new migration instead.',
  },
];

/** Emits a decision and stops. Omitting this entirely means "defer". */
function decide(permissionDecision, permissionDecisionReason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision,
        permissionDecisionReason,
      },
    }),
  );
  process.exit(0);
}

function unquote(token) {
  return token.replace(/^['"]|['"]$/g, '');
}

/**
 * Collects the targets of recursive deletes, across both shells: `rm -rf` in
 * bash and `Remove-Item -Recurse` in PowerShell. Matching the tool name alone
 * is not enough — this session exposes both Bash and PowerShell, and they pass
 * the command in the same field.
 */
function recursiveDeleteTargets(command) {
  const targets = [];

  for (const segment of command.split(/[;&|\n]+/)) {
    const match = segment.match(/(?:^|\s)(?:rm|Remove-Item|ri)\s+(.*)$/i);
    if (!match) continue;

    const args = match[1];
    // Short flag clusters are restricted to the letters `rm` accepts, so that
    // PowerShell's `-Force` is not misread as recursive because it contains r.
    const isRecursive =
      /(?:^|\s)-[rRfivd]*[rR][rRfivd]*(?:\s|$)/.test(args) ||
      /--recursive\b|-Recurse\b/i.test(args);
    if (!isRecursive) continue;

    for (const token of args.split(/\s+/)) {
      if (token.startsWith('-') || token === '') continue;
      targets.push(unquote(token));
    }
  }

  return targets;
}

/** Windows paths are case-insensitive, so `C:\repo` and `c:\repo` are one path. */
function sameFile(a, b) {
  return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;
}

/** `catastrophic` for the paths with no way back, `disposable` for the rest. */
function classifyTarget(target) {
  const cleaned = target.replace(/\\/g, '/').replace(/\/?\*+$/, '') || '.';
  const expanded = cleaned.replace(/^~/, homedir().replace(/\\/g, '/'));
  const absolute = resolve(PROJECT_DIR, expanded);

  if (
    sameFile(absolute, PROJECT_DIR) ||
    sameFile(absolute, resolve(homedir())) ||
    sameFile(absolute, parse(absolute).root) ||
    basename(absolute) === '.git'
  ) {
    return 'catastrophic';
  }

  const withinProject = relative(PROJECT_DIR, absolute).replace(/\\/g, '/');
  const segments = withinProject.split('/');
  if (segments.some((segment) => DISPOSABLE.includes(segment))) return 'disposable';

  return 'other';
}

function inspectCommand(command) {
  for (const target of recursiveDeleteTargets(command)) {
    const kind = classifyTarget(target);
    if (kind === 'catastrophic') {
      decide(
        'deny',
        `Recursively deleting '${target}' would destroy the repository or your home directory.`,
      );
    }
    if (kind === 'other') {
      decide('ask', `This recursively deletes '${target}', which is not a rebuildable directory.`);
    }
  }

  if (/\bgit\s+push\b/.test(command)) {
    const forced = /--force\b|--force-with-lease\b|(?:^|\s)-f(?:\s|$)/.test(command);
    if (forced) {
      const explicit = PROTECTED_BRANCHES.find((branch) =>
        new RegExp(`(?:^|[\\s:/])${branch}(?:\\s|$)`).test(command),
      );
      const target = explicit ?? git(['rev-parse', '--abbrev-ref', 'HEAD'], PROJECT_DIR);

      if (PROTECTED_BRANCHES.includes(target)) {
        decide(
          'deny',
          `Force pushing rewrites history on '${target}', an integration branch (ADR 0009). Open a pull request instead.`,
        );
      }
      // --force-with-lease exists precisely to make this safe on a work
      // branch, so only the unguarded form is worth a prompt. The negative
      // lookahead matters: `--force\b` also matches `--force-with-lease`.
      if (/--force(?![-\w])|(?:^|\s)-f(?:\s|$)/.test(command)) {
        decide('ask', `Force pushing rewrites the remote history of '${target ?? 'this branch'}'.`);
      }
    }
  }

  for (const rule of COMMAND_RULES) {
    if (rule.pattern.test(command)) decide('ask', rule.reason);
  }

  const isFullPlaywrightRun =
    /\bnpm\s+run\s+test:e2e\b/.test(command) ||
    (/\bplaywright\s+test\b/.test(command) &&
      !/(?:--grep\b|\s-g\s|\.spec\.|\.test\.)/.test(command));

  if (isFullPlaywrightRun) {
    decide(
      'ask',
      'This runs the whole Playwright suite (test:e2e is headed and single-worker — the slowest thing in the repo). A single file or --grep is usually enough.',
    );
  }
}

function inspectFile(filePath) {
  const withinProject = relative(PROJECT_DIR, resolve(filePath)).replace(/\\/g, '/');

  // Outside the project, or above it: not ours to judge.
  if (withinProject.startsWith('..')) return;

  for (const rule of FILE_RULES) {
    if (!rule.pattern.test(withinProject)) continue;
    if (rule.unless?.test(withinProject)) continue;
    decide('ask', rule.reason);
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

  if (typeof input.command === 'string') inspectCommand(input.command);
  if (typeof input.file_path === 'string') inspectFile(input.file_path);
}

// Deciding nothing is always the safe failure: exit 0 with no output defers to
// the normal permission flow.
main().catch(() => process.exit(0));
