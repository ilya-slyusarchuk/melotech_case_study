import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";
import "@testing-library/jest-dom/vitest";

// Mock Better Auth hooks.
const mockSignIn = vi.fn();
vi.mock("../../lib/auth-client", () => ({
  useSession: vi.fn(() => ({ data: null })),
  signInWithEmail: (...args: unknown[]) => mockSignIn(...args),
}));

// Mock Next.js router.
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    mockSignIn.mockReset();
    mockPush.mockReset();
    mockRefresh.mockReset();
  });

  it("renders login form", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("shows validation error on failed login", async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({
      error: { message: "Invalid credentials." },
    });

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Invalid credentials.")).toBeInTheDocument();
  });

  it("redirects on successful login", async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({});

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await vi.waitFor(() => expect(mockPush).toHaveBeenCalledWith("/generate"));
  });
});
