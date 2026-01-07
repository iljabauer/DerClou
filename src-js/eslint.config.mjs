import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


/** @type {import('eslint').Linter.Config[]} */
export default [
    { files: ["**/*.{js,mjs,cjs,ts}"] },
    { languageOptions: { globals: globals.browser } },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        ignores: ["dist/**/*", "node_modules/**/*", "playwright-report/**/*", "test-results/**/*", ".agent/**/*", "vite/**/*"]
    },
    {
        files: ["log.js"],
        languageOptions: {
            globals: globals.node
        },
        rules: {
            "@typescript-eslint/no-require-imports": "off"
        }
    }
];
