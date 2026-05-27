import { test, expect } from "@playwright/test";

test.describe("CSV to JSON Converter — E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("page loads with correct title", async ({ page }) => {
    await expect(page.locator("h1")).toHaveText("CSV to JSON Converter");
  });

  test("default mode is CSV → JSON with correct placeholder", async ({ page }) => {
    const textarea = page.locator("textarea");
    await expect(textarea).toHaveAttribute(
      "placeholder",
      "Paste your CSV data here..."
    );
  });

  test("CSV input with headers converts to JSON objects", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.fill("name,age\nAlice,30\nBob,25");

    await expect(page.locator("pre")).toHaveText(
      JSON.stringify([
        { name: "Alice", age: "30" },
        { name: "Bob", age: "25" },
      ], null, 2),
      { timeout: 5000 }
    );
  });

  test("CSV without headers converts to JSON arrays", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.fill("Alice,30\nBob,25");

    await page.locator("input[type='checkbox']").uncheck();

    await expect(page.locator("pre")).toHaveText(
      JSON.stringify([
        ["Alice", "30"],
        ["Bob", "25"],
      ], null, 2),
      { timeout: 5000 }
    );
  });

  test("tab delimiter CSV converts correctly", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.fill("name\tage\nAlice\t30\nBob\t25");

    await page.locator("button", { hasText: "\\t" }).click();

    await expect(page.locator("pre")).toHaveText(
      JSON.stringify([
        { name: "Alice", age: "30" },
        { name: "Bob", age: "25" },
      ], null, 2),
      { timeout: 5000 }
    );
  });

  test("switching to JSON → CSV mode shows JSON placeholder", async ({ page }) => {
    await page.locator("button", { hasText: "JSON → CSV" }).click();

    const textarea = page.locator("textarea");
    await expect(textarea).toHaveAttribute(
      "placeholder",
      "Paste your JSON data here..."
    );
  });

  test("JSON array of objects converts to CSV with headers", async ({ page }) => {
    await page.locator("button", { hasText: "JSON → CSV" }).click();

    const textarea = page.locator("textarea");
    await textarea.fill('[{"name":"Alice","age":"30"},{"name":"Bob","age":"25"}]');

    await expect(page.locator("pre")).toHaveText(
      "name,age\nAlice,30\nBob,25",
      { timeout: 5000 }
    );
  });

  test("JSON array of arrays converts to CSV without headers", async ({ page }) => {
    await page.locator("button", { hasText: "JSON → CSV" }).click();

    const textarea = page.locator("textarea");
    await textarea.fill('[["Alice","30"],["Bob","25"]]');

    await page.locator("input[type='checkbox']").uncheck();

    await expect(page.locator("pre")).toHaveText(
      "Alice,30\nBob,25",
      { timeout: 5000 }
    );
  });

  test("copy button copies output", async ({ page }) => {
    await page.locator("textarea").fill("name,age\nAlice,30");

    await page.evaluate(() => {
      navigator.clipboard.writeText = () =>
        Promise.resolve();
    });

    const copyButton = page.locator("button", { hasText: "Copy" });
    await expect(copyButton).toBeVisible({ timeout: 5000 });
    await copyButton.click();
  });

  test("clear button clears input and output", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.fill("name,age\nAlice,30");

    await expect(page.locator("pre")).not.toBeEmpty({ timeout: 5000 });

    await page.getByRole("button", { name: "Clear", exact: true }).click();

    await expect(textarea).toHaveValue("");
    await expect(page.locator("pre")).not.toBeVisible();
  });

  test("file upload button is visible", async ({ page }) => {
    const fileButton = page.locator("button", { hasText: "File" });
    await expect(fileButton).toBeVisible();
  });

  test.describe("History feature", () => {
    test.beforeEach(async ({ page }) => {
      await page.evaluate(() => localStorage.clear());
      await page.reload();
    });

    test("after CSV→JSON conversion, history entry appears with CSV→JSON badge", async ({ page }) => {
      await page.locator("textarea").fill("name,age\nAlice,30");
      await expect(page.locator("pre")).toHaveText(
        JSON.stringify([{ name: "Alice", age: "30" }], null, 2),
        { timeout: 5000 }
      );

      await expect(page.getByText("No history yet")).not.toBeVisible();
      await expect(page.getByText("CSV→JSON", { exact: true }).first()).toBeVisible({ timeout: 5000 });
    });

    test("after JSON→CSV conversion, history entry appears with JSON→CSV badge", async ({ page }) => {
      await page.locator("button", { hasText: "JSON → CSV" }).click();
      await page.locator("textarea").fill('[{"name":"Alice","age":"30"}]');
      await expect(page.locator("pre")).toHaveText("name,age\nAlice,30", { timeout: 5000 });

      await expect(page.getByText("No history yet")).not.toBeVisible();
      await expect(page.getByText("JSON→CSV", { exact: true }).first()).toBeVisible({ timeout: 5000 });
    });

    test("pin entry and verify star icon", async ({ page }) => {
      await page.locator("textarea").fill("name,age\nAlice,30");
      await expect(page.locator("pre")).not.toBeEmpty({ timeout: 5000 });
      await expect(page.getByText("CSV→JSON", { exact: true }).first()).toBeVisible({ timeout: 5000 });

      const pinButton = page.locator('button[title="Pin"]').first();
      await pinButton.click();

      await expect(page.locator('button[title="Unpin"]').first()).toBeVisible({ timeout: 3000 });
      const starSvg = page.locator('button[title="Unpin"] svg').first();
      await expect(starSvg).toHaveClass(/text-yellow-400/);
    });

    test("click history entry loads data back", async ({ page }) => {
      await page.locator("textarea").fill("name,age\nAlice,30");
      await expect(page.locator("pre")).not.toBeEmpty({ timeout: 5000 });
      await expect(page.getByText("CSV→JSON", { exact: true }).first()).toBeVisible({ timeout: 5000 });

      await page.getByRole("button", { name: "Clear", exact: true }).click();
      await expect(page.locator("textarea")).toHaveValue("");

      await page.locator("div.cursor-pointer").filter({ hasText: "name,age" }).first().click();

      await expect(page.locator("textarea")).toHaveValue("name,age\nAlice,30");
    });

    test("delete entry removes it", async ({ page }) => {
      await page.locator("textarea").fill("name,age\nAlice,30");
      await expect(page.locator("pre")).not.toBeEmpty({ timeout: 5000 });
      await expect(page.getByText("CSV→JSON", { exact: true }).first()).toBeVisible({ timeout: 5000 });

      await page.locator('button[title="Delete"]').first().click({ force: true });

      await expect(page.getByText("No history yet")).toBeVisible({ timeout: 5000 });
    });

    test("clear all removes all entries", async ({ page }) => {
      await page.locator("textarea").fill("name,age\nAlice,30");
      await expect(page.locator("pre")).not.toBeEmpty({ timeout: 5000 });
      await expect(page.getByText("CSV→JSON", { exact: true }).first()).toBeVisible({ timeout: 5000 });

      await page.locator("textarea").fill("name,age\nBob,25");
      await expect(page.locator("pre")).not.toBeEmpty({ timeout: 5000 });

      const entriesBefore = await page.getByText("CSV→JSON", { exact: true }).count();
      expect(entriesBefore).toBeGreaterThanOrEqual(2);

      await page.locator("button", { hasText: "Clear All" }).click();

      await expect(page.getByText("No history yet")).toBeVisible({ timeout: 5000 });
    });
  });
});
