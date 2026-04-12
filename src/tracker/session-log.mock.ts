/**
 * In-memory mock implementation of session-log for testing.
 *
 * This provides the same interface as session-log.ts but stores data
 * in a simple array instead of Dexie/IndexedDB, suitable for unit tests.
 */

export interface SessionRecord {
  id?: number;
  startTime: number;
  endTime: number;
  durationMs: number;
  sourceText: string;
  charCount: number;
  errorCount: number;
  wpm: number;
  accuracy: number;
  destination: "in-app" | "gdocs" | string;
  createdAt: Date;
}

let _sessions: SessionRecord[] = [];
let _nextId = 1;

/**
 * Clear all sessions (for testing).
 */
export async function clearSessions(): Promise<void> {
  _sessions = [];
  _nextId = 1;
}

/**
 * Insert a new session record.
 */
export async function insertSession(
  record: Omit<SessionRecord, "id" | "createdAt">,
): Promise<number> {
  const id = _nextId++;
  const session: SessionRecord = {
    ...record,
    id,
    createdAt: new Date(),
  };
  _sessions.push(session);
  return id;
}

/**
 * Get all sessions in reverse chronological order.
 */
export async function getAllSessions(): Promise<SessionRecord[]> {
  return [..._sessions].reverse();
}

/**
 * Get aggregate stats from all sessions.
 */
export async function getStatsSnapshot(): Promise<{
  totalSessions: number;
  totalCharsTyped: number;
  averageWpm: number;
  averageAccuracy: number;
  bestWpm: number;
}> {
  if (_sessions.length === 0) {
    return {
      totalSessions: 0,
      totalCharsTyped: 0,
      averageWpm: 0,
      averageAccuracy: 0,
      bestWpm: 0,
    };
  }

  const totalSessions = _sessions.length;
  const totalCharsTyped = _sessions.reduce((sum, s) => sum + s.charCount, 0);
  const averageWpm =
    _sessions.reduce((sum, s) => sum + s.wpm, 0) / _sessions.length;
  const averageAccuracy =
    _sessions.reduce((sum, s) => sum + s.accuracy, 0) / _sessions.length;
  const bestWpm = Math.max(..._sessions.map((s) => s.wpm));

  return {
    totalSessions,
    totalCharsTyped,
    averageWpm,
    averageAccuracy,
    bestWpm,
  };
}

/**
 * Get a session by ID from the mock storage.
 */
async function getSession(id: number): Promise<SessionRecord | undefined> {
  return _sessions.find((s) => s.id === id);
}

/**
 * Mock db object for test compatibility
 */
export const db = {
  sessions: {
    clear: clearSessions,
    get: getSession,
  },
};
