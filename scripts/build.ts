/**
 * @file build.ts
 * @description Unified build script for the server application.
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import * as esbuild from 'esbuild';

import {
  type GenerateConfig,
  generatePackageJson,
} from './generate-package-json.js';
import { sync, type SyncConfig } from './sync.js';

/**
 * Loads configuration from package.json.
 */
function getPackageConfig(): {
  syncConfig?: SyncConfig;
  generateConfig?: GenerateConfig;
} {
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  if (!existsSync(pkgPath)) return {};

  try {
    const content = readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(content);
    return {
      syncConfig: pkg.syncConfig,
      generateConfig: pkg.generateConfig,
    };
  } catch {
    return {};
  }
}

/**
 * Main build process.
 */
async function main() {
  const { syncConfig, generateConfig } = getPackageConfig();

  // 1. Sync client assets
  if (syncConfig) {
    console.log('🔄 Starting sync...');
    await sync(syncConfig);
  } else {
    console.warn('⚠️ No syncConfig found in package.json, skipping sync.');
  }

  // 2. Build with esbuild
  console.log('🏗️ Starting esbuild...');
  /** @type {esbuild.BuildOptions} */
  const esbuildConfig: esbuild.BuildOptions = {
    entryPoints: ['src/main.ts'],
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'esm',
    outfile: 'dist/main.js',
    sourcemap: true,
    minify: false,
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
          const filter = /^[^./]|^\.[^./]|^\.\.[^/]/;
          build.onResolve({ filter }, (args) => ({
            path: args.path,
            external: true,
          }));
        },
      },
    ],
    banner: {
      js: `
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
      `,
    },
  };

  try {
    await esbuild.build(esbuildConfig);
    console.log('✅ Esbuild complete.');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Esbuild failed:', message);
    /* eslint-disable-next-line unicorn/no-process-exit */
    process.exit(1);
  }

  // 3. Generate production package.json
  if (generateConfig) {
    console.log('📦 Generating production package.json...');
    await generatePackageJson(generateConfig);
  } else {
    console.warn(
      '⚠️ No generateConfig found in package.json, skipping generation.'
    );
  }

  console.log('✨ Build finished successfully!');
}

try {
  await main();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('💥 Unexpected build error:', message);
  /* eslint-disable-next-line unicorn/no-process-exit */
  process.exit(1);
}
