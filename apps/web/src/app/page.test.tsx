import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "./page";
import "@testing-library/jest-dom/vitest";

describe("web smoke", () => {
  it("renders a simple component", () => {
    render(<HomePage />);
    expect(screen.getByText("Melotech")).toBeInTheDocument();
  });
});
