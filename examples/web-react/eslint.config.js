import coreConfig from '../../eslint.config.js';

import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  {
    ignores: ['dist/**'],
  },
  ...coreConfig.map(cfg => ({
    ...cfg,
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ...cfg.languageOptions,
      parserOptions: {
        ...cfg.languageOptions?.parserOptions,
        project: './tsconfig.eslint.json',
        tsconfigRootDir: new URL('.', import.meta.url).pathname,
      },
    },
  })),

  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,

  {
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
];
