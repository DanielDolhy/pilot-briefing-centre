import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.extends("eslint-config-next/core-web-vitals"),
  ...compat.extends("plugin:@typescript-eslint/recommended"),
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  }
];

export default eslintConfig;
