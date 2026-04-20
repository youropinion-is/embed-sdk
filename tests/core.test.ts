import assert from "node:assert/strict";
import { describe, it } from "node:test";

// We can't fully test DOM-dependent code in Node.js, but we can test the pure logic modules.

describe("@youropinion/embed", () => {
    describe("buildShareUrl", () => {
        it("should build a basic share URL", async () => {
            const { buildShareUrl } = await import("../src/core/iframe-manager.ts");
            const { setGlobalTheme } = await import("../src/core/theme-manager.ts");

            setGlobalTheme("dark");
            const url = buildShareUrl("test-survey-123/ch1", {
                domain: "https://share.youropinion.is",
                language: "de",
            });

            assert.ok(url.includes("share.youropinion.is"));
            assert.ok(url.includes("test-survey-123/ch1"));
            assert.ok(url.includes("theme=dark"));
            assert.ok(url.includes("language=de"));
            setGlobalTheme("auto");
        });

        it("should use default domain when none specified", async () => {
            const { buildShareUrl } = await import("../src/core/iframe-manager.ts");

            const url = buildShareUrl("survey-1", {});
            assert.ok(url.startsWith("https://share.youropinion.is"));
        });

        it("should include payload when specified", async () => {
            const { buildShareUrl } = await import("../src/core/iframe-manager.ts");

            const url = buildShareUrl("survey-1", {
                payload: "jwt-token-here",
            });
            assert.ok(url.includes("payload=jwt-token-here"));
        });

        it("should JSON-encode hidden fields into the URL", async () => {
            const { buildShareUrl } = await import("../src/core/iframe-manager.ts");

            const url = buildShareUrl("survey-1", {
                hidden: { name: "Alice", plan: "pro" },
            });
            // The hidden param is JSON-encoded
            assert.ok(url.includes("hidden="), "URL should have a hidden param");
            const parsed = new URL(url);
            const hidden = JSON.parse(parsed.searchParams.get("hidden")!);
            assert.deepEqual(hidden, { name: "Alice", plan: "pro" });
        });

        it("should not include hidden param when not specified", async () => {
            const { buildShareUrl } = await import("../src/core/iframe-manager.ts");

            const url = buildShareUrl("survey-1", {});
            assert.ok(!url.includes("hidden="), "URL must not have hidden param when not provided");
        });
    });

    describe("resolveTheme", () => {
        it("should return light or dark for explicit values", async () => {
            const { resolveTheme } = await import("../src/core/theme.ts");

            assert.equal(resolveTheme("light"), "light");
            assert.equal(resolveTheme("dark"), "dark");
        });

        it("should return light as default when window.matchMedia is unavailable", async () => {
            const { resolveTheme } = await import("../src/core/theme.ts");

            // In Node.js, there's no matchMedia, so it falls back to 'light'
            assert.equal(resolveTheme("auto"), "light");
            assert.equal(resolveTheme(undefined), "light");
        });
    });

    describe("utils", () => {
        it("toCss should convert numbers to px", async () => {
            const { toCss } = await import("../src/core/utils.ts");

            assert.equal(toCss(100, "0"), "100px");
            assert.equal(toCss("50%", "0"), "50%");
            assert.equal(toCss(undefined, "auto"), "auto");
        });

        it("toCss should convert numeric strings to px", async () => {
            const { toCss } = await import("../src/core/utils.ts");

            // Bare integer strings (e.g. from HTML text inputs) must get px appended
            assert.equal(toCss("400", "0"), "400px");
            assert.equal(toCss("0", "auto"), "0px");
            assert.equal(toCss("1.5", "0"), "1.5px");
        });

        it("toCss should pass through strings that already have a unit", async () => {
            const { toCss } = await import("../src/core/utils.ts");

            assert.equal(toCss("400px", "0"), "400px");
            assert.equal(toCss("80vw", "0"), "80vw");
            assert.equal(toCss("50%", "0"), "50%");
            assert.equal(toCss("auto", "0"), "auto");
        });

        it("contrastColor should return appropriate contrast", async () => {
            const { contrastColor } = await import("../src/core/utils.ts");

            // Dark background → white text
            assert.equal(contrastColor("#000000"), "#ffffff");
            // Light background → black text
            assert.equal(contrastColor("#ffffff"), "#000000");
        });
    });

    describe("triggers", () => {
        it("markClosedByUser should not throw without localStorage", async () => {
            const { markClosedByUser } = await import("../src/core/open-triggers.ts");

            // In Node.js, localStorage is unavailable, so these should not throw.
            assert.doesNotThrow(() => markClosedByUser("test-survey"));
        });
    });
});
