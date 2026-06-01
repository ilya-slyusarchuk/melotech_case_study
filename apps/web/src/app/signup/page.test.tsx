import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignupPage from "./page";
import "@testing-library/jest-dom/vitest";

// Mock Better Auth hooks.
const mockSignUp = vi.fn();
vi.mock("../../lib/auth-client", () => ({
  useSession: vi.fn(() => ({ data: null })),
  signUpWithEmail: (...args: unknown[]) => mockSignUp(...args),
}));

// Mock Next.js router.
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}));

describe("SignupPage", () => {
  beforeEach(() => {
    mockSignUp.mockReset();
    mockPush.mockReset();
  });

  it("renders signup form", () => {
    render(<SignupPage />);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("shows validation error on failed signup", async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({
      error: { message: "Email already in use." },
    });

    render(<SignupPage />);

    await user.type(screen.getByLabelText("Name"), "Artist");
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText("Email already in use."),
    ).toBeInTheDocument();
  });

  it("redirects on successful signup", async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({});

    render(<SignupPage />);

    await user.type(screen.getByLabelText("Name"), "Artist");
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await vi.waitFor(() => expect(mockPush).toHaveBeenCalledWith("/generate"));
  });
});
