/**
 * @file fmt.ts
 * @description Package manager agnostic wrapper for prettier.
 */

import { spawn } from 'node:child_process';

/**
 * Runs prettier with the provided arguments.
 */
const args = [
  'prettier',
  '--ignore-unknown',
  '--write',
  '.',
  ...process.argv.slice(2),
];

console.log(`🎨 Running: npx ${args.join(' ')}`);

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
