/**
 * @file sync.ts
 * @description Type-safe utility to build and sync client assets.
 */

/* cspell:ignore syncdir */

import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import syncdir from 'sync-directory';

import { getPackageManager } from './utils/pkg-manager.js';

/**
 * Configuration for the sync process.
 */
export interface SyncConfig {
  clientDir: string;
  clientDistDir: string;
  destination: string;
  buildCommand?: string;
}

/**
 * Structure of the package.json section.
 */
interface PackageJson {
  syncConfig?: Partial<SyncConfig>;
}

/**
 * Runs a shell command as a promise.
 */
function runCommand(
  command: string,
  args: string[],
  options: import('node:child_process').SpawnOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Running: ${command} ${args.join(' ')}`);

    // Avoid security warning by not passing args array when shell is true.
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: false,
      ...options,
    });

    child.on('close', (code: number | null) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`❌ Command failed with exit code ${code}`));
      }
    });

    child.on('error', (err: Error) => {
      reject(err);
    });
  });
}

/**
 * Loads configuration from package.json.
 */
function getPackageConfig(): Partial<SyncConfig> {
  const pkgPath: string = path.resolve(process.cwd(), 'package.json');
  if (!existsSync(pkgPath)) return {};

  try {
    const content: string = readFileSync(pkgPath, 'utf8');
    const pkg: PackageJson = JSON.parse(content) as PackageJson;
    return pkg.syncConfig || {};
  } catch {
    return {};
  }
}

/**
 * Core sync logic.
 */
export async function sync(config: SyncConfig): Promise<void> {
  const pkgManager = getPackageManager();
  const defaultBuildCommand =
    pkgManager === 'npm' ? 'npm run build' : `${pkgManager} build`;

  const {
    clientDir: clientDirRaw,
    clientDistDir: distName,
    destination: destRaw,
    buildCommand = defaultBuildCommand,
  } = config;

  const clientDir = path.resolve(process.cwd(), clientDirRaw);
  const distDir = path.join(clientDir, distName);
  const destDir = path.resolve(process.cwd(), destRaw);

  // Validate that required directories exist
  if (!existsSync(clientDir)) {
    throw new Error(`📂 Error: Client directory does not exist: ${clientDir}`);
  }

  if (!existsSync(destDir)) {
    throw new Error(
      `📂 Error: Destination directory does not exist: ${destDir}`
    );
  }

  if (!existsSync(distDir)) {
    console.log(`🔨 Build directory not found at ${distDir}. Building...`);
    const [cmd, ...args] = buildCommand.split(' ');
    await runCommand(cmd!, args, { cwd: clientDir });

    // Double check if build actually created the directory
    if (!existsSync(distDir)) {
      throw new Error(
        `🏗️ Error: Build finished but directory was not created: ${distDir}`
      );
    }
  }

  console.log(`🔄 Syncing ${distDir} to ${destDir}...`);

  try {
    // cspell:disable-next-line
    syncdir(distDir, destDir, {
      type: 'copy',
      deleteOrphaned: true,
    });
    console.log(`✅ Sync completed successfully.`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`📂 Sync failed: ${message}`, { cause: error });
  }
}

/**
 * CLI Execution entry point.
 */
async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      'client-dir': { type: 'string' },
      'client-dist-dir': { type: 'string' },
      destination: { type: 'string' },
      'build-command': { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });

  if (values.help) {
    console.log(`
Usage: tsx scripts/sync.ts [options]

Options:
  --client-dir <path>       Path to the client project directory
  --client-dist-dir <path>  Name of the distribution directory (e.g., "dist" or "build")
  --destination <path>      Path where assets should be synced
  --build-command <cmd>     Command to run if dist dir is missing (default: detects from environment)
  -h, --help                Show this help message
    `);
    return;
  }

  const pkgConfig = getPackageConfig();

  const clientDir = (values['client-dir'] as string) || pkgConfig.clientDir;
  const clientDistDir =
    (values['client-dist-dir'] as string) || pkgConfig.clientDistDir;
  const destination = (values.destination as string) || pkgConfig.destination;
  const buildCommand =
    (values['build-command'] as string) || pkgConfig.buildCommand;

  if (!clientDir || !clientDistDir || !destination) {
    console.error(
      '❌ Error: Missing configuration. Use CLI args or "syncConfig" in package.json.'
    );
    /* eslint-disable-next-line unicorn/no-process-exit */
    process.exit(1);
  }

  try {
    await sync({ clientDir, clientDistDir, destination, buildCommand });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    /* eslint-disable-next-line unicorn/no-process-exit */
    process.exit(1);
  }
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('sync.ts')
) {
  try {
    await main();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('💥 Unexpected error:', message);
    /* eslint-disable-next-line unicorn/no-process-exit */
    process.exit(1);
  }
}
