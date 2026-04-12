// Mock rank data (will be replaced with real tracker data later)
const MOCK_CURRENT_RANK = {
  tier: 1,
  name: "Hunt & Peck",
  emoji: "🐾",
};

const MOCK_CURRENT_XP = 250;
const MOCK_NEXT_RANK_XP = 500;

export function Popup() {
  const handleStartPractice = () => {
    // TODO: open options page to practice area
  };

  return (
    <main style={{ padding: "16px", minWidth: "260px", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: "16px", margin: "0 0 12px 0", fontWeight: 600 }}>
        Flying Fingers
      </h1>

      {/* Rank display */}
      <div
        style={{
          padding: "12px",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
          marginBottom: "12px",
        }}
      >
        <div style={{ fontSize: "24px", marginBottom: "4px" }}>
          {MOCK_CURRENT_RANK.emoji}
        </div>
        <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
          {MOCK_CURRENT_RANK.name}
        </div>

        {/* XP progress */}
        <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
          {MOCK_CURRENT_XP} / {MOCK_NEXT_RANK_XP} XP
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: "100%",
            height: "6px",
            backgroundColor: "#e0e0e0",
            borderRadius: "3px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${(MOCK_CURRENT_XP / MOCK_NEXT_RANK_XP) * 100}%`,
              height: "100%",
              backgroundColor: "#4CAF50",
            }}
          />
        </div>
      </div>

      {/* Start Practice button */}
      <button
        onClick={handleStartPractice}
        style={{
          width: "100%",
          padding: "10px 12px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "6px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Start Practice
      </button>
    </main>
  );
}
