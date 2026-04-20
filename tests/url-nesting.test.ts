import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Verify that buildShareUrl correctly handles the combined surveyId/channel format.
 *
 * With the new API, channel is part of the surveyId string: "surveySlug/channelSlug".
 * There is no separate channelId option.
 */
describe("buildShareUrl with combined surveyId format", () => {
    it("should include surveyId and channel in the URL path", async () => {
        const { buildShareUrl } = await import("../src/core/iframe-manager.ts");

        const url = buildShareUrl("2:youropinion:rxdsbdfp/ENEU", {});

        assert.ok(url.includes("2:youropinion:rxdsbdfp/ENEU"), "URL should contain full surveyId/channel path");
    });

    it("should work with surveyId only (no channel)", async () => {
        const { buildShareUrl } = await import("../src/core/iframe-manager.ts");

        const url = buildShareUrl("test-survey", {});

        assert.ok(url.includes("test-survey"), "URL should contain surveyId");
        assert.ok(url.startsWith("https://share.youropinion.is"), "Should use default domain");
    });

    it("should include theme and language query params", async () => {
        const { buildShareUrl } = await import("../src/core/iframe-manager.ts");
        const { setGlobalTheme } = await import("../src/core/theme-manager.ts");

        setGlobalTheme("dark");
        const url = buildShareUrl("survey/ENEU", {
            language: "de",
        });

        assert.ok(url.includes("theme=dark"), "URL should contain theme");
        assert.ok(url.includes("language=de"), "URL should contain language");
        setGlobalTheme("auto");
    });

    it("should use custom domain when provided", async () => {
        const { buildShareUrl } = await import("../src/core/iframe-manager.ts");

        const url = buildShareUrl("survey/channel", {
            domain: "https://custom-share.example.com",
        });

        assert.ok(url.startsWith("https://custom-share.example.com"), "Should use custom domain");
        assert.ok(url.includes("survey/channel"), "Should include surveyId/channel path");
    });

    it("should include payload when specified", async () => {
        const { buildShareUrl } = await import("../src/core/iframe-manager.ts");

        const url = buildShareUrl("survey/channel", {
            payload: "jwt-token-here",
        });

        assert.ok(url.includes("payload=jwt-token-here"), "URL should contain payload");
    });
});
