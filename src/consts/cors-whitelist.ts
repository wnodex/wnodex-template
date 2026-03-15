import { DOMAIN_PATTERN } from './host.js';

export const corsWhitelist = new RegExp(
  String.raw`^https?://([a-z0-9-]+\.)*(${DOMAIN_PATTERN})(:[0-9]+)?$`
);
