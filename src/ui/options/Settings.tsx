import styles from "./Settings.module.css";

export interface UserSettings {
  /** When true, the "Custom Passage → Active browser tab" destination is available on the Practice tab. */
  advancedModeEnabled: boolean;
  /** When true, the UI uses a dark color scheme. */
  darkMode: boolean;
}

export interface SettingsProps {
  /** Current settings values (controlled). */
  settings: UserSettings;
  /** Called immediately when any setting changes. Parent is responsible for persisting via chrome.storage.local. */
  onChange: (settings: UserSettings) => void;
}

/**
 * Settings tab — profile settings, Advanced Mode toggle, dark mode preference.
 *
 * Fully controlled: receives current settings as props and calls onChange on
 * every user interaction. The parent (Options) owns persistence via chrome.storage.local.
 */
export function Settings(props: SettingsProps) {
  const { settings, onChange } = props;

  const handleAdvancedModeChange = () => {
    onChange({ ...settings, advancedModeEnabled: !settings.advancedModeEnabled });
  };

  const handleDarkModeChange = () => {
    onChange({ ...settings, darkMode: !settings.darkMode });
  };

  return (
    <div className={styles.container}>
      <h2>Settings</h2>

      {/* Advanced Mode */}
      <div className={styles.settingRow}>
        <div className={styles.settingInfo}>
          <label htmlFor="setting-advanced-mode" className={styles.settingLabel}>
            Advanced Mode
          </label>
          <p className={styles.settingDescription}>
            Enables custom passage input and the active browser tab destination on the Practice tab.
          </p>
        </div>
        <div className={styles.toggleWrapper}>
          <input
            type="checkbox"
            id="setting-advanced-mode"
            checked={settings.advancedModeEnabled}
            onChange={handleAdvancedModeChange}
            className={styles.checkbox}
          />
        </div>
      </div>

      {/* Dark Mode */}
      <div className={styles.settingRow}>
        <div className={styles.settingInfo}>
          <label htmlFor="setting-dark-mode" className={styles.settingLabel}>
            Dark Mode
          </label>
          <p className={styles.settingDescription}>
            Switch the extension UI to a dark color scheme.
          </p>
        </div>
        <div className={styles.toggleWrapper}>
          <input
            type="checkbox"
            id="setting-dark-mode"
            checked={settings.darkMode}
            onChange={handleDarkModeChange}
            className={styles.checkbox}
          />
        </div>
      </div>
    </div>
  );
}
