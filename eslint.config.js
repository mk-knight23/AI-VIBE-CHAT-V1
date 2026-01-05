import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import security from "eslint-plugin-security";
import sonarjs from "eslint-plugin-sonarjs";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "coverage", "build", "e2e", "src/infra/mcp"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "security": security,
      "sonarjs": sonarjs,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      
      // Security Rules - OWASP Top 10 (excluding intentional dynamic access)
      "security/detect-object-injection": "error",
      "security/detect-non-literal-regexp": "error",
      "security/detect-eval-with-expression": "error",
      "security/detect-new-buffer": "error",
      "security/detect-non-literal-fs-filename": "error",
      "security/detect-non-literal-require": "error",
      "security/detect-possible-timing-attacks": "error",
      "security/detect-child-process": "error",
      "security/detect-disable-mustache-escape": "error",
      
      // Code Quality Rules
      "sonarjs/cognitive-complexity": ["warn", 20],
      "sonarjs/no-identical-functions": "warn",
      "sonarjs/no-redundant-boolean": "warn",
      "sonarjs/no-unused-collection": "warn",
      "sonarjs/no-useless-catch": "warn",
      "sonarjs/prefer-immediate-return": "warn",
      "sonarjs/prefer-object-literal": "warn",
      "sonarjs/prefer-single-boolean-return": "warn",
      "sonarjs/use-isnan": "error",
      
      // Additional Security
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
      "no-alert": "warn",
      "no-console": "warn",
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-template": "error",
      "no-param-reassign": "error",
      "prefer-destructuring": ["error", {
        "object": true,
        "array": false
      }],
    },
  }
);
