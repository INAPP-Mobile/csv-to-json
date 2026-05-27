function parseCsv(input: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  const flushRow = () => {
    currentRow.push(currentField);
    currentField = "";
    rows.push(currentRow);
    currentRow = [];
  };

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const nextChar = i + 1 < input.length ? input[i + 1] : "";

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentField);
        currentField = "";
      } else if (char === "\n") {
        flushRow();
      } else if (char === "\r") {
        if (nextChar !== "\n") {
          flushRow();
        }
      } else {
        currentField += char;
      }
    }
  }

  if (!(currentRow.length === 0 && currentField === "")) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows.filter((row) => !(row.length === 1 && row[0] === ""));
}

export function csvToJson(
  input: string,
  delimiter: string = ",",
  headers: boolean = true
): object[] | string[][] {
  const trimmed = input.trim();
  const parsedLines = parseCsv(trimmed, delimiter);
  if (parsedLines.length === 0) return [];

  if (!headers) return parsedLines;

  const headerRow = parsedLines[0];
  const dataRows = parsedLines.slice(1);

  return dataRows.map((row) => {
    const obj: Record<string, string> = {};
    headerRow.forEach((key, index) => {
      obj[key] = row[index] ?? "";
    });
    return obj;
  });
}

function toCsvValue(value: string, delimiter: string): string {
  if (
    value.includes('"') ||
    value.includes(delimiter) ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function jsonToCsv(
  input: string,
  delimiter: string = ",",
  includeHeaders: boolean = true
): string {
  let data: unknown;

  try {
    data = JSON.parse(input);
  } catch {
    throw new Error("Invalid JSON");
  }

  if (!Array.isArray(data) || data.length === 0) {
    return "";
  }

  const lines: string[] = [];

  if (Array.isArray(data[0])) {
    for (const row of data as unknown[][]) {
      lines.push(
        row
          .map((cell) => toCsvValue(String(cell ?? ""), delimiter))
          .join(delimiter)
      );
    }
  } else if (typeof data[0] === "object" && data[0] !== null) {
    const keys = Object.keys(data[0] as Record<string, unknown>);

    if (includeHeaders) {
      lines.push(keys.map((key) => toCsvValue(key, delimiter)).join(delimiter));
    }

    for (const item of data as Record<string, unknown>[]) {
      lines.push(
        keys
          .map((key) => toCsvValue(String(item[key] ?? ""), delimiter))
          .join(delimiter)
      );
    }
  }

  return lines.join("\n");
}
