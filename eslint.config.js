const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
                ...globals.mocha
            }
        },
        rules: {
            'indent': ['error', 4, { 'SwitchCase': 1 }],
            'no-console': 'off',
            'no-var': 'error',
            'prefer-const': 'error',
            'no-trailing-spaces': 'error',
            'quotes': ['error', 'single', { 'avoidEscape': true, 'allowTemplateLiterals': true }],
            'semi': ['error', 'always'],
            'no-prototype-builtins': 'off',
            'no-unused-vars': ['error', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_', 'caughtErrorsIgnorePattern': '^_' }]
        }
    },
    {
        ignores: ['node_modules/**', '.git/**', 'gulpfile.js', 'admin/words.js']
    }
];
