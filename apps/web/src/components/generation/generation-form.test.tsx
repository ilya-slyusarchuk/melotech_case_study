import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GenerationForm } from "./generation-form";
import "@testing-library/jest-dom/vitest";

// Mock next/navigation.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// Mock fetch.
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const TEST_COSTS = {
  spotify: 1,
  tiktok: 2,
  youtube: 3,
};

describe("GenerationForm", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("renders prompt textarea", () => {
    render(<GenerationForm availableCredits={10} platformCosts={TEST_COSTS} />);
    expect(
      screen.getByPlaceholderText("Describe your music concept..."),
    ).toBeInTheDocument();
  });

  it("renders platform toggle buttons", () => {
    render(<GenerationForm availableCredits={10} platformCosts={TEST_COSTS} />);
    expect(screen.getByTestId("platform-spotify")).toBeInTheDocument();
    expect(screen.getByTestId("platform-tiktok")).toBeInTheDocument();
    expect(screen.getByTestId("platform-youtube")).toBeInTheDocument();
  });

  it("shows validation error when prompt is empty", async () => {
    const user = userEvent.setup();
    render(<GenerationForm availableCredits={10} platformCosts={TEST_COSTS} />);

    // Select a platform without entering a prompt.
    await user.click(screen.getByTestId("platform-spotify"));
    await user.click(screen.getByRole("button", { name: /generate outputs/i }));

    expect(
      await screen.findByText("Please enter a prompt."),
    ).toBeInTheDocument();
  });

  it("shows validation error when no platform is selected", async () => {
    const user = userEvent.setup();
    render(<GenerationForm availableCredits={10} platformCosts={TEST_COSTS} />);

    const prompt = screen.getByPlaceholderText(
      "Describe your music concept...",
    );
    await user.type(prompt, "A chill lofi beat for studying");
    await user.click(screen.getByRole("button", { name: /generate outputs/i }));

    expect(
      await screen.findByText("Select at least one platform."),
    ).toBeInTheDocument();
  });

  it("shows insufficient credits inline warning", async () => {
    render(<GenerationForm availableCredits={0} platformCosts={TEST_COSTS} />);

    // Select YouTube (cost 3) with zero credits.
    await userEvent.click(screen.getByTestId("platform-youtube"));

    expect(await screen.findByText("Insufficient balance")).toBeInTheDocument();
  });

  it("disables submit when credits are insufficient", async () => {
    render(<GenerationForm availableCredits={0} platformCosts={TEST_COSTS} />);

    await userEvent.click(screen.getByTestId("platform-youtube"));

    const button = screen.getByRole("button", { name: /generate outputs/i });
    expect(button).toBeDisabled();
  });

  it("submits generation request with correct payload", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "gen_123" }),
    });

    render(<GenerationForm availableCredits={10} platformCosts={TEST_COSTS} />);

    const prompt = screen.getByPlaceholderText(
      "Describe your music concept...",
    );
    await user.type(prompt, "A chill lofi beat for studying");
    await user.click(screen.getByTestId("platform-spotify"));
    await user.click(screen.getByRole("button", { name: /generate outputs/i }));

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);

    expect(body.prompt).toBe("A chill lofi beat for studying");
    expect(body.target_platforms).toEqual(["spotify"]);
  });

  it("fetches pricing from API when platformCosts prop is not provided", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ spotify: 5, tiktok: 5, youtube: 5 }),
    });

    render(<GenerationForm availableCredits={10} />);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/credits/pricing"),
    );

    // After fetch resolves, the cost labels should show fetched values.
    const costLabels = await screen.findAllByText("5 cr");
    expect(costLabels.length).toBe(3);
  });
});
