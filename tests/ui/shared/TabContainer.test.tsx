import { render } from "preact";
import { expect, it, describe, beforeEach } from "vitest";
import { TabContainer } from "../../../src/ui/shared/TabContainer";

describe("TabContainer component", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
  });

  it("renders tab buttons with correct labels", () => {
    const tabs = ["Dashboard", "Practice", "Stats", "Settings"];
    const onChange = () => {};

    render(
      <TabContainer tabs={tabs} activeTab="dashboard" onChange={onChange} />,
      container
    );

    const buttons = container.querySelectorAll("[role='tab']");
    expect(buttons).toHaveLength(4);
    expect(buttons[0].textContent).toBe("Dashboard");
    expect(buttons[1].textContent).toBe("Practice");
    expect(buttons[2].textContent).toBe("Stats");
    expect(buttons[3].textContent).toBe("Settings");
  });

  it("marks the active tab with aria-selected='true'", () => {
    const tabs = ["Dashboard", "Practice", "Stats"];
    const onChange = () => {};

    render(
      <TabContainer tabs={tabs} activeTab="practice" onChange={onChange} />,
      container
    );

    const buttons = container.querySelectorAll("[role='tab']");
    expect((buttons[0] as HTMLElement).getAttribute("aria-selected")).toBe(
      "false"
    );
    expect((buttons[1] as HTMLElement).getAttribute("aria-selected")).toBe(
      "true"
    );
    expect((buttons[2] as HTMLElement).getAttribute("aria-selected")).toBe(
      "false"
    );
  });

  it("sets tabindex='0' on active tab and '-1' on inactive tabs", () => {
    const tabs = ["Dashboard", "Practice"];
    const onChange = () => {};

    render(
      <TabContainer tabs={tabs} activeTab="dashboard" onChange={onChange} />,
      container
    );

    const buttons = container.querySelectorAll("[role='tab']");
    expect((buttons[0] as HTMLElement).getAttribute("tabindex")).toBe("0");
    expect((buttons[1] as HTMLElement).getAttribute("tabindex")).toBe("-1");
  });

  it("calls onChange with normalized tab name (lowercase) on button click", () => {
    const tabs = ["Dashboard", "Practice"];
    let changedTo = "";
    const onChange = (tab: string) => {
      changedTo = tab;
    };

    render(
      <TabContainer tabs={tabs} activeTab="dashboard" onChange={onChange} />,
      container
    );

    const practiceButton = container.querySelectorAll("[role='tab']")[1];
    (practiceButton as HTMLElement).click();

    expect(changedTo).toBe("practice");
  });

  it("navigates to next tab on ArrowRight key", () => {
    const tabs = ["Dashboard", "Practice", "Stats"];
    let changedTo = "";
    const onChange = (tab: string) => {
      changedTo = tab;
    };

    render(
      <TabContainer tabs={tabs} activeTab="dashboard" onChange={onChange} />,
      container
    );

    const tablist = container.querySelector("[role='tablist']") as HTMLElement;
    const event = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
    });
    tablist.dispatchEvent(event);

    expect(changedTo).toBe("practice");
  });

  it("navigates to previous tab on ArrowLeft key", () => {
    const tabs = ["Dashboard", "Practice", "Stats"];
    let changedTo = "";
    const onChange = (tab: string) => {
      changedTo = tab;
    };

    render(
      <TabContainer tabs={tabs} activeTab="practice" onChange={onChange} />,
      container
    );

    const tablist = container.querySelector("[role='tablist']") as HTMLElement;
    const event = new KeyboardEvent("keydown", {
      key: "ArrowLeft",
      bubbles: true,
    });
    tablist.dispatchEvent(event);

    expect(changedTo).toBe("dashboard");
  });

  it("wraps to last tab on ArrowLeft from first tab", () => {
    const tabs = ["Dashboard", "Practice", "Stats"];
    let changedTo = "";
    const onChange = (tab: string) => {
      changedTo = tab;
    };

    render(
      <TabContainer tabs={tabs} activeTab="dashboard" onChange={onChange} />,
      container
    );

    const tablist = container.querySelector("[role='tablist']") as HTMLElement;
    const event = new KeyboardEvent("keydown", {
      key: "ArrowLeft",
      bubbles: true,
    });
    tablist.dispatchEvent(event);

    expect(changedTo).toBe("stats");
  });

  it("wraps to first tab on ArrowRight from last tab", () => {
    const tabs = ["Dashboard", "Practice", "Stats"];
    let changedTo = "";
    const onChange = (tab: string) => {
      changedTo = tab;
    };

    render(
      <TabContainer tabs={tabs} activeTab="stats" onChange={onChange} />,
      container
    );

    const tablist = container.querySelector("[role='tablist']") as HTMLElement;
    const event = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
    });
    tablist.dispatchEvent(event);

    expect(changedTo).toBe("dashboard");
  });

  it("has tablist role on the container", () => {
    const tabs = ["Dashboard", "Practice"];
    const onChange = () => {};

    render(
      <TabContainer tabs={tabs} activeTab="dashboard" onChange={onChange} />,
      container
    );

    const tablist = container.querySelector("[role='tablist']");
    expect(tablist).not.toBeNull();
  });

  it("prevents default on arrow key events", () => {
    const tabs = ["Dashboard", "Practice"];
    const onChange = () => {};

    render(
      <TabContainer tabs={tabs} activeTab="dashboard" onChange={onChange} />,
      container
    );

    const tablist = container.querySelector("[role='tablist']") as HTMLElement;
    const event = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
    });

    let prevented = false;
    event.preventDefault = () => {
      prevented = true;
    };

    tablist.dispatchEvent(event);
    expect(prevented).toBe(true);
  });

  it("renders panel content with role='tabpanel'", () => {
    const tabs = ["Dashboard", "Practice"];
    const onChange = () => {};

    render(
      <TabContainer tabs={tabs} activeTab="dashboard" onChange={onChange}>
        <div>Dashboard content</div>
        <div>Practice content</div>
      </TabContainer>,
      container
    );

    const panels = container.querySelectorAll("[role='tabpanel']");
    expect(panels).toHaveLength(2);
  });

  it("shows only the active panel content", () => {
    const tabs = ["Dashboard", "Practice"];
    const onChange = () => {};

    render(
      <TabContainer tabs={tabs} activeTab="dashboard" onChange={onChange}>
        <div>Dashboard content</div>
        <div>Practice content</div>
      </TabContainer>,
      container
    );

    const panels = container.querySelectorAll("[role='tabpanel']");
    const dashboardPanel = panels[0] as HTMLElement;
    const practicePanel = panels[1] as HTMLElement;

    expect(dashboardPanel.textContent).toContain("Dashboard content");
    expect(dashboardPanel.style.display).not.toBe("none");

    expect(practicePanel.textContent).toContain("Practice content");
    expect(practicePanel.style.display).toBe("none");
  });
});
