// SSE formatting utilities.
// These helpers produce valid text/event-stream payloads so the endpoint
// and the frontend hook agree on wire format.

/**
 * Formats a single SSE event payload.
 * Each event has an event type and a data block.
 * Lines in the data block are prefixed with "data: ".
 * The payload ends with two newlines.
 */
export function formatSseEvent(
  eventType: string,
  payload: unknown,
): string {
  const lines = [
    `event: ${eventType}`,
    `data: ${JSON.stringify(payload)}`,
    "",
    "",
  ];
  return lines.join("\n");
}

/**
 * Encodes a string into a Uint8Array for streaming.
 */
export function encodeText(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}
