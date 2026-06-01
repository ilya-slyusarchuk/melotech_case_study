import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const sourceDirectory = dirname(fileURLToPath(import.meta.url));

describe("AI package architecture", () => {
  it("keeps platform generators free of concrete provider imports", () => {
    const generatorFiles = listTypeScriptFiles(sourceDirectory).filter((file) =>
      file.includes("generator"),
    );

    for (const file of generatorFiles) {
      const source = readFileSync(file, "utf8");

      expect(source).not.toContain("ollama-provider");
      expect(source).not.toContain("OllamaProvider");
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
