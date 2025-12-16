import { defineConfig } from 'eslint/config';
import rootConfig from '../../eslint.config.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([
  ...rootConfig,
  {
    files: ['**/*.{ts,tsx}'],

    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      'no-console': 'off',
      'no-restricted-imports': 'off',
    },
  },
]);
