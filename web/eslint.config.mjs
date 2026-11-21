// ESLint, en configuration plate. Pas d'eslint-config-next : il tire eslint-plugin-jsx-a11y,
// qui depend d'axe-core (MPL-2.0), une licence refusee par le projet (scripts/verifier-licences.mjs).
// On garde les regles de Next.js, des hooks React et de TypeScript ; l'accessibilite est
// verifiee par les tests (tests/contrastes.test.ts, chemins Playwright).
import nextPlugin from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: [".next/**", "node_modules/**", "stubs/**", "next-env.d.ts"] },
  ...tseslint.configs.recommended,
  {
    plugins: { "@next/next": nextPlugin, "react-hooks": reactHooks },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
);
