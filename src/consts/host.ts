import { PROD } from './prod.js';

// TODO: CHANGE ME
export const HOSTNAME = 'dcdavidev';
// TODO: CHANGE ME
export const HOST_EXT = 'me';

export const HOST = `${HOSTNAME}.${HOST_EXT}`;

export const DOMAIN_PATTERN = PROD
  ? HOST.replaceAll('.', String.raw`\.`)
  : String.raw`${HOSTNAME}\.local|localhost`;
