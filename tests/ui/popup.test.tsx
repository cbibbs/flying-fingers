import { render } from "preact";
import { expect, it, describe } from "vitest";
import { Popup } from "../../src/ui/popup/Popup";

describe("Popup component", () => {
  it("displays current rank name and emoji", () => {
    const container = document.createElement("div");
    render(<Popup />, container);

    const text = container.textContent || "";
    expect(text).toContain("Hunt & Peck");
    expect(text).toContain("🐾");
  });

  it("displays current XP and next rank threshold", () => {
    const container = document.createElement("div");
    render(<Popup />, container);

    const text = container.textContent || "";
    // Should show "250 / 500 XP" format or similar
    expect(text).toMatch(/\d+\s*\/\s*\d+/);
  });

  it("displays the Start Practice button", () => {
    const container = document.createElement("div");
    render(<Popup />, container);

    const button = container.querySelector("button");
    expect(button).not.toBeNull();
    expect(button?.textContent).toContain("Start Practice");
  });
});
