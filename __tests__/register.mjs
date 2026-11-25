import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const projectRoot = process.cwd();

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const target = path.join(projectRoot, specifier.slice(2));
      for (const candidate of [`${target}.ts`, `${target}.tsx`, path.join(target, "index.ts")]) {
        if (existsSync(candidate)) {
          return { url: pathToFileURL(candidate).href, shortCircuit: true };
        }
      }
    }

    if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      !path.extname(specifier) &&
      context.parentURL
    ) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL));
      const target = path.resolve(parentDir, specifier);
      for (const candidate of [`${target}.ts`, `${target}.tsx`, path.join(target, "index.ts")]) {
        if (existsSync(candidate)) {
          return { url: pathToFileURL(candidate).href, shortCircuit: true };
        }
      }
    }

    return nextResolve(specifier, context);
  },
});
