import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Prisma 7's prisma-client generator outputs TypeScript with extensionless
 * relative imports. When tsc compiles these to .js, Node's ESM loader
 * cannot resolve them. This script adds .js extensions to all relative
 * imports inside the generated Prisma client dist output.
 */

const GENERATED_DIR = join(process.cwd(), "dist", "generated", "prisma");

function patchFile(filePath) {
  const content = readFileSync(filePath, "utf-8");
  // Add .js to relative imports/exports that don't already have an extension.
  const patched = content.replace(
    /(from\s+["']\.\/[^"']+)(?<!\.js)(["'])/g,
    "$1.js$2",
  );

  if (patched !== content) {
    writeFileSync(filePath, patched, "utf-8");
    console.log(`Patched: ${filePath}`);
  }
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (stat.isFile() && entry.endsWith(".js")) {
      patchFile(fullPath);
    }
  }
}

try {
  walk(GENERATED_DIR);
  console.log("Generated Prisma client imports patched successfully.");
} catch (error) {
  console.error("Failed to patch generated imports:", error);
  process.exit(1);
}
