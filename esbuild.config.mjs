/* cspell:ignore resvg */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWatch = process.argv.includes('--watch');

/** @type {esbuild.BuildOptions} */
const config = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outfile: 'dist/main.js',
  sourcemap: true,
  minify: false, // Minification usually not needed for Node.js backends
  external: [
    'express',
    'wnodex',
    'pino',
    'pino-pretty',
    'sync-directory',
    '@wnodex/react-router',
    'zod',
    'passport',
    'helmet',
    'cors',
    'compression',
    'cookie-parser',
    'express-session',
    'express-rate-limit',
    'hpp',
    'pino-http',
    'resvg',
    '@resvg/resvg-js',
  ],
  loader: {
    '.ts': 'ts',
  },
  plugins: [
    {
      name: 'make-all-packages-external',
      setup(build) {
        // This ensures that anything in node_modules is not bundled
        const filter = /^[^./]|^\.[^./]|^\.\.[^/]/; // Match anything that doesn't start with ./ or ../
        build.onResolve({ filter }, (args) => ({
          path: args.path,
          external: true,
        }));
      },
    },
  ],
  banner: {
    // Useful for production debugging without source code access
    js: `
      import { createRequire } from 'module';
      const require = createRequire(import.meta.url);
    `,
  },
};

if (isWatch) {
  const ctx = await esbuild.context(config);
  await ctx.watch();
  console.log('👀 Watching for changes...');
} else {
  await esbuild.build(config);
  console.log('✅ Build complete');
}
