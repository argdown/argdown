import pluginVue from "eslint-plugin-vue";
import globals from "globals";
import js from "@eslint/js";

export default [
  ...pluginVue.configs["flat/recommended"],
  js.configs.recommended,
  {
    rules: {
      "no-console": "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off"
    },
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  }
];
