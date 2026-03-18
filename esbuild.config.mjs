import fs from 'node:fs';
import { builtinModules } from 'node:module';

import * as esbuild from 'esbuild';

/**
 * esbuild configuration for a modern Node.js 24 ESM project.
 * Handles ESM shims and external module resolution.
 */
const outdir = 'dist';

// Clean output directory
if (fs.existsSync(outdir)) {
  fs.rmSync(outdir, { recursive: true });
}

await esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  outdir,
  splitting: true,
  chunkNames: 'vendor/[name]-[hash]',
  // Automatically exclude built-in Node modules and native/problematic dependencies
  external: [
    ...builtinModules,
    'node:*',
    'bcryptjs',
    '@prisma/client',
    '.prisma/client',
    'express',
    'pino',
    '@resvg/resvg-js',
    'satori',
    'react',
  ],
  // Inject shims for CommonJS variables in ESM
  banner: {
    js: `
import { createRequire as _createRequire } from 'node:module';
import { fileURLToPath as _fileURLToPath } from 'node:url';
import { dirname as _dirname } from 'node:path';

const require = _createRequire(import.meta.url);
const __filename = _fileURLToPath(import.meta.url);
const __dirname = _dirname(__filename);
`.trim(),
  },
  // Useful for production debugging without source code access
  sourcemap: true,
  // Ensure tree shaking is active
  treeShaking: true,
});

// Copy assets to the output directory
const assetsSrc = 'src/assets';
const assetsDist = 'dist/assets';
if (fs.existsSync(assetsSrc)) {
  fs.cpSync(assetsSrc, assetsDist, { recursive: true });
  console.log('Assets copied to dist/assets');
}
