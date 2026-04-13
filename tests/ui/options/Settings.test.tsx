import { render } from "preact";
import { expect, it, describe, beforeEach, vi } from "vitest";
import { Settings } from "../../../src/ui/options/Settings";
import type { UserSettings } from "../../../src/ui/options/Settings";

describe("Settings component", () => {
  let container: HTMLElement;

  const defaultSettings: UserSettings = {
    advancedModeEnabled: false,
    darkMode: false,
  };

  beforeEach(() => {
    container = document.createElement("div");
  });

  it("renders a Settings heading", () => {
    render(
      <Settings settings={defaultSettings} onChange={() => {}} />,
      container
    );

    const heading = container.querySelector("h2");
    expect(heading).not.toBeNull();
    expect(heading?.textContent).toContain("Settings");
  });

  it("renders an Advanced Mode toggle", () => {
    render(
      <Settings settings={defaultSettings} onChange={() => {}} />,
      container
    );

    const text = container.textContent || "";
    expect(text).toContain("Advanced Mode");
  });

  it("renders a Dark Mode toggle", () => {
    render(
      <Settings settings={defaultSettings} onChange={() => {}} />,
      container
    );

    const text = container.textContent || "";
    expect(text).toContain("Dark Mode");
  });

  it("Advanced Mode checkbox is checked when advancedModeEnabled is true", () => {
    const settings: UserSettings = { advancedModeEnabled: true, darkMode: false };

    render(<Settings settings={settings} onChange={() => {}} />, container);

    const checkboxes = container.querySelectorAll("input[type='checkbox']");
    const advancedCheckbox = Array.from(checkboxes).find((el) => {
      const id = el.getAttribute("id") || "";
      return id.includes("advanced");
    }) as HTMLInputElement | undefined;

    expect(advancedCheckbox).not.toBeUndefined();
    expect(advancedCheckbox?.checked).toBe(true);
  });

  it("Advanced Mode checkbox is unchecked when advancedModeEnabled is false", () => {
    const settings: UserSettings = { advancedModeEnabled: false, darkMode: false };

    render(<Settings settings={settings} onChange={() => {}} />, container);

    const checkboxes = container.querySelectorAll("input[type='checkbox']");
    const advancedCheckbox = Array.from(checkboxes).find((el) => {
      const id = el.getAttribute("id") || "";
      return id.includes("advanced");
    }) as HTMLInputElement | undefined;

    expect(advancedCheckbox).not.toBeUndefined();
    expect(advancedCheckbox?.checked).toBe(false);
  });

  it("Dark Mode checkbox is checked when darkMode is true", () => {
    const settings: UserSettings = { advancedModeEnabled: false, darkMode: true };

    render(<Settings settings={settings} onChange={() => {}} />, container);

    const checkboxes = container.querySelectorAll("input[type='checkbox']");
    const darkModeCheckbox = Array.from(checkboxes).find((el) => {
      const id = el.getAttribute("id") || "";
      return id.includes("dark");
    }) as HTMLInputElement | undefined;

    expect(darkModeCheckbox).not.toBeUndefined();
    expect(darkModeCheckbox?.checked).toBe(true);
  });

  it("Dark Mode checkbox is unchecked when darkMode is false", () => {
    const settings: UserSettings = { advancedModeEnabled: false, darkMode: false };

    render(<Settings settings={settings} onChange={() => {}} />, container);

    const checkboxes = container.querySelectorAll("input[type='checkbox']");
    const darkModeCheckbox = Array.from(checkboxes).find((el) => {
      const id = el.getAttribute("id") || "";
      return id.includes("dark");
    }) as HTMLInputElement | undefined;

    expect(darkModeCheckbox).not.toBeUndefined();
    expect(darkModeCheckbox?.checked).toBe(false);
  });

  it("clicking Advanced Mode toggle calls onChange with toggled value", () => {
    const onChange = vi.fn();
    const settings: UserSettings = { advancedModeEnabled: false, darkMode: false };

    render(<Settings settings={settings} onChange={onChange} />, container);

    const checkboxes = container.querySelectorAll("input[type='checkbox']");
    const advancedCheckbox = Array.from(checkboxes).find((el) => {
      const id = el.getAttribute("id") || "";
      return id.includes("advanced");
    }) as HTMLInputElement | undefined;

    expect(advancedCheckbox).not.toBeUndefined();
    advancedCheckbox!.dispatchEvent(new Event("change", { bubbles: true }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      advancedModeEnabled: true,
      darkMode: false,
    });
  });

  it("clicking Dark Mode toggle calls onChange with toggled value", () => {
    const onChange = vi.fn();
    const settings: UserSettings = { advancedModeEnabled: false, darkMode: false };

    render(<Settings settings={settings} onChange={onChange} />, container);

    const checkboxes = container.querySelectorAll("input[type='checkbox']");
    const darkModeCheckbox = Array.from(checkboxes).find((el) => {
      const id = el.getAttribute("id") || "";
      return id.includes("dark");
    }) as HTMLInputElement | undefined;

    expect(darkModeCheckbox).not.toBeUndefined();
    darkModeCheckbox!.dispatchEvent(new Event("change", { bubbles: true }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      advancedModeEnabled: false,
      darkMode: true,
    });
  });

  it("Advanced Mode toggle has a description about enabling custom passages", () => {
    render(
      <Settings settings={defaultSettings} onChange={() => {}} />,
      container
    );

    const text = container.textContent || "";
    // Should explain what Advanced Mode enables (the custom passage flow)
    expect(text).toMatch(/custom passage|custom practice|active.*tab/i);
  });

  it("renders two checkboxes total (one per setting)", () => {
    render(
      <Settings settings={defaultSettings} onChange={() => {}} />,
      container
    );

    const checkboxes = container.querySelectorAll("input[type='checkbox']");
    expect(checkboxes.length).toBe(2);
  });

  it("toggling Advanced Mode off calls onChange with false", () => {
    const onChange = vi.fn();
    const settings: UserSettings = { advancedModeEnabled: true, darkMode: false };

    render(<Settings settings={settings} onChange={onChange} />, container);

    const checkboxes = container.querySelectorAll("input[type='checkbox']");
    const advancedCheckbox = Array.from(checkboxes).find((el) => {
      const id = el.getAttribute("id") || "";
      return id.includes("advanced");
    }) as HTMLInputElement | undefined;

    advancedCheckbox!.dispatchEvent(new Event("change", { bubbles: true }));

    expect(onChange).toHaveBeenCalledWith({
      advancedModeEnabled: false,
      darkMode: false,
    });
  });
});
