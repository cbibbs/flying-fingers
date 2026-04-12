import { render } from "preact";
import { expect, it, describe, beforeEach } from "vitest";
import { Dashboard } from "../../../src/ui/options/Dashboard";

describe("Dashboard component", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
  });

  it("displays 'No sessions yet' when stats are empty", () => {
    const stats = {
      totalSessions: 0,
      totalCharsTyped: 0,
      averageWpm: 0,
      averageAccuracy: 0,
      bestWpm: 0,
    };

    render(<Dashboard stats={stats} />, container);

    const text = container.textContent || "";
    expect(text).toContain("No sessions yet");
  });

  it("displays total sessions count", () => {
    const stats = {
      totalSessions: 5,
      totalCharsTyped: 2500,
      averageWpm: 75,
      averageAccuracy: 0.98,
      bestWpm: 85,
    };

    render(<Dashboard stats={stats} />, container);

    const text = container.textContent || "";
    expect(text).toContain("5");
  });

  it("displays total characters typed", () => {
    const stats = {
      totalSessions: 3,
      totalCharsTyped: 1500,
      averageWpm: 60,
      averageAccuracy: 0.96,
      bestWpm: 72,
    };

    render(<Dashboard stats={stats} />, container);

    const text = container.textContent || "";
    expect(text).toContain("1500");
  });

  it("displays average WPM rounded to 1 decimal place", () => {
    const stats = {
      totalSessions: 2,
      totalCharsTyped: 1000,
      averageWpm: 65.789,
      averageAccuracy: 0.95,
      bestWpm: 75,
    };

    render(<Dashboard stats={stats} />, container);

    const text = container.textContent || "";
    expect(text).toMatch(/65\.8/);
  });

  it("displays average accuracy as a percentage", () => {
    const stats = {
      totalSessions: 4,
      totalCharsTyped: 2000,
      averageWpm: 70,
      averageAccuracy: 0.9756,
      bestWpm: 82,
    };

    render(<Dashboard stats={stats} />, container);

    const text = container.textContent || "";
    expect(text).toMatch(/97\.6/);
  });

  it("displays best WPM achieved", () => {
    const stats = {
      totalSessions: 6,
      totalCharsTyped: 3500,
      averageWpm: 68,
      averageAccuracy: 0.97,
      bestWpm: 88,
    };

    render(<Dashboard stats={stats} />, container);

    const text = container.textContent || "";
    expect(text).toContain("88");
  });

  it("renders stat cards with proper labels", () => {
    const stats = {
      totalSessions: 10,
      totalCharsTyped: 5000,
      averageWpm: 75,
      averageAccuracy: 0.97,
      bestWpm: 90,
    };

    render(<Dashboard stats={stats} />, container);

    const text = container.textContent || "";
    expect(text).toContain("Sessions");
    expect(text).toContain("Characters");
    expect(text).toContain("Average WPM");
    expect(text).toContain("Accuracy");
    expect(text).toContain("Best WPM");
  });

  it("shows zero values when stats have zeros", () => {
    const stats = {
      totalSessions: 0,
      totalCharsTyped: 0,
      averageWpm: 0,
      averageAccuracy: 0,
      bestWpm: 0,
    };

    render(<Dashboard stats={stats} />, container);

    const text = container.textContent || "";
    // Should show "No sessions yet" state instead of individual zeros
    expect(text).toContain("No sessions yet");
  });

  it("handles high character counts (thousands)", () => {
    const stats = {
      totalSessions: 50,
      totalCharsTyped: 125000,
      averageWpm: 82,
      averageAccuracy: 0.985,
      bestWpm: 105,
    };

    render(<Dashboard stats={stats} />, container);

    const text = container.textContent || "";
    expect(text).toContain("125000");
  });

  it("handles accuracy of 100%", () => {
    const stats = {
      totalSessions: 3,
      totalCharsTyped: 1500,
      averageWpm: 75,
      averageAccuracy: 1,
      bestWpm: 80,
    };

    render(<Dashboard stats={stats} />, container);

    const text = container.textContent || "";
    expect(text).toMatch(/100/);
  });

  it("renders a headline or title", () => {
    const stats = {
      totalSessions: 5,
      totalCharsTyped: 2500,
      averageWpm: 75,
      averageAccuracy: 0.98,
      bestWpm: 85,
    };

    render(<Dashboard stats={stats} />, container);

    const heading = container.querySelector("h2");
    expect(heading).not.toBeNull();
    expect(heading?.textContent).toContain("Dashboard");
  });
});
