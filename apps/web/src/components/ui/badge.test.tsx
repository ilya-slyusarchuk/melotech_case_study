import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";
import "@testing-library/jest-dom/vitest";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Test</Badge>);
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("applies platform variant styles", () => {
    render(<Badge variant="spotify">Spotify</Badge>);
    expect(screen.getByText("Spotify")).toBeInTheDocument();
  });

  it("applies status variant styles", () => {
    render(<Badge variant="success">Done</Badge>);
    expect(screen.getByText("Done")).toBeInTheDocument();
  });
});
