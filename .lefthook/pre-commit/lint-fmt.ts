/**
 * @file lint-fmt.ts
 * @description Git pre-commit hook script (Lefthook Script mode).
 * Orchestrates both linting and formatting sequentially.
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

const runner =
  pkgManager === 'npm'
    ? 'npx'
    : pkgManager === 'pnpm'
      ? 'pnpm'
      : pkgManager === 'bun'
        ? 'bun'
        : 'yarn';
const runnerArgs =
  pkgManager === 'pnpm'
    ? ['exec', 'tsx']
    : pkgManager === 'bun'
      ? ['x', 'tsx']
      : pkgManager === 'yarn'
        ? ['run', 'tsx']
        : ['tsx'];

/**
 * Runs a command as a promise.
 */
function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Running: ${command} ${args.join(' ')}`);
    const child = spawn(command, args, { stdio: 'inherit', shell: false });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });
    child.on('error', reject);
  });
}

/**
 * Main execution sequence.
 */
try {
  console.log(
    `🧐 Starting pre-commit linting and formatting sequence with ${pkgManager}...`
  );

  await runCommand(runner, [...runnerArgs, './scripts/lint.ts']);
  await runCommand(runner, [...runnerArgs, './scripts/fmt.ts']);

  console.log('✅ Pre-commit sequence completed successfully!');
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`💥 Pre-commit sequence failed: ${message}`);
  /* eslint-disable-next-line unicorn/no-process-exit */
  process.exit(1);
}
