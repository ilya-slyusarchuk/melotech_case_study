import { describe, it, expect, vi } from "vitest";
import { redirect } from "next/navigation";
import HomePage from "./page";

// next/navigation redirect is expected to throw a NEXT_REDIRECT error.
// We verify the redirect target instead of rendering.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

describe("HomePage", () => {
  it("redirects to /generate", () => {
    expect(() => HomePage()).toThrow("NEXT_REDIRECT:/generate");
    expect(redirect).toHaveBeenCalledWith("/generate");
  });
});
