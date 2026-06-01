import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { UsageChart } from "./usage-chart";
import "@testing-library/jest-dom/vitest";

describe("UsageChart", () => {
  it("renders empty state when no data", () => {
    render(<UsageChart labels={[]} consumedCredits={[]} />);
    expect(screen.getByText("No consumption yet.")).toBeInTheDocument();
  });

  it("renders bars, y-axis, and tooltips for provided data", () => {
    render(
      <UsageChart
        labels={["2024-01-01", "2024-01-02"]}
        consumedCredits={[3, 1]}
      />,
    );

    expect(screen.getByText("Consumed Credits")).toBeInTheDocument();

    // Y-axis should show normalized max, midpoint, and zero.
    const yAxis = screen.getByTestId("y-axis");
    expect(within(yAxis).getByText("3")).toBeInTheDocument();
    expect(within(yAxis).getByText("2")).toBeInTheDocument();
    expect(within(yAxis).getByText("0")).toBeInTheDocument();

    // Bars should be present with accessible labels and non-zero heights.
    const bars = screen.getAllByLabelText(/credits/);
    expect(bars).toHaveLength(2);
    expect(bars[0]).toHaveAttribute("aria-label", "3 credits on Jan 1");
    expect(bars[1]).toHaveAttribute("aria-label", "1 credits on Jan 2");

    // Percentage heights must be non-zero so bars are actually visible.
    expect(bars[0].style.height).not.toBe("0%");
    expect(bars[0].style.height).not.toBe("");
    expect(bars[1].style.height).not.toBe("0%");
    expect(bars[1].style.height).not.toBe("");

    // Hover first bar to reveal its tooltip.
    fireEvent.mouseEnter(bars[0]);
    const tooltip1 = screen.getByRole("tooltip");
    expect(tooltip1).toHaveTextContent("Jan 1: 3 credits");

    // Move to second bar; tooltip updates.
    fireEvent.mouseLeave(bars[0]);
    fireEvent.mouseEnter(bars[1]);
    const tooltip2 = screen.getByRole("tooltip");
    expect(tooltip2).toHaveTextContent("Jan 2: 1 credits");
  });
});
