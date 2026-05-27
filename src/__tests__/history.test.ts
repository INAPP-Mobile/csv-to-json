import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  addEntry,
  togglePin,
  deleteEntry,
  clearHistory,
  getDisplayHistory,
  getHistory,
  type HistoryEntry,
} from "@/lib/history";

const HISTORY_STORAGE_KEY = "csv-history";

function createStorage(): Record<string, string> {
  return {};
}

let storage: Record<string, string>;

beforeEach(() => {
  storage = createStorage();

  vi.stubGlobal("window", {});
  vi.stubGlobal("crypto", {
    randomUUID: vi.fn(() => "test-uuid"),
  });
  vi.stubGlobal("Date", Date);
  vi.spyOn(Date, "now").mockReturnValue(1_000_000_000_000);
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key: string) => storage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      storage = createStorage();
    }),
  });
});

function loadFromStorage(): HistoryEntry[] {
  const raw = storage[HISTORY_STORAGE_KEY];
  return raw ? JSON.parse(raw) : [];
}

describe("history", () => {
  it("addEntry adds an entry and enforces max 100", () => {
    const entries = addEntry("a", "csv-to-json", '[{"a":"YQ=="}]');
    expect(loadFromStorage()).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      input: "a",
      mode: "csv-to-json",
      output: '[{"a":"YQ=="}]',
      pinned: false,
    });

    for (let i = 0; i < 150; i++) {
      addEntry(String(i), "csv-to-json", String(i));
    }
    expect(loadFromStorage()).toHaveLength(100);
  });

  it("togglePin pins an entry and enforces max 10 pins", () => {
    const ids: string[] = [];
    for (let i = 0; i < 11; i++) {
      vi.mocked(crypto.randomUUID).mockReturnValueOnce(`id-${i}`);
      const entries = addEntry(String(i), "csv-to-json", String(i));
      ids.push(entries[0].id);
    }

    for (let i = 0; i < 10; i++) {
      const result = togglePin(ids[i]);
      expect(result.limitReached).toBe(false);
    }

    const pinned = loadFromStorage().filter((e) => e.pinned);
    expect(pinned).toHaveLength(10);
  });

  it("togglePin returns limitReached: true when over 10 pins", () => {
    const ids: string[] = [];
    for (let i = 0; i < 11; i++) {
      vi.mocked(crypto.randomUUID).mockReturnValueOnce(`id-${i}`);
      const entries = addEntry(String(i), "csv-to-json", String(i));
      ids.push(entries[0].id);
    }

    for (let i = 0; i < 10; i++) {
      togglePin(ids[i]);
    }

    const result = togglePin(ids[10]);
    expect(result.limitReached).toBe(true);

    const pinned = loadFromStorage().filter((e) => e.pinned);
    expect(pinned).toHaveLength(10);
  });

  it("deleteEntry removes an entry by id", () => {
    vi.mocked(crypto.randomUUID).mockReturnValue("keep");
    addEntry("keep", "csv-to-json", "a");
    vi.mocked(crypto.randomUUID).mockReturnValue("remove");
    addEntry("remove", "csv-to-json", "b");

    const updated = deleteEntry("remove");
    expect(updated.every((e) => e.id !== "remove")).toBe(true);
    expect(loadFromStorage().every((e) => e.id !== "remove")).toBe(true);
  });

  it("clearHistory clears all entries", () => {
    addEntry("a", "csv-to-json", '[{"a":"YQ=="}]');
    addEntry("b", "json-to-csv", "a,b\n1,2");

    const result = clearHistory();
    expect(result).toEqual([]);
    expect(loadFromStorage()).toEqual([]);
  });

  it("getDisplayHistory returns pinned entries before unpinned", () => {
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) {
      vi.mocked(crypto.randomUUID).mockReturnValueOnce(`id-${i}`);
      const entries = addEntry(String(i), "csv-to-json", String(i));
      ids.push(entries[0].id);
    }

    togglePin(ids[2]);
    togglePin(ids[4]);

    const display = getDisplayHistory();
    expect(display[0].id).toBe("id-4");
    expect(display[1].id).toBe("id-2");
    expect(display.slice(2).every((e) => !e.pinned)).toBe(true);
  });

  it("getHistory returns empty array when localStorage has null/corrupt data", () => {
    expect(getHistory()).toEqual([]);

    storage[HISTORY_STORAGE_KEY] = "{invalid-json}";
    expect(getHistory()).toEqual([]);

    storage[HISTORY_STORAGE_KEY] = '"string"';
    expect(getHistory()).toEqual([]);
  });
});
