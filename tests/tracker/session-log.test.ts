import { describe, expect, it, beforeEach, afterEach } from "vitest";
import * as sessionLog from "../../src/tracker/session-log.mock";
import type { SessionRecord } from "../../src/tracker/session-log";

const db = sessionLog.db as any;
const { insertSession, getAllSessions, getStatsSnapshot, clearSessions } = sessionLog;

describe("session-log — Dexie schema + session recording", () => {
  beforeEach(async () => {
    // Clear the database before each test
    await clearSessions();
  });

  afterEach(async () => {
    // Clean up after each test
    await clearSessions();
  });

  describe("SessionRecord interface", () => {
    it("defines a session with required properties", () => {
      const record: SessionRecord = {
        id: undefined,
        startTime: Date.now(),
        endTime: Date.now() + 5000,
        durationMs: 5000,
        sourceText: "hello world",
        charCount: 11,
        errorCount: 1,
        wpm: 132,
        accuracy: 0.909,
        destination: "in-app",
        createdAt: new Date(),
      };
      expect(record.charCount).toBe(11);
      expect(record.wpm).toBeGreaterThan(0);
      expect(record.accuracy).toBeLessThanOrEqual(1);
    });
  });

  describe("insertSession()", () => {
    it("inserts a session and returns an id", async () => {
      const record: Omit<SessionRecord, "id" | "createdAt"> = {
        startTime: Date.now(),
        endTime: Date.now() + 5000,
        durationMs: 5000,
        sourceText: "hello world",
        charCount: 11,
        errorCount: 1,
        wpm: 132,
        accuracy: 0.909,
        destination: "in-app",
      };
      const id = await insertSession(record);
      expect(id).toBeGreaterThan(0);
    });

    it("persists session data", async () => {
      const record: Omit<SessionRecord, "id" | "createdAt"> = {
        startTime: 1000,
        endTime: 6000,
        durationMs: 5000,
        sourceText: "test passage",
        charCount: 12,
        errorCount: 0,
        wpm: 144,
        accuracy: 1.0,
        destination: "gdocs",
      };
      const id = await insertSession(record);
      const stored = await db.sessions.get(id);
      expect(stored).toBeDefined();
      expect(stored?.charCount).toBe(12);
      expect(stored?.wpm).toBe(144);
      expect(stored?.accuracy).toBe(1.0);
      expect(stored?.destination).toBe("gdocs");
    });

    it("sets createdAt to current time", async () => {
      const beforeInsert = Date.now();
      const record: Omit<SessionRecord, "id" | "createdAt"> = {
        startTime: Date.now(),
        endTime: Date.now() + 5000,
        durationMs: 5000,
        sourceText: "test",
        charCount: 4,
        errorCount: 0,
        wpm: 48,
        accuracy: 1.0,
        destination: "in-app",
      };
      const id = await insertSession(record);
      const afterInsert = Date.now();
      const stored = await db.sessions.get(id);
      expect(stored?.createdAt).toBeDefined();
      expect(stored!.createdAt.getTime()).toBeGreaterThanOrEqual(beforeInsert);
      expect(stored!.createdAt.getTime()).toBeLessThanOrEqual(afterInsert);
    });
  });

  describe("getAllSessions()", () => {
    it("returns empty array when no sessions exist", async () => {
      const sessions = await getAllSessions();
      expect(sessions).toEqual([]);
    });

    it("returns all sessions in reverse chronological order (newest first)", async () => {
      const now = Date.now();
      await insertSession({
        startTime: now - 20000,
        endTime: now - 15000,
        durationMs: 5000,
        sourceText: "first",
        charCount: 5,
        errorCount: 0,
        wpm: 60,
        accuracy: 1.0,
        destination: "in-app",
      });

      await insertSession({
        startTime: now - 10000,
        endTime: now - 5000,
        durationMs: 5000,
        sourceText: "second",
        charCount: 6,
        errorCount: 0,
        wpm: 72,
        accuracy: 1.0,
        destination: "in-app",
      });

      const sessions = await getAllSessions();
      expect(sessions).toHaveLength(2);
      expect(sessions[0].charCount).toBe(6); // newest first
      expect(sessions[1].charCount).toBe(5); // oldest second
    });
  });

  describe("getStatsSnapshot()", () => {
    it("returns zero stats when no sessions exist", async () => {
      const stats = await getStatsSnapshot();
      expect(stats.totalSessions).toBe(0);
      expect(stats.totalCharsTyped).toBe(0);
      expect(stats.averageWpm).toBe(0);
      expect(stats.averageAccuracy).toBe(0);
      expect(stats.bestWpm).toBe(0);
    });

    it("calculates correct stats from multiple sessions", async () => {
      await insertSession({
        startTime: Date.now(),
        endTime: Date.now() + 5000,
        durationMs: 5000,
        sourceText: "hello",
        charCount: 5,
        errorCount: 0,
        wpm: 60,
        accuracy: 1.0,
        destination: "in-app",
      });

      await insertSession({
        startTime: Date.now(),
        endTime: Date.now() + 5000,
        durationMs: 5000,
        sourceText: "world test",
        charCount: 10,
        errorCount: 1,
        wpm: 120,
        accuracy: 0.9,
        destination: "gdocs",
      });

      const stats = await getStatsSnapshot();
      expect(stats.totalSessions).toBe(2);
      expect(stats.totalCharsTyped).toBe(15);
      expect(stats.averageWpm).toBe(90); // (60 + 120) / 2
      expect(stats.averageAccuracy).toBe(0.95); // (1.0 + 0.9) / 2
      expect(stats.bestWpm).toBe(120);
    });

    it("handles single session stats correctly", async () => {
      await insertSession({
        startTime: Date.now(),
        endTime: Date.now() + 10000,
        durationMs: 10000,
        sourceText: "precision test",
        charCount: 14,
        errorCount: 2,
        wpm: 84,
        accuracy: 0.857,
        destination: "in-app",
      });

      const stats = await getStatsSnapshot();
      expect(stats.totalSessions).toBe(1);
      expect(stats.totalCharsTyped).toBe(14);
      expect(stats.averageWpm).toBe(84);
      expect(stats.averageAccuracy).toBeCloseTo(0.857, 2);
      expect(stats.bestWpm).toBe(84);
    });
  });
});
