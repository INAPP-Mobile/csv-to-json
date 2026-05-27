"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Script from "next/script";
import {
  ClipboardPaste,
  Copy,
  Check,
  Download,
  Trash2,
  Upload,
  Star,
  History as HistoryIcon,
  Clock,
} from "lucide-react";
import { toast } from "react-toastify";

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

import {
  HistoryEntry,
  getHistory,
  addEntry,
  deleteEntry,
  clearHistory,
  togglePin,
} from "@/lib/history";
import { csvToJson, jsonToCsv } from "@/lib/csv";

const firebaseConfig = {
  apiKey: "AIzaSyBTFYW79t3Hd8ldCfc6tw6VFG34FjsjGgU",
  authDomain: "freeq-one.firebaseapp.com",
  projectId: "freeq-one",
  storageBucket: "freeq-one.firebasestorage.app",
  messagingSenderId: "905128076747",
  appId: "1:905128076747:web:5c7e293432301f611b824e",
  measurementId: "G-DT3XNM6TPG",
};

const app = initializeApp(firebaseConfig);
export { app };

type Mode = "csv-to-json" | "json-to-csv";
type DelimiterOption = "comma" | "tab" | "pipe" | "semicolon" | "custom";

const DELIMITER_MAP: Record<DelimiterOption, string> = {
  comma: ",",
  tab: "\t",
  pipe: "|",
  semicolon: ";",
  custom: "",
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + "...";
}

const INPUT_STORAGE_KEY = "csv-input";
const MODE_STORAGE_KEY = "csv-mode";
const DELIMITER_STORAGE_KEY = "csv-delimiter";
const HEADERS_STORAGE_KEY = "csv-headers";

export default function Home() {
  const [input, setInput] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem(INPUT_STORAGE_KEY) || "";
      } catch {
        return "";
      }
    }
    return "";
  });
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window !== "undefined") {
      try {
        return (localStorage.getItem(MODE_STORAGE_KEY) as Mode) || "csv-to-json";
      } catch {
        return "csv-to-json";
      }
    }
    return "csv-to-json";
  });
  const [delimiterOption, setDelimiterOption] = useState<DelimiterOption>(
    () => {
      if (typeof window !== "undefined") {
        try {
          return (
            (localStorage.getItem(DELIMITER_STORAGE_KEY) as DelimiterOption) ||
            "comma"
          );
        } catch {
          return "comma";
        }
      }
      return "comma";
    }
  );
  const [customDelimiter, setCustomDelimiter] = useState("");
  const [useHeaders, setUseHeaders] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const val = localStorage.getItem(HEADERS_STORAGE_KEY);
        return val !== null ? val === "true" : true;
      } catch {
        return true;
      }
    }
    return true;
  });
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    if (typeof window !== "undefined") {
      try {
        return getHistory();
      } catch {
        return [];
      }
    }
    return [];
  });
  const lastRecordedRef = useRef<string>("");

  useEffect(() => {
    getAnalytics(app);
  }, []);

  const delimiter = useMemo(() => {
    if (delimiterOption === "custom") return customDelimiter;
    return DELIMITER_MAP[delimiterOption];
  }, [delimiterOption, customDelimiter]);

  const persistInput = useCallback((val: string) => {
    setInput(val);
    try {
      localStorage.setItem(INPUT_STORAGE_KEY, val);
    } catch {
      // storage full
    }
  }, []);

  const persistMode = useCallback((m: Mode) => {
    setMode(m);
    try {
      localStorage.setItem(MODE_STORAGE_KEY, m);
    } catch {
      // storage full
    }
  }, []);

  const persistDelimiterOption = useCallback((d: DelimiterOption) => {
    setDelimiterOption(d);
    try {
      localStorage.setItem(DELIMITER_STORAGE_KEY, d);
    } catch {
      // storage full
    }
  }, []);

  const persistUseHeaders = useCallback((h: boolean) => {
    setUseHeaders(h);
    try {
      localStorage.setItem(HEADERS_STORAGE_KEY, String(h));
    } catch {
      // storage full
    }
  }, []);

  const output = useMemo(() => {
    if (!input) return "";
    try {
      if (mode === "csv-to-json") {
        const parsed = csvToJson(input, delimiter, useHeaders);
        return JSON.stringify(parsed, null, 2);
      } else {
        return jsonToCsv(input, delimiter, useHeaders);
      }
    } catch {
      return null;
    }
  }, [input, mode, delimiter, useHeaders]);

  const outputError = useMemo(() => output === null, [output]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      persistInput(text);
      toast.success("Pasted from clipboard");
    } catch {
      toast.error("Failed to read clipboard");
    }
  }, [persistInput]);

  const handleCopy = useCallback(async () => {
    if (!output || typeof output !== "string") return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  }, [output]);

  const handleClear = useCallback(() => {
    persistInput("");
    toast.success("Cleared");
  }, [persistInput]);

  const handleDownload = useCallback(() => {
    if (!output || typeof output !== "string") return;
    const ext = mode === "csv-to-json" ? ".json" : ".csv";
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `output${ext}`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded as output" + ext);
  }, [output, mode]);

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result;
        if (typeof result === "string") {
          persistInput(result);
        }
        toast.success(`Loaded "${file.name}"`);
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [persistInput]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result;
        if (typeof result === "string") {
          persistInput(result);
        }
        toast.success(`Loaded "${file.name}"`);
      };
      reader.readAsText(file);
    },
    [persistInput]
  );

  const inputSize = useMemo(
    () => new TextEncoder().encode(input).length,
    [input]
  );

  const outputSize = useMemo(() => {
    if (!output || typeof output !== "string") return 0;
    return new TextEncoder().encode(output).length;
  }, [output]);

  const inputLines = useMemo(() => {
    if (!input) return 0;
    return (input.match(/\n/g) || []).length + 1;
  }, [input]);

  const outputLines = useMemo(() => {
    if (!output || typeof output !== "string") return 0;
    return (output.match(/\n/g) || []).length + 1;
  }, [output]);

  useEffect(() => {
    if (output && typeof output === "string") {
      const key = `${input}::${mode}::${delimiter}::${useHeaders}`;
      if (key !== lastRecordedRef.current) {
        lastRecordedRef.current = key;
        const updated = addEntry(input, mode, output);
        setHistory(updated);
      }
    }
  }, [output, input, mode, delimiter, useHeaders]);

  const displayHistory = useMemo(() => {
    const pinned = history.filter((e) => e.pinned);
    const unpinned = history.filter((e) => !e.pinned);
    return [...pinned, ...unpinned];
  }, [history]);

  const handleHistoryLoad = useCallback(
    (entry: HistoryEntry) => {
      persistInput(entry.input);
      persistMode(entry.mode as Mode);
      lastRecordedRef.current = `${entry.input}::${entry.mode}::${delimiter}::${useHeaders}`;
    },
    [persistInput, persistMode, delimiter, useHeaders]
  );

  const handleHistoryTogglePin = useCallback((id: string) => {
    const result = togglePin(id);
    setHistory(result.entries);
    if (result.limitReached) {
      toast.warning("Maximum 10 pinned items");
    }
  }, []);

  const handleHistoryDelete = useCallback((id: string) => {
    const updated = deleteEntry(id);
    setHistory(updated);
  }, []);

  const handleHistoryClear = useCallback(() => {
    const updated = clearHistory();
    setHistory(updated);
    toast.success("History cleared");
  }, []);

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2 text-center">
          CSV to JSON Converter
        </h1>
        <p className="text-center text-gray-400 mb-8 text-sm">
          Convert between CSV and JSON formats
        </p>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => persistMode("csv-to-json")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "csv-to-json"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              CSV → JSON
            </button>
            <button
              onClick={() => persistMode("json-to-csv")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "json-to-csv"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              JSON → CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {mode === "csv-to-json" ? "CSV Input" : "JSON Input"}
              </h2>
              <div className="flex gap-1.5">
                <button
                  onClick={handlePaste}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 transition-colors"
                >
                  <ClipboardPaste size={14} />
                  Paste
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 transition-colors"
                >
                  <Upload size={14} />
                  File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,.tsv,.txt"
                  onChange={handleFile}
                  className="hidden"
                />
                <button
                  onClick={handleClear}
                  disabled={!input}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs text-gray-300 transition-colors"
                >
                  <Trash2 size={14} />
                  Clear
                </button>
              </div>
            </div>

            <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
              <textarea
                value={input}
                onChange={(e) => persistInput(e.target.value)}
                placeholder={
                  mode === "csv-to-json"
                    ? "Paste your CSV data here..."
                    : "Paste your JSON data here..."
                }
                rows={12}
                className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                spellCheck={false}
              />
            </div>

            {/* Delimiter & Headers */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">Delimiter:</label>
                <div className="flex bg-gray-800 rounded-lg p-0.5">
                  {(
                    ["comma", "tab", "pipe", "semicolon"] as DelimiterOption[]
                  ).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => persistDelimiterOption(opt)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        delimiterOption === opt
                          ? "bg-blue-600 text-white"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {opt === "comma"
                        ? ","
                        : opt === "tab"
                          ? "\\t"
                          : opt === "pipe"
                            ? "|"
                            : ";"}
                    </button>
                  ))}
                  <button
                    onClick={() => persistDelimiterOption("custom")}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      delimiterOption === "custom"
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Custom
                  </button>
                </div>
                {delimiterOption === "custom" && (
                  <input
                    type="text"
                    value={customDelimiter}
                    onChange={(e) => setCustomDelimiter(e.target.value)}
                    className="w-12 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    maxLength={2}
                  />
                )}
              </div>
              <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useHeaders}
                  onChange={(e) => persistUseHeaders(e.target.checked)}
                  className="accent-blue-500"
                />
                {mode === "csv-to-json"
                  ? "First row as headers"
                  : "Include headers"}
              </label>
            </div>

            <div className="flex justify-between text-xs text-gray-500">
              <span>{inputSize.toLocaleString()} bytes</span>
              <span>{inputLines > 0 ? `${inputLines} lines` : ""}</span>
            </div>
          </div>

          {/* Output Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {mode === "csv-to-json" ? "JSON Output" : "CSV Output"}
              </h2>
              <div className="flex items-center gap-2">
                {output && typeof output === "string" && (
                  <span className="inline-flex items-center px-2 py-0.5 bg-green-900/50 text-green-400 text-xs font-medium rounded-full border border-green-800">
                    Success
                  </span>
                )}
                {outputError && input && (
                  <span className="inline-flex items-center px-2 py-0.5 bg-red-900/50 text-red-400 text-xs font-medium rounded-full border border-red-800">
                    Error
                  </span>
                )}
              </div>
            </div>

            <div className="min-h-[320px] bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
              {!input && (
                <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
                  {mode === "csv-to-json"
                    ? "Paste CSV to convert"
                    : "Paste JSON to convert"}
                </div>
              )}

              {outputError && input && (
                <div className="p-4">
                  <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3">
                    <pre className="text-red-300 text-xs font-mono whitespace-pre-wrap">
                      {mode === "csv-to-json"
                        ? "Failed to parse CSV. Check that the input is valid CSV with the correct delimiter."
                        : "Invalid JSON input. Check that the input is valid JSON."}
                    </pre>
                  </div>
                </div>
              )}

              {output && typeof output === "string" && (
                <div className="p-4 overflow-auto max-h-[400px]">
                  <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-all">
                    {output}
                  </pre>
                </div>
              )}
            </div>

            {output && typeof output === "string" && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-green-600 rounded-lg text-xs text-gray-300 transition-colors"
                >
                  {copied ? (
                    <Check size={14} className="text-green-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                  Copy
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-blue-600 rounded-lg text-xs text-gray-300 transition-colors"
                >
                  <Download size={14} />
                  Download
                </button>
              </div>
            )}

            {output && typeof output === "string" && (
              <div className="text-xs text-gray-500">
                <p>
                  Output size: {outputSize.toLocaleString()} bytes,{" "}
                  {outputLines} lines
                </p>
              </div>
            )}

            {/* History Panel */}
            <div className="space-y-2 mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HistoryIcon size={14} />
                  History
                </h2>
                {displayHistory.length > 0 && (
                  <button
                    onClick={handleHistoryClear}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 transition-colors"
                  >
                    <Trash2 size={12} />
                    Clear All
                  </button>
                )}
              </div>

              {displayHistory.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-8">
                  No history yet
                </div>
              ) : (
                <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
                  {displayHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="group flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 rounded-lg cursor-pointer transition-colors"
                      onClick={() => handleHistoryLoad(entry)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleHistoryTogglePin(entry.id);
                        }}
                        className="shrink-0 p-0.5 transition-colors"
                        title={entry.pinned ? "Unpin" : "Pin"}
                      >
                        <Star
                          size={14}
                          className={
                            entry.pinned
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-500 hover:text-gray-300"
                          }
                        />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`text-[10px] font-medium px-1 py-0.5 rounded ${
                              entry.mode === "csv-to-json"
                                ? "bg-blue-900/50 text-blue-300"
                                : "bg-green-900/50 text-green-300"
                            }`}
                          >
                            {entry.mode === "csv-to-json"
                              ? "CSV→JSON"
                              : "JSON→CSV"}
                          </span>
                          <span className="text-[10px] text-gray-500 truncate">
                            {truncate(entry.input, 48)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={10} className="text-gray-600" />
                          <span className="text-[10px] text-gray-600">
                            {timeAgo(entry.timestamp)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleHistoryDelete(entry.id);
                        }}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-600/30 rounded transition-all text-gray-500 hover:text-red-400 shrink-0"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-400 text-sm">
          <p>
            Convert CSV to JSON and JSON to CSV instantly. Part of the{" "}
            <a
              href="https://freeq.one"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              freeq.one
            </a>{" "}
            tools suite.
          </p>
        </div>
      </div>

      <Script
        async
        src="https://www.googletagmanager.com/gtag/js?id=AW-971442831"
        strategy="afterInteractive"
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'AW-971442831');
        gtag('event', 'conversion', {
            'send_to': 'AW-971442831/vGudCLGrjq4cEI-VnM8D',
            'value': 1.0,
            'currency': 'CAD'
        });
      `,
        }}
      />
    </main>
  );
}
