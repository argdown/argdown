import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  // Base configuration for all JavaScript files in src directories
  {
    files: ['**/src/**/*.js', '**/src/**/*.mjs'],
    ...js.configs.recommended,
  },
  
  // TypeScript configuration for all TypeScript files in src directories
  ...tseslint.configs.recommendedTypeChecked.map(config => ({
    ...config,
    files: ['**/src/**/*.ts', '**/src/**/*.tsx'],
    languageOptions: {
      ...config.languageOptions,
      ecmaVersion: 2023,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...config.rules,
      // Disable memory-intensive type-aware rules for better performance
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      
      // Core linting rules
      'prefer-const': 'error',
      'no-var': 'error',
      'no-useless-escape': 'error',
      'no-irregular-whitespace': 'error',
      'no-control-regex': 'error',
      'no-empty-pattern': 'error',
      'no-case-declarations': 'error',
      
      // TypeScript-specific rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-namespace': 'error',
      '@typescript-eslint/no-this-alias': 'error',
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/no-unsafe-function-type': 'error',
    },
  })),
  
  // Configuration for test files
  {
    files: ['**/test/**/*.ts', '**/test/**/*.js'],
    rules: {
      // Allow more flexible rules in test files
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  
  // Configuration for CLI tools source files
  {
    files: ['packages/argdown-cli/src/**/*.ts', 'packages/argdown-cli/src/**/*.js'],
    rules: {
      'no-console': 'off', // Allow console.log in CLI tools
    },
  },
  
  // Global ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-esm/**',
      '**/build/**',
      '**/coverage/**',
      '**/.nyc_output/**',
      '**/lib/**',
      '**/*.min.js',
      '**/docs/.vuepress/dist/**',
    ],
  },
];