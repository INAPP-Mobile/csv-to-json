export interface HistoryEntry {
  id: string;
  timestamp: number;
  mode: string;
  input: string;
  output: string;
  pinned: boolean;
}

const HISTORY_STORAGE_KEY = "csv-history";
const MAX_HISTORY = 100;
const MAX_PINNED = 10;

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage full
  }
}

export function addEntry(input: string, mode: string, output: string): HistoryEntry[] {
  const history = getHistory();
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    mode,
    input,
    output,
    pinned: false,
  };
  const updated = [entry, ...history].slice(0, MAX_HISTORY);
  saveHistory(updated);
  return updated;
}

export function deleteEntry(id: string): HistoryEntry[] {
  const history = getHistory();
  const updated = history.filter((e) => e.id !== id);
  saveHistory(updated);
  return updated;
}

export function clearHistory(): HistoryEntry[] {
  saveHistory([]);
  return [];
}

export function togglePin(id: string): { entries: HistoryEntry[]; limitReached: boolean } {
  const history = getHistory();
  const entry = history.find((e) => e.id === id);
  if (!entry) return { entries: history, limitReached: false };

  if (!entry.pinned) {
    const pinnedCount = history.filter((e) => e.pinned).length;
    if (pinnedCount >= MAX_PINNED) return { entries: history, limitReached: true };
  }

  const updated = history.map((e) =>
    e.id === id ? { ...e, pinned: !e.pinned } : e
  );
  saveHistory(updated);
  return { entries: updated, limitReached: false };
}

export function getDisplayHistory(): HistoryEntry[] {
  const history = getHistory();
  const pinned = history.filter((e) => e.pinned);
  const unpinned = history.filter((e) => !e.pinned);
  return [...pinned, ...unpinned];
}
