import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'src/content/eye/prototype.js'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-exports': ['error', { restrictDefaultExports: { direct: true } }],
    },
  },
  {
    // Vite and ESLint configs need default exports.
    files: ['eslint.config.js', 'vite.config.ts', 'vitest.config.ts', 'manifest.config.ts'],
    rules: { 'no-restricted-exports': 'off' },
  },
);
