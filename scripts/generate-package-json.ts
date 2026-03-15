/**
 * @file generate-package-json.ts
 * @description Type-safe utility to generate a production package.json by merging multiple source packages.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

/**
 * Metadata for the package.json.
 */
export interface PackageMeta {
  name?: string;
  version?: string;
  type?: 'module' | 'commonjs';
  author?: string;
  license?: string;
  main?: string;
}

/**
 * Configuration for the generation process.
 */
export interface GenerateConfig extends PackageMeta {
  packagePaths: string[];
  internalPrefixes: string[];
  distDir?: string;
}

/**
 * Structure of the package.json.
 */
interface PackageJson {
  name: string;
  version: string;
  type?: string;
  author?: string;
  license?: string;
  engines?: Record<string, string>;
  main?: string;
  exports?: Record<string, string | object>;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
}

/**
 * Structure of the host package.json section.
 */
interface HostPackageJson {
  generateConfig?: Partial<GenerateConfig>;
}

/**
 * Loads configuration from package.json.
 */
function getPackageConfig(): Partial<GenerateConfig> {
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath)) return {};

  try {
    const content = fs.readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(content) as HostPackageJson;
    return pkg.generateConfig || {};
  } catch {
    return {};
  }
}

/**
 * Core generation logic.
 */
export async function generatePackageJson(
  config: GenerateConfig
): Promise<void> {
  const {
    packagePaths,
    internalPrefixes,
    distDir = 'dist',
    name: metaName,
    version: metaVersion,
    type: metaType,
    author: metaAuthor,
    license: metaLicense,
    main: metaMain,
  } = config;

  const distPath = path.join(distDir, 'package.json');

  try {
    let mergedDeps: Record<string, string> = {};
    let firstPackageData: Partial<PackageJson> = {};

    for (const relPath of packagePaths) {
      // If the path is a directory, assume package.json inside it
      const isDir =
        fs.existsSync(relPath) && fs.statSync(relPath).isDirectory();
      const targetFile = isDir ? path.join(relPath, 'package.json') : relPath;
      const fullPath = path.resolve(targetFile);

      if (!fs.existsSync(fullPath)) {
        console.warn(`⚠️ Warning: File not found at ${fullPath}`);
        continue;
      }

      const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8')) as PackageJson;

      if (Object.keys(firstPackageData).length === 0) {
        firstPackageData = pkg;
      }

      const filtered = Object.fromEntries(
        Object.entries(pkg.dependencies || {}).filter(
          ([depName]) =>
            !internalPrefixes.some((prefix) => depName.startsWith(prefix))
        )
      );

      mergedDeps = { ...mergedDeps, ...filtered };
    }

    const resolvedName = metaName || firstPackageData.name;

    if (!resolvedName) {
      throw new Error(
        '❌ Error: Package name could not be resolved from configuration or source files.'
      );
    }

    const resolvedMain = metaMain || './main.js';
    const resolvedAuthor = metaAuthor || firstPackageData.author;
    const resolvedLicense = metaLicense || firstPackageData.license;
    const resolvedEngines = firstPackageData.engines;

    const distPkg: PackageJson = {
      name: resolvedName,
      version: metaVersion || firstPackageData.version || '1.0.0',
      type: (metaType as string) || firstPackageData.type || 'module',
      ...(resolvedAuthor && { author: resolvedAuthor }),
      ...(resolvedLicense && { license: resolvedLicense }),
      ...(resolvedEngines && { engines: resolvedEngines }),
      main: resolvedMain,
      exports: { '.': resolvedMain },
      scripts: {
        start: `node ${resolvedMain.replace('./', '')}`,
      },
      dependencies: mergedDeps,
    };

    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    fs.writeFileSync(distPath, JSON.stringify(distPkg, null, 2));
    console.log(`✅ Success: Generated ${distPath} for "${resolvedName}"`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`📂 Generation failed: ${message}`, { cause: error });
  }
}

/**
 * CLI Execution entry point.
 */
async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      name: { type: 'string' },
      'package-paths': { type: 'string' },
      'internal-prefixes': { type: 'string' },
      version: { type: 'string' },
      type: { type: 'string' },
      author: { type: 'string' },
      license: { type: 'string' },
      main: { type: 'string' },
      'dist-dir': { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });

  if (values.help) {
    console.log(`
Usage: tsx scripts/generate-package-json.ts [options]

Options:
  --name <name>               Package name
  --package-paths <paths>     Comma-separated relative paths to package.json files
  --internal-prefixes <pre>   Comma-separated prefixes to filter out from dependencies
  --version <version>         Package version
  --type <type>               Module type (module | commonjs)
  --author <author>           Author string
  --license <license>         License type
  --main <path>               Entry point file (default: "./main.js")
  --dist-dir <path>           Output directory (default: "dist")
  -h, --help                  Show this help message
    `);
    return;
  }

  const pkgConfig = getPackageConfig();

  const name = (values.name as string) || pkgConfig.name;
  const packagePathsRaw =
    (values['package-paths'] as string) || pkgConfig.packagePaths;
  const internalPrefixesRaw =
    (values['internal-prefixes'] as string) || pkgConfig.internalPrefixes;

  const packagePaths = Array.isArray(packagePathsRaw)
    ? packagePathsRaw
    : (packagePathsRaw as string)?.split(',').map((p) => p.trim()) || [];

  const internalPrefixes = Array.isArray(internalPrefixesRaw)
    ? internalPrefixesRaw
    : (internalPrefixesRaw as string)?.split(',').map((p) => p.trim()) || [];

  const version = (values.version as string) || pkgConfig.version;
  const type = (values.type as 'module' | 'commonjs') || pkgConfig.type;
  const author = (values.author as string) || pkgConfig.author;
  const license = (values.license as string) || pkgConfig.license;
  const mainFile = (values.main as string) || pkgConfig.main;
  const distDir = (values['dist-dir'] as string) || pkgConfig.distDir;

  if (packagePaths.length === 0) {
    console.error(
      '❌ Error: Missing package-paths. Use --package-paths or configure in package.json.'
    );
    /* eslint-disable-next-line unicorn/no-process-exit */
    process.exit(1);
  }

  try {
    await generatePackageJson({
      name,
      packagePaths,
      internalPrefixes,
      version,
      type,
      author,
      license,
      main: mainFile,
      distDir,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    /* eslint-disable-next-line unicorn/no-process-exit */
    process.exit(1);
  }
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('generate-package-json.ts')
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
