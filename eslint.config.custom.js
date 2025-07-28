const tseslint = require('typescript-eslint');

module.exports = tseslint.config({
  rules: {
    'no-console': 'error',
    'spaced-comment': ['warn', 'always'],
    'prefer-arrow-callback': 'error',

    'no-unused-expressions': 'off',
    '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
    '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }], // function some({some, ...rest}) { return rest; }
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/no-unnecessary-type-arguments': 'error',
    '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    '@typescript-eslint/naming-convention': [
      'error',
      { selector: 'default', format: ['strictCamelCase'] },
      { selector: 'typeLike', format: ['StrictPascalCase'] },
      { selector: 'enumMember', format: ['StrictPascalCase'] },
      { selector: ['objectLiteralProperty', 'objectLiteralMethod'], format: ['strictCamelCase', 'StrictPascalCase'] },
      { selector: ['objectLiteralProperty', 'objectLiteralMethod'], modifiers: ['requiresQuotes'], format: null }, // { 'X-Http-Header: 'some' }
      { selector: 'variable', modifiers: ['const', 'global'], format: ['strictCamelCase', 'UPPER_CASE'] }, // standalone constants
      { selector: 'parameter', modifiers: ['unused'], format: ['strictCamelCase'], leadingUnderscore: 'allow' } // unused parameter function some(_: string, v: string) { return v; }
      // { selector: 'classProperty', modifiers: ['private'], format: ['strictCamelCase'], leadingUnderscore: 'allow' } // class Class { private _value = 0; }
    ],
    '@typescript-eslint/member-ordering': ['warn', { default: { memberTypes: ['field', 'constructor', 'method'] } }],
    '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public', overrides: { parameterProperties: 'off' } }]
  }
});
