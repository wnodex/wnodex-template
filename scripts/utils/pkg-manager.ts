/**
 * @file pkg-manager.ts
 * @description Utility to detect the current package manager.
 */

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

/**
 * Detects the package manager being used to run the script.
 * Falls back to pnpm if detection fails.
 */
export function getPackageManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent || '';

  if (userAgent.includes('pnpm')) return 'pnpm';
  if (userAgent.includes('bun')) return 'bun';
  if (userAgent.includes('yarn')) return 'yarn';
  if (userAgent.includes('npm')) return 'npm';

  return 'pnpm'; // Default fallback
}

/**
 * Gets the command to run a script with the current package manager.
 */
export function getRunCommand(scriptName: string): string {
  const pkgManager = getPackageManager();

  if (pkgManager === 'npm') return `npm run ${scriptName}`;
  return `${pkgManager} ${scriptName}`;
}
