import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlatformOutputCard } from "./platform-output-card";
import "@testing-library/jest-dom/vitest";

describe("PlatformOutputCard", () => {
  it("renders pending state", () => {
    render(
      <PlatformOutputCard
        platform="spotify"
        status="pending"
      />,
    );
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Waiting to start...")).toBeInTheDocument();
  });

  it("renders processing state", () => {
    render(
      <PlatformOutputCard
        platform="tiktok"
        status="processing"
      />,
    );
    expect(screen.getByText("Processing")).toBeInTheDocument();
    expect(screen.getByText("Processing...")).toBeInTheDocument();
  });

  it("renders completed state with content", () => {
    render(
      <PlatformOutputCard
        platform="youtube"
        status="completed"
        content={{ title: "Cool Track", tags: ["music", "viral"] }}
        source="LLM"
      />,
    );
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Cool Track")).toBeInTheDocument();
  });

  it("renders failed state", () => {
    render(
      <PlatformOutputCard
        platform="spotify"
        status="failed"
      />,
    );
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("Generation failed.")).toBeInTheDocument();
  });

  it("renders the platform failure reason when available", () => {
    render(
      <PlatformOutputCard
        platform="spotify"
        status="failed"
        errorMessage="The AI provider could not complete the request."
      />,
    );

    expect(
      screen.getByText("The AI provider could not complete the request."),
    ).toBeInTheDocument();
  });

  it("renders cache badge for cache fallback", () => {
    render(
      <PlatformOutputCard
        platform="spotify"
        status="completed"
        content={{ title: "Cached Track" }}
        source="CACHE"
      />,
    );
    expect(screen.getByText("Cache")).toBeInTheDocument();
  });
});
