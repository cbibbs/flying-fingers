/**
 * Session tracking using Dexie (IndexedDB wrapper).
 *
 * Records each real-user typing session (or simulated practice session)
 * with WPM, accuracy, and metadata. Data persists across browser sessions
 * and is used by the observer (to record real keystrokes) and the
 * dashboard (to display stats and progress).
 */

import Dexie, { type Table } from "dexie";

/**
 * A single typing session record.
 *
 * Sessions are created by:
 * - The observer content script (recording real user keystrokes)
 * - The practice engine (recording a simulated typing session)
 *
 * All times are millisecond timestamps; accuracy is in [0, 1].
 */
export interface SessionRecord {
  /** Auto-incremented database ID. */
  id?: number;

  /** Millisecond timestamp when the session started. */
  startTime: number;

  /** Millisecond timestamp when the session ended. */
  endTime: number;

  /** Elapsed time in milliseconds (for convenience/verification). */
  durationMs: number;

  /** The text that was typed (source material or observed keystrokes). */
  sourceText: string;

  /** Total characters typed in this session. */
  charCount: number;

  /** Number of characters that required correction. */
  errorCount: number;

  /** Words per minute achieved in this session. */
  wpm: number;

  /** Accuracy as a fraction in [0, 1] (correctChars / totalChars). */
  accuracy: number;

  /** Destination: "in-app" (practice area), "gdocs", or other adapter name. */
  destination: "in-app" | "gdocs" | string;

  /** Timestamp when this record was created (always in the past). */
  createdAt: Date;
}

/**
 * Dexie database instance with sessions table.
 */
class SessionLogDatabase extends Dexie {
  sessions!: Table<SessionRecord>;

  constructor() {
    super("flying-fingers");
    this.version(1).stores({
      sessions: "++id, startTime, createdAt",
    });
  }
}

// Create the database instance immediately
// In tests, fake-indexeddb is set up in setup.ts before modules are loaded
export const db = new SessionLogDatabase();

/**
 * Insert a new session record into the database.
 *
 * @param record - Session data (without id and createdAt, which are generated)
 * @returns The auto-generated session ID
 */
export async function insertSession(
  record: Omit<SessionRecord, "id" | "createdAt">,
): Promise<number> {
  const id = await db.sessions.add({
    ...record,
    createdAt: new Date(),
  });
  return id;
}

/**
 * Retrieve all sessions, sorted by creation time (newest first).
 *
 * @returns Array of all session records
 */
export async function getAllSessions(): Promise<SessionRecord[]> {
  const sessions = await db.sessions.orderBy("createdAt").reverse().toArray();
  return sessions;
}

/**
 * Aggregate statistics from all sessions.
 *
 * Used by the dashboard to display overall metrics.
 *
 * @returns Object with totalSessions, totalCharsTyped, averageWpm,
 *          averageAccuracy, and bestWpm
 */
export async function getStatsSnapshot(): Promise<{
  totalSessions: number;
  totalCharsTyped: number;
  averageWpm: number;
  averageAccuracy: number;
  bestWpm: number;
}> {
  const sessions = await db.sessions.toArray();

  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalCharsTyped: 0,
      averageWpm: 0,
      averageAccuracy: 0,
      bestWpm: 0,
    };
  }

  const totalSessions = sessions.length;
  const totalCharsTyped = sessions.reduce((sum, s) => sum + s.charCount, 0);
  const averageWpm =
    sessions.reduce((sum, s) => sum + s.wpm, 0) / sessions.length;
  const averageAccuracy =
    sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length;
  const bestWpm = Math.max(...sessions.map((s) => s.wpm));

  return {
    totalSessions,
    totalCharsTyped,
    averageWpm,
    averageAccuracy,
    bestWpm,
  };
}
