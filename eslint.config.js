/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  {
    ignores: ["dist/**", "dist-web/**", "node_modules/**", "resources/**", "public/**", ".tools/**", "qa-evidence/**"],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        document: "readonly",
        Image: "readonly",
        localStorage: "readonly",
        MutationObserver: "readonly",
        setTimeout: "readonly",
        window: "readonly",
      },
    },
    rules: {
      "no-debugger": "warn",
      "no-redeclare": "warn",
      "no-unreachable": "warn",
      "no-unused-vars": ["warn", { args: "none", caughtErrors: "none", ignoreRestSiblings: true }],
    },
  },
];
