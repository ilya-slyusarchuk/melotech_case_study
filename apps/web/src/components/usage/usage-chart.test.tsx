import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UsageChart } from "./usage-chart";
import "@testing-library/jest-dom/vitest";

describe("UsageChart", () => {
  it("renders empty state when no data", () => {
    render(<UsageChart labels={[]} consumedCredits={[]} />);
    expect(screen.getByText("No consumption yet.")).toBeInTheDocument();
  });

  it("renders bars for provided data", () => {
    render(
      <UsageChart
        labels={["2024-01-01", "2024-01-02"]}
        consumedCredits={[3, 1]}
      />,
    );
    expect(screen.getByText("Consumed Credits")).toBeInTheDocument();
  });
});
