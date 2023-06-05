module.exports = {
  extends: ['eslint:recommended', 'plugin:astro/recommended', 'prettier'],
  rules: {
    'no-undef': 'warn',
    'no-unused-vars': 'warn',
  },
  overrides: [
    {
      files: ['*.astro'],
      parser: 'astro-eslint-parser',
      rules: {},
    },
  ],
}
