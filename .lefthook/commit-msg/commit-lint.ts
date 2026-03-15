/**
 * @file commit-lint.ts
 * @description Git commit-msg hook script (Lefthook Script mode).
 */

import { spawn } from 'node:child_process';

/**
 * Detects the package manager being used.
 */
function getPackageManager() {
  const userAgent = process.env.npm_config_user_agent || '';
  if (userAgent.includes('pnpm')) return 'pnpm';
  if (userAgent.includes('bun')) return 'bun';
  if (userAgent.includes('yarn')) return 'yarn';
  if (userAgent.includes('npm')) return 'npm';
  return 'pnpm';
}

const commitMsgFile = process.argv[2];
if (!commitMsgFile) {
  console.error('❌ No commit message file provided.');
  /* eslint-disable-next-line unicorn/no-process-exit */
  process.exit(1);
}

const pkgManager = getPackageManager();
const execCommand =
  pkgManager === 'npm'
    ? 'npx'
    : pkgManager === 'pnpm'
      ? 'pnpm'
      : pkgManager === 'bun'
        ? 'bunx'
        : 'yarn';
const execArgs =
  pkgManager === 'pnpm'
    ? ['commitlint', '--edit', commitMsgFile]
    : ['commitlint', '--edit', commitMsgFile];

// Special case for npm exec/npx
const finalCommand = pkgManager === 'npm' ? 'npx' : execCommand;

console.log(
  `🥊 Running commit-msg hook: ${finalCommand} commitlint --edit ${commitMsgFile}`
);

const child = spawn(finalCommand, execArgs, {
  stdio: 'inherit',
  shell: false,
});

child.on('close', (code) => {
  if (code !== 0) {
    /* eslint-disable-next-line unicorn/no-process-exit */
    process.exit(code || 1);
  }
});

child.on('error', (err) => {
  console.error('💥 Commit-msg hook failed:', err);
  /* eslint-disable-next-line unicorn/no-process-exit */
  process.exit(1);
});
