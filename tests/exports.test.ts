import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Validate that the main entry point (@youropinion/embed) exports
 * all expected symbols. This prevents breaking consumers when
 * exports are moved or restructured.
 */
describe("main entry exports", () => {
  it("should export all surface creators", async () => {
    const mod = await import("../src/embed.ts");
    assert.equal(typeof mod.createDialog, "function");
    assert.equal(typeof mod.createDrawer, "function");
    assert.equal(typeof mod.createPopover, "function");
    assert.equal(typeof mod.createWidget, "function");
  });

  it("should export createButton", async () => {
    const mod = await import("../src/embed.ts");
    assert.equal(typeof mod.createButton, "function");
  });

  it("should export setTheme", async () => {
    const mod = await import("../src/embed.ts");
    assert.equal(typeof mod.setTheme, "function");
  });
});

/**
 * Validate that createButton is exported from the main entry point.
 */
describe("button creator in main entry", () => {
  it("should export createButton", async () => {
    const mod = await import("../src/embed.ts");
    assert.equal(typeof mod.createButton, "function");
  });
});
