const tseslint = require('typescript-eslint');

module.exports = tseslint.config({
  rules: {
    'no-console': 'error',
    'spaced-comment': ['warn', 'always'],
    'prefer-arrow-callback': 'error',

    'no-unused-expressions': 'off',
    '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/no-unnecessary-type-arguments': 'error',
    '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    '@typescript-eslint/naming-convention': [
      'error',
      { selector: 'default', format: ['camelCase'] },
      { selector: 'typeLike', format: ['PascalCase'] },
      { selector: 'enumMember', format: ['PascalCase'] },
      { selector: ['objectLiteralProperty', 'objectLiteralMethod'], format: ['camelCase', 'PascalCase'] },
      // 'allow' for "private _value" of property only until https://github.com/typescript-eslint/typescript-eslint/issues/816
      { selector: 'classProperty', modifiers: ['private'], format: ['camelCase'], leadingUnderscore: 'forbid' },
      // standalone constants
      { selector: 'variable', modifiers: ['const', 'global'], format: ['camelCase', 'UPPER_CASE'] },
      // unused parameter
      { selector: ['variable', 'parameter'], modifiers: ['unused'], format: ['camelCase'], leadingUnderscore: 'allow' }
    ],
    '@typescript-eslint/member-ordering': ['warn', { default: { memberTypes: ['field', 'constructor', 'method'] } }],
    '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public', overrides: { parameterProperties: 'off' } }]
  }
});
