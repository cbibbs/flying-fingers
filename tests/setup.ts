/**
 * Global test setup for Vitest.
 *
 * Initializes fake-indexeddb so that Dexie works in jsdom tests.
 */

import FakeIndexedDB from "fake-indexeddb";

// Polyfill IndexedDB in the jsdom environment
(global as any).indexedDB = FakeIndexedDB;
