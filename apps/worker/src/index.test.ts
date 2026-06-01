import { describe, it, expect } from "vitest";
import { bootstrap } from "./index.js";

describe("worker smoke", () => {
  it("bootstrap can be imported without side effects", () => {
    expect(bootstrap()).toBe("worker-bootstrap");
  });
});
