import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Tooltip } from "./tooltip";
import "@testing-library/jest-dom/vitest";

describe("Tooltip", () => {
  it("shows tooltip content on mouse enter", () => {
    render(
      <Tooltip content=<span data-testid="tooltip-content">Hello</span>>
        <button data-testid="trigger">Hover me</button>
      </Tooltip>,
    );

    const trigger = screen.getByTestId("trigger");
    expect(screen.queryByTestId("tooltip-content")).not.toBeInTheDocument();

    fireEvent.mouseEnter(trigger);
    expect(screen.getByTestId("tooltip-content")).toBeInTheDocument();
  });

  it("hides tooltip content on mouse leave", () => {
    render(
      <Tooltip content=<span data-testid="tooltip-content">Hello</span>>
        <button data-testid="trigger">Hover me</button>
      </Tooltip>,
    );

    const trigger = screen.getByTestId("trigger");
    fireEvent.mouseEnter(trigger);
    expect(screen.getByTestId("tooltip-content")).toBeInTheDocument();

    fireEvent.mouseLeave(trigger);
    expect(screen.queryByTestId("tooltip-content")).not.toBeInTheDocument();
  });

  it("shows tooltip on focus and hides on blur", () => {
    render(
      <Tooltip content=<span data-testid="tooltip-content">Hello</span>>
        <button data-testid="trigger">Focus me</button>
      </Tooltip>,
    );

    const trigger = screen.getByTestId("trigger");
    fireEvent.focus(trigger);
    expect(screen.getByTestId("tooltip-content")).toBeInTheDocument();

    fireEvent.blur(trigger);
    expect(screen.queryByTestId("tooltip-content")).not.toBeInTheDocument();
  });
});
