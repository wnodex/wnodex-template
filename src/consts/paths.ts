import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use process.cwd() to find the root of the server application.
// In development, this is the apps/server directory.
// In production, this is the /opt/server directory where the server is running.
export const SERVER_ROOT = process.cwd();

// apps/server/www (synced from apps/www/build)
export const CLIENT_BUILD_PATH = path.join(SERVER_ROOT, 'www');

// apps/server/www/client
export const CLIENT_ASSETS_PATH = path.join(CLIENT_BUILD_PATH, 'client');
