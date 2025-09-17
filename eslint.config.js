import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'

export default [
  {
    ignores: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
  },
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': [
        'warn',
        {
          'ts-ignore': 'allow-with-description',
          'ts-expect-error': 'allow-with-description',
          'ts-nocheck': 'allow-with-description',
        },
      ],
      '@typescript-eslint/triple-slash-reference': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: globals.node,
      sourceType: 'commonjs',
    },
  },
]