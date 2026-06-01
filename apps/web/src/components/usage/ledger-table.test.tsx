import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LedgerTable } from "./ledger-table";
import "@testing-library/jest-dom/vitest";

describe("LedgerTable", () => {
  it("renders empty state", () => {
    render(<LedgerTable entries={[]} />);
    expect(screen.getByText("No entries yet.")).toBeInTheDocument();
  });

  it("renders entries with formatted types", () => {
    render(
      <LedgerTable
        entries={[
          {
            id: "entry_1",
            type: "grant",
            amount: 100,
            createdAt: "2024-01-01T00:00:00Z",
          },
          {
            id: "entry_2",
            type: "platform_capture",
            amount: 2,
            platform: "spotify",
            createdAt: "2024-01-02T00:00:00Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("Grant")).toBeInTheDocument();
    expect(screen.getByText("Platform Capture")).toBeInTheDocument();
    expect(screen.getByText("+100")).toBeInTheDocument();
    expect(screen.getByText("-2")).toBeInTheDocument();
  });
});
