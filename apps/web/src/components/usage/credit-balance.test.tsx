import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreditBalance } from "./credit-balance";
import "@testing-library/jest-dom/vitest";

describe("CreditBalance", () => {
  it("renders available credits", () => {
    render(
      <CreditBalance
        availableCredits={50}
        reservedCredits={10}
        onGrant={vi.fn()}
        granting={false}
      />,
    );
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("renders reserved credits", () => {
    render(
      <CreditBalance
        availableCredits={50}
        reservedCredits={10}
        onGrant={vi.fn()}
        granting={false}
      />,
    );
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("calls onGrant when button is clicked", async () => {
    const user = userEvent.setup();
    const onGrant = vi.fn();
    render(
      <CreditBalance
        availableCredits={50}
        reservedCredits={10}
        onGrant={onGrant}
        granting={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: /add 100 credits/i }));
    expect(onGrant).toHaveBeenCalledTimes(1);
  });

  it("disables grant button when granting", () => {
    render(
      <CreditBalance
        availableCredits={50}
        reservedCredits={10}
        onGrant={vi.fn()}
        granting={true}
      />,
    );
    expect(screen.getByRole("button", { name: /add 100 credits/i })).toBeDisabled();
  });
});
