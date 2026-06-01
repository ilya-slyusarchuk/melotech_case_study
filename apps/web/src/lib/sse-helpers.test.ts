import { describe, expect, it } from "vitest";
import { formatSseEvent, encodeText } from "./sse-helpers";

describe("formatSseEvent", () => {
  it("produces a valid SSE payload with event type and json data", () => {
    const payload = { type: "platform_update", platform: "spotify" };
    const result = formatSseEvent("platform_update", payload);

    expect(result).toBe(
      'event: platform_update\ndata: {"type":"platform_update","platform":"spotify"}\n\n',
    );
  });

  it("ends with two newlines", () => {
    const result = formatSseEvent("test", { foo: "bar" });
    expect(result.endsWith("\n\n")).toBe(true);
  });
});

describe("encodeText", () => {
  it("encodes a string to Uint8Array", () => {
    const encoded = encodeText("hello");
    // Use constructor name check because jsdom returns a Uint8Array from
    // a different realm, so instanceof Uint8Array fails.
    expect(encoded.constructor.name).toBe("Uint8Array");
    expect(new TextDecoder().decode(encoded)).toBe("hello");
  });
});
