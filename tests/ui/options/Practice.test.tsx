import { render } from "preact";
import { expect, it, describe, beforeEach } from "vitest";
import { Practice } from "../../../src/ui/options/Practice";

describe("Practice component", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
  });

  it("renders a passage selector dropdown", () => {
    const onStart = () => {};

    render(
      <Practice advancedModeEnabled={false} onStart={onStart} />,
      container
    );

    const select = container.querySelector("select");
    expect(select).not.toBeNull();
  });

  it("displays at least 8 built-in passages in the dropdown", () => {
    const onStart = () => {};

    render(
      <Practice advancedModeEnabled={false} onStart={onStart} />,
      container
    );

    const options = container.querySelectorAll("select option");
    // Should have at least 8 passages + 1 disabled placeholder option
    expect(options.length).toBeGreaterThanOrEqual(9);
  });

  it("shows destination selector with 'In-app trainer' by default", () => {
    const onStart = () => {};

    render(
      <Practice advancedModeEnabled={false} onStart={onStart} />,
      container
    );

    const text = container.textContent || "";
    expect(text).toContain("In-app trainer");
  });

  it("hides 'Active browser tab' destination when Advanced Mode is disabled", () => {
    const onStart = () => {};

    render(
      <Practice advancedModeEnabled={false} onStart={onStart} />,
      container
    );

    const text = container.textContent || "";
    expect(text).not.toContain("Active browser tab");
  });

  it("shows 'Active browser tab' destination when Advanced Mode is enabled", () => {
    const onStart = () => {};

    render(
      <Practice advancedModeEnabled={true} onStart={onStart} />,
      container
    );

    const text = container.textContent || "";
    expect(text).toContain("Active browser tab");
  });

  it("displays time estimate for the selected passage", () => {
    const onStart = () => {};

    render(
      <Practice advancedModeEnabled={false} onStart={onStart} />,
      container
    );

    const text = container.textContent || "";
    // Should show time estimate (in minutes or seconds format)
    expect(text).toMatch(/\d+\s*(min|sec|minute|second)/i);
  });

  it("renders a 'Start' button", () => {
    const onStart = () => {};

    render(
      <Practice advancedModeEnabled={false} onStart={onStart} />,
      container
    );

    const button = container.querySelector("button");
    expect(button).not.toBeNull();
    expect(button?.textContent).toContain("Start");
  });

  it("calls onStart with passage and destination when Start button is clicked", () => {
    let capturedArg: any = null;
    const onStart = (arg: any) => {
      capturedArg = arg;
    };

    render(
      <Practice advancedModeEnabled={false} onStart={onStart} />,
      container
    );

    const button = container.querySelector("button") as HTMLElement;
    button.click();

    expect(capturedArg).not.toBeNull();
    expect(capturedArg).toHaveProperty("passageId");
    expect(capturedArg).toHaveProperty("destination");
  });

  it("updates time estimate when passage selection changes", () => {
    const onStart = () => {};

    render(
      <Practice advancedModeEnabled={false} onStart={onStart} />,
      container
    );

    const select = container.querySelector("select") as HTMLSelectElement;
    const initialTimeText = container.textContent || "";
    expect(initialTimeText).toMatch(/\d+\s*min/i);

    // Select a different passage
    if (select.options.length > 2) {
      select.value = (select.options[2] as HTMLOptionElement).value;
      select.dispatchEvent(new Event("change", { bubbles: true }));

      // Wait a tick for state update (Preact is synchronous but render may be async)
      setTimeout(() => {
        const updatedTimeText = container.textContent || "";
        expect(updatedTimeText).toMatch(/\d+\s*min/i);
      }, 0);
    }
  });

  it("shows a title or heading", () => {
    const onStart = () => {};

    render(
      <Practice advancedModeEnabled={false} onStart={onStart} />,
      container
    );

    const heading = container.querySelector("h2");
    expect(heading).not.toBeNull();
    expect(heading?.textContent).toContain("Practice");
  });

  it("renders destination options as radio buttons or selector", () => {
    const onStart = () => {};

    render(
      <Practice advancedModeEnabled={true} onStart={onStart} />,
      container
    );

    // Look for radio buttons or other selection mechanism
    const radios = container.querySelectorAll("input[type='radio']");
    const labels = container.querySelectorAll("label");

    // Should have destination selection UI
    expect(radios.length + labels.length).toBeGreaterThan(0);
  });

  it("defaults to 'In-app trainer' destination", () => {
    let capturedArg: any = null;
    const onStart = (arg: any) => {
      capturedArg = arg;
    };

    render(
      <Practice advancedModeEnabled={false} onStart={onStart} />,
      container
    );

    const button = container.querySelector("button") as HTMLElement;
    button.click();

    expect(capturedArg.destination).toBe("in-app");
  });
});
