import { describe, it, expect } from "vitest";
import { csvToJson, jsonToCsv } from "@/lib/csv";

describe("CSV to JSON", () => {
  it("converts CSV with headers to array of objects", () => {
    const csv = "name,age,city\nAlice,30,New York\nBob,25,Los Angeles";
    const result = csvToJson(csv, ",", true);
    expect(result).toEqual([
      { name: "Alice", age: "30", city: "New York" },
      { name: "Bob", age: "25", city: "Los Angeles" },
    ]);
  });

  it("converts CSV without headers to array of arrays", () => {
    const csv = "Alice,30\nBob,25";
    const result = csvToJson(csv, ",", false);
    expect(result).toEqual([
      ["Alice", "30"],
      ["Bob", "25"],
    ]);
  });

  it("handles quoted fields with commas inside", () => {
    const csv = 'name,desc\nAlice,"loves, cats"\nBob,"says, ""hello"" "';
    const result = csvToJson(csv, ",", true);
    expect(result).toEqual([
      { name: "Alice", desc: "loves, cats" },
      { name: "Bob", desc: 'says, "hello" ' },
    ]);
  });

  it("handles tab delimiter", () => {
    const csv = "name\tage\nAlice\t30\nBob\t25";
    const result = csvToJson(csv, "\t", true);
    expect(result).toEqual([
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25" },
    ]);
  });

  it("handles pipe delimiter", () => {
    const csv = "name|age\nAlice|30\nBob|25";
    const result = csvToJson(csv, "|", true);
    expect(result).toEqual([
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25" },
    ]);
  });

  it("handles empty input", () => {
    expect(csvToJson("", ",", true)).toEqual([]);
    expect(csvToJson("  ", ",", true)).toEqual([]);
  });

  it("handles different line endings (\\r\\n)", () => {
    const csv = "name,age\r\nAlice,30\r\nBob,25";
    const result = csvToJson(csv, ",", true);
    expect(result).toEqual([
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25" },
    ]);
  });

  it("handles empty values", () => {
    const csv = "name,age,city\nAlice,,New York\nBob,25,";
    const result = csvToJson(csv, ",", true);
    expect(result).toEqual([
      { name: "Alice", age: "", city: "New York" },
      { name: "Bob", age: "25", city: "" },
    ]);
  });

  it("handles newlines inside quoted fields", () => {
    const csv = 'name,desc\nAlice,"line1\nline2"\nBob,simple';
    const result = csvToJson(csv, ",", true);
    expect(result).toEqual([
      { name: "Alice", desc: "line1\nline2" },
      { name: "Bob", desc: "simple" },
    ]);
  });
});

describe("JSON to CSV", () => {
  it("converts array of objects to CSV with headers", () => {
    const json = '[{"name":"Alice","age":"30"},{"name":"Bob","age":"25"}]';
    const result = jsonToCsv(json, ",", true);
    expect(result).toBe("name,age\nAlice,30\nBob,25");
  });

  it("converts array of arrays to CSV without headers", () => {
    const json = '[["Alice","30"],["Bob","25"]]';
    const result = jsonToCsv(json, ",", false);
    expect(result).toBe("Alice,30\nBob,25");
  });

  it("handles empty input", () => {
    expect(jsonToCsv("[]", ",", true)).toBe("");
  });

  it("throws on invalid JSON", () => {
    expect(() => jsonToCsv("not json", ",", true)).toThrow("Invalid JSON");
  });

  it("handles values with commas and quotes", () => {
    const json =
      '[{"name":"Alice","desc":"loves, cats"},{"name":"Bob","desc":"says \\"hello\\""}]';
    const result = jsonToCsv(json, ",", true);
    expect(result).toBe(
      'name,desc\nAlice,"loves, cats"\nBob,"says ""hello"""'
    );
  });

  it("converts array of objects to CSV without headers", () => {
    const json = '[{"name":"Alice","age":"30"},{"name":"Bob","age":"25"}]';
    const result = jsonToCsv(json, ",", false);
    expect(result).toBe("Alice,30\nBob,25");
  });

  it("handles tab delimiter in output", () => {
    const json = '[{"name":"Alice","age":"30"}]';
    const result = jsonToCsv(json, "\t", true);
    expect(result).toBe("name\tage\nAlice\t30");
  });
});
