import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = defineConfig([
  ...nextVitals,
  ...nextTypescript,
  { rules: { "@next/next/no-img-element": "off" } },
  globalIgnores([".next/**", "node_modules/**", "storage/**"]),
]);

export default config;
