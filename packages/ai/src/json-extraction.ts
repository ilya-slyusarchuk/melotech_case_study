import { JSONExtractionError } from "./errors.js";

const fencedJsonPattern = /^```(?:json)?\s*([\s\S]*?)\s*```$/i;

export function extractJsonObject(rawText: string): unknown {
  const trimmedText = rawText.trim();
  const fencedMatch = fencedJsonPattern.exec(trimmedText);
  const candidateText = fencedMatch?.[1]?.trim() ?? trimmedText;
  const objectRanges = findTopLevelObjectRanges(candidateText);

  if (objectRanges.length !== 1) {
    throw new JSONExtractionError({
      reason:
        objectRanges.length === 0
          ? "no_json_object"
          : "multiple_json_objects_not_supported",
    });
  }

  const [range] = objectRanges;
  const prefix = candidateText.slice(0, range.start).trim();
  const suffix = candidateText.slice(range.end).trim();

  if (prefix.length > 0 || suffix.length > 0) {
    throw new JSONExtractionError({ reason: "non_json_text_around_object" });
  }

  try {
    return JSON.parse(candidateText.slice(range.start, range.end));
  } catch (error) {
    throw new JSONExtractionError({ reason: "malformed_json" }, error);
  }
}

type ObjectRange = {
  start: number;
  end: number;
};

function findTopLevelObjectRanges(text: string): ObjectRange[] {
  const ranges: ObjectRange[] = [];
  let depth = 0;
  let start = -1;
  let insideString = false;
  let escaping = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (insideString) {
      if (escaping) {
        escaping = false;
      } else if (char === "\\") {
        escaping = true;
      } else if (char === '"') {
        insideString = false;
      }

      continue;
    }

    if (char === '"') {
      insideString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) {
        start = index;
      }

      depth += 1;
      continue;
    }

    if (char === "}") {
      if (depth === 0) {
        throw new JSONExtractionError({ reason: "unexpected_closing_brace" });
      }

      depth -= 1;

      if (depth === 0) {
        ranges.push({ start, end: index + 1 });
        start = -1;
      }
    }
  }

  if (depth !== 0 || insideString) {
    throw new JSONExtractionError({ reason: "incomplete_json" });
  }

  return ranges;
}
