import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopNav } from "./top-nav";
import "@testing-library/jest-dom/vitest";

// Mock Better Auth hooks.
vi.mock("../../lib/auth-client", () => ({
  useSession: vi.fn(() => ({
    data: {
      user: { id: "user_a", email: "artist@example.com", name: "Artist" },
    },
  })),
  signOut: vi.fn(),
}));

// Mock Next.js navigation hooks.
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/generate"),
}));

describe("TopNav", () => {
  it("renders product name", () => {
    render(<TopNav availableCredits={50} reservedCredits={10} />);
    expect(screen.getByText("Melotech")).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    render(<TopNav />);
    expect(screen.getByText("Generate")).toBeInTheDocument();
    expect(screen.getByText("History")).toBeInTheDocument();
    expect(screen.getByText("Usage")).toBeInTheDocument();
  });

  it("shows credits balance", () => {
    render(<TopNav availableCredits={50} reservedCredits={10} />);
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("shows user name", () => {
    render(<TopNav />);
    expect(screen.getByText("Artist")).toBeInTheDocument();
  });
});
