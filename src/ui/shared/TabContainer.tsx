import { VNode } from "preact";
import styles from "./TabContainer.module.css";

export interface TabContainerProps {
  /** Array of tab names (e.g., ["Dashboard", "Practice", "Stats", "Settings"]) */
  tabs: string[];
  /** Currently active tab (lowercase, e.g., "dashboard") */
  activeTab: string;
  /** Called when tab selection changes with normalized name (lowercase) */
  onChange: (tab: string) => void;
  /** Optional children for tab panel content */
  children?: VNode[];
}

/**
 * Accessible tab container with keyboard navigation.
 *
 * Features:
 * - ARIA-compliant (role="tablist", role="tab", role="tabpanel")
 * - Keyboard navigation: Left/Right arrow keys with wraparound
 * - Auto-activate on focus
 * - Manages active tab state and renders corresponding panel content
 *
 * Usage:
 * ```tsx
 * <TabContainer
 *   tabs={["Dashboard", "Practice", "Stats"]}
 *   activeTab="dashboard"
 *   onChange={(tab) => setActiveTab(tab)}
 * >
 *   <div>Dashboard content</div>
 *   <div>Practice content</div>
 *   <div>Stats content</div>
 * </TabContainer>
 * ```
 */
export function TabContainer(props: TabContainerProps) {
  const { tabs, activeTab, onChange, children = [] } = props;

  const activeTabIndex = tabs.findIndex(
    (tab) => tab.toLowerCase() === activeTab
  );

  const handleTabClick = (tab: string) => {
    onChange(tab.toLowerCase());
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      let newIndex = activeTabIndex;

      if (e.key === "ArrowRight") {
        newIndex = (activeTabIndex + 1) % tabs.length;
      } else if (e.key === "ArrowLeft") {
        newIndex = (activeTabIndex - 1 + tabs.length) % tabs.length;
      }

      e.preventDefault();
      onChange(tabs[newIndex].toLowerCase());
    }
  };

  return (
    <div className={styles.container}>
      {/* Tab buttons */}
      <div role="tablist" className={styles.tablist} onKeyDown={handleKeyDown}>
        {tabs.map((tab) => {
          const tabId = `tab-${tab.toLowerCase()}`;
          const isActive = tab.toLowerCase() === activeTab;

          return (
            <button
              key={tab}
              id={tabId}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.toLowerCase()}`}
              tabIndex={isActive ? 0 : -1}
              className={`${styles.tab} ${isActive ? styles.active : ""}`}
              onClick={() => handleTabClick(tab)}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      <div className={styles.panels}>
        {tabs.map((tab, index) => {
          const isActive = tab.toLowerCase() === activeTab;
          const panelId = `panel-${tab.toLowerCase()}`;

          return (
            <div
              key={tab}
              id={panelId}
              role="tabpanel"
              aria-labelledby={`tab-${tab.toLowerCase()}`}
              className={styles.panel}
              style={{ display: isActive ? "block" : "none" }}
            >
              {children[index] || null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
