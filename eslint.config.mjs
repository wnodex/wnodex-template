import { defineConfig } from 'eslint/config';
import spellbookx from 'eslint-plugin-spellbookx';

export default defineConfig([
  {
    ignores: ['src/models/prisma/**'],
  },
  ...spellbookx.configs.recommended,
]);
