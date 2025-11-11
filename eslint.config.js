import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import jest from 'eslint-plugin-jest';
import prettier from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react,
      jest,
    },
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
        Buffer: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'linebreak-style': ['off', 'unix'],
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],
      // Temporary overrides - TODO: Remove these blocks
      '@typescript-eslint/no-explicit-any': ['off'],
      '@typescript-eslint/no-var-requires': ['off'],
      '@typescript-eslint/no-empty-interface': ['off'],
      'jest/no-commented-out-tests': ['off'],
      '@typescript-eslint/explicit-module-boundary-types': ['off'],
      // end temp
      'no-console': ['off'],
      'react/jsx-filename-extension': [
        'error',
        { extensions: ['.jsx', '.tsx'] },
      ],
    },
  },
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    plugins: {
      jest,
    },
    rules: {
      ...jest.configs['flat/recommended'].rules,
      'jest/no-deprecated-functions': 'off', // Vitest doesn't have jest package
    },
  },
  prettier,
  {
    ignores: [
      'node_modules/**',
      'build/**',
      'dist/**',
      'coverage/**',
      '*.config.js',
      'vite.config.*',
      'cypress/**',
    ],
  }
);
