/**
 * @file lint.ts
 * @description Package manager agnostic wrapper for eslint.
 */

import { spawn } from 'node:child_process';

/**
 * Runs eslint with the provided arguments.
 */
const args = [
  'eslint',
  '--no-warn-ignored',
  '--fix',
  '.',
  ...process.argv.slice(2),
];

console.log(`🔍 Running: npx ${args.join(' ')}`);

const child = spawn('npx', args, {
  stdio: 'inherit',
  shell: false,
});

child.on('close', (code: number | null) => {
  if (code !== 0) {
    /* eslint-disable-next-line unicorn/no-process-exit */
    process.exit(code || 1);
  }
});
