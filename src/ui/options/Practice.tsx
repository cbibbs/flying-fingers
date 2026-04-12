import { useState } from "preact/hooks";
import { estimateSessionDuration } from "../../engine/estimator";
import { getAllPassages, getPassageById } from "../../tracker/passages";
import styles from "./Practice.module.css";

export interface PracticeStartConfig {
  passageId: string;
  destination: "in-app" | "active-tab";
}

export interface PracticeProps {
  /** Whether Advanced Mode is enabled (gates "Active browser tab" destination). */
  advancedModeEnabled: boolean;

  /** Called when user clicks Start button with selected passage and destination. */
  onStart: (config: PracticeStartConfig) => void;
}

/**
 * Practice tab — select a passage and destination, then start typing.
 *
 * Features:
 * - Built-in passages dropdown (at least 8 passages)
 * - Destination selector: "In-app trainer" (always) and "Active browser tab" (if Advanced Mode)
 * - Time estimate for selected passage
 * - Start button triggers onStart callback
 *
 * Note: In the MVP, Advanced Mode is mocked. In the full implementation,
 * it will be read from chrome.storage.local by the parent Options component.
 */
export function Practice(props: PracticeProps) {
  const { advancedModeEnabled, onStart } = props;
  const passages = getAllPassages();
  const defaultPassageId = passages.length > 0 ? passages[0].id : "";

  const [selectedPassageId, setSelectedPassageId] = useState(defaultPassageId);
  const [selectedDestination, setSelectedDestination] = useState<
    "in-app" | "active-tab"
  >("in-app");

  const selectedPassage = getPassageById(selectedPassageId);

  // Calculate time estimate in minutes
  const timeEstimateMs = selectedPassage
    ? estimateSessionDuration({
        sourceText: selectedPassage.text,
        medianMs: 100, // typical fast typist (~600 WPM)
        sigmaMs: 30,
        rng: Math.random,
      })
    : 0;

  const timeEstimateMinutes = Math.ceil(timeEstimateMs / 1000 / 60);

  const handleStart = () => {
    onStart({
      passageId: selectedPassageId,
      destination: selectedDestination,
    });
  };

  return (
    <div className={styles.container}>
      <h2>Practice</h2>

      {/* Passage selector */}
      <div className={styles.section}>
        <label htmlFor="passage-select" className={styles.label}>
          Select a passage
        </label>
        <select
          id="passage-select"
          value={selectedPassageId}
          onChange={(e) => setSelectedPassageId(e.currentTarget.value)}
          className={styles.select}
        >
          <option value="" disabled>
            Choose a passage...
          </option>
          {passages.map((passage) => (
            <option key={passage.id} value={passage.id}>
              {passage.name} ({passage.difficulty})
            </option>
          ))}
        </select>
      </div>

      {/* Passage preview */}
      {selectedPassage && (
        <div className={styles.preview}>
          <p className={styles.previewText}>{selectedPassage.text}</p>
        </div>
      )}

      {/* Destination selector */}
      <div className={styles.section}>
        <div className={styles.label}>Destination</div>
        <div className={styles.destinationOptions}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="destination"
              value="in-app"
              checked={selectedDestination === "in-app"}
              onChange={() => setSelectedDestination("in-app")}
            />
            In-app trainer
          </label>

          {advancedModeEnabled && (
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="destination"
                value="active-tab"
                checked={selectedDestination === "active-tab"}
                onChange={() => setSelectedDestination("active-tab")}
              />
              Active browser tab
            </label>
          )}
        </div>
      </div>

      {/* Time estimate */}
      {selectedPassage && (
        <div className={styles.timeEstimate}>
          <span className={styles.timeLabel}>Estimated time:</span>
          <span className={styles.timeValue}>
            {timeEstimateMinutes} min
          </span>
        </div>
      )}

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={!selectedPassage}
        className={styles.startButton}
      >
        Start
      </button>
    </div>
  );
}
