module.exports = {
  extends: ['plugin:astro/recommended', 'prettier'],
  overrides: [
    {
      files: ['*.astro'],
      parser: 'astro-eslint-parser',
      // Parse the script in `.astro` as TypeScript by adding the following configuration.
      // It's the setting you need when using TypeScript.
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.astro'],
      },
      rules: {},
    },
  ],
};
