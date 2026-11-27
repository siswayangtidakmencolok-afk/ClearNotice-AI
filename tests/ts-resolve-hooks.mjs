// Test-only module resolution for `node --test`.
// Mirrors what Next.js/tsc ("moduleResolution": "bundler") already do:
// - the `@/*` -> `./*` path alias from tsconfig.json
// - extensionless relative imports of .ts/.tsx project files
import { registerHooks } from "node:module";
import { existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = new URL("../", import.meta.url);
const EXTENSIONS = [".ts", ".tsx", "/index.ts", "/index.tsx"];

function withTsExtension(url) {
  const path = fileURLToPath(url);
  if (existsSync(path) && statSync(path).isFile()) return url;
  for (const extension of EXTENSIONS) {
    if (existsSync(path + extension)) return pathToFileURL(path + extension).href;
  }
  return url;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(withTsExtension(new URL(specifier.slice(2), projectRoot).href), context);
    }
    const isRelative = specifier.startsWith("./") || specifier.startsWith("../");
    if (isRelative && context.parentURL?.startsWith("file:") && !context.parentURL.includes("/node_modules/")) {
      return nextResolve(withTsExtension(new URL(specifier, context.parentURL).href), context);
    }
    return nextResolve(specifier, context);
  },
});
