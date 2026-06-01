import { describe, expect, it } from "vitest";
import { JSONExtractionError } from "./errors.js";
import { extractJsonObject } from "./json-extraction.js";

describe("JSON extraction", () => {
  it("extracts plain object JSON", () => {
    expect(extractJsonObject('{"title":"Track","bpm":120}')).toEqual({
      title: "Track",
      bpm: 120,
    });
  });

  it("extracts JSON wrapped in markdown code fences", () => {
    expect(extractJsonObject('```json\n{"hook":"Listen now"}\n```')).toEqual({
      hook: "Listen now",
    });
  });

  it("rejects text with no JSON object", () => {
    expect(() => extractJsonObject("Here is the answer.")).toThrow(
      JSONExtractionError,
    );
  });

  it("rejects malformed JSON with parse error metadata", () => {
    try {
      extractJsonObject('{"title":}');
      expect.fail("Expected JSONExtractionError to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(JSONExtractionError);
      const jsonError = error as JSONExtractionError;
      expect(jsonError.metadata).toMatchObject({
        reason: "malformed_json",
        parseError: expect.stringContaining("Unexpected token"),
        hint: expect.stringContaining("unescaped"),
      });
    }
  });

  it("rejects incomplete JSON", () => {
    expect(() => extractJsonObject('{"title":"Track"')).toThrow(
      JSONExtractionError,
    );
  });

  it("rejects multiple JSON objects with a deterministic rule", () => {
    expect(() => extractJsonObject('{"a":1}\n{"a":2}')).toThrow(
      JSONExtractionError,
    );
  });

  it("rejects prose around an otherwise valid object", () => {
    expect(() => extractJsonObject('Here is JSON: {"a":1}')).toThrow(
      JSONExtractionError,
    );
  });
});
