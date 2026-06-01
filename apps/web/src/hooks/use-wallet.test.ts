import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useWallet } from "./use-wallet";

describe("useWallet", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches wallet on mount", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              availableCredits: 50,
              reservedCredits: 10,
            }),
        }),
      ),
    );

    const { result } = renderHook(() => useWallet());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.wallet).toEqual({
      availableCredits: 50,
      reservedCredits: 10,
    });
  });

  it("sets wallet to null on 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({}),
        }),
      ),
    );

    const { result } = renderHook(() => useWallet());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.wallet).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("polls wallet every 10 seconds", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ availableCredits: 10, reservedCredits: 0 }),
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useWallet());

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    vi.advanceTimersByTime(10_000);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
