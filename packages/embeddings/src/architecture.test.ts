import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const sourceDirectory = dirname(fileURLToPath(import.meta.url));

describe("embeddings package architecture", () => {
  it("keeps cache services free of concrete embedding provider imports", () => {
    const cacheServiceFiles = listTypeScriptFiles(sourceDirectory).filter(
      (file) => file.includes("similar-result-service"),
    );

    for (const file of cacheServiceFiles) {
      const source = readFileSync(file, "utf8");

      expect(source).not.toContain("openai-embedding-provider");
      expect(source).not.toContain("OpenAIEmbeddingProvider");
      expect(source).not.toContain('from "openai"');
    }
  });
});

function listTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return listTypeScriptFiles(entryPath);
    }

    return entry.name.endsWith(".ts") ? [entryPath] : [];
  });
}
