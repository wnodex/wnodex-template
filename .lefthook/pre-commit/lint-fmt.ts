/**
 * @file lint-fmt.ts
 * @description Git pre-commit hook script (Lefthook Script mode).
 */

import { spawn } from 'node:child_process';

// Try to detect package manager from environment or use pnpm as fallback
const pkgManager = process.env.npm_config_user_agent?.includes('npm')
  ? 'npm'
  : process.env.npm_config_user_agent?.includes('bun')
    ? 'bun'
    : process.env.npm_config_user_agent?.includes('yarn')
      ? 'yarn'
      : 'pnpm';

const runCommand = pkgManager === 'npm' ? 'npm' : pkgManager;
const runArgs = pkgManager === 'npm' ? ['run', 'lint:fmt'] : ['lint:fmt'];

console.log(`🥊 Running pre-commit: ${pkgManager} lint:fmt`);

const child = spawn(runCommand, runArgs, {
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
  console.error('💥 Pre-commit hook failed:', err);
  /* eslint-disable-next-line unicorn/no-process-exit */
  process.exit(1);
});
