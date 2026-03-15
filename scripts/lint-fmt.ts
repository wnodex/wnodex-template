/**
 * @file lint-fmt.ts
 * @description Orchestrates both linting and formatting in a single command.
 */

import { spawn } from 'node:child_process';

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
  console.log('🧐 Starting linting and formatting sequence...');

  // Using npx for independence or we could call our scripts via tsx
  await runCommand('npx', ['tsx', './scripts/lint.ts']);
  await runCommand('npx', ['tsx', './scripts/fmt.ts']);

  console.log('✅ Linting and formatting completed successfully!');
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`💥 Sequence failed: ${message}`);
  /* eslint-disable-next-line unicorn/no-process-exit */
  process.exit(1);
}
