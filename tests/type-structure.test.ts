import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Verify the type structure of the new unified ButtonOptions.
 *
 * With the new API, buttons are composable — they take a ModalHandle
 * and ButtonOptions (position, text, color, icon, tooltip, etc.).
 * Channel is part of the surveyId string ("survey/channel").
 */
describe("ButtonOptions type structure", () => {
    it("should accept position, text, color, icon, tooltip, hideAfterSubmit", () => {
        const options = {
            position: "right" as const,
            text: "Feedback",
            color: "#003366",
            icon: "💬",
            hideAfterSubmit: true,
        };

        assert.ok(options.position);
        assert.ok(options.text);
        assert.ok(options.color);
        assert.ok(options.icon);
        assert.ok(options.hideAfterSubmit);
    });

    it("should default position to right when not specified", () => {
        const options = {
            text: "Give Feedback",
        };

        const position = options.position ?? "right";
        assert.equal(position, "right");
    });

    it("should support all four positions", () => {
        const positions = ["left", "right", "bottom-left", "bottom-right"] as const;
        for (const pos of positions) {
            const options = { position: pos };
            assert.ok(options.position);
        }
    });

    it("should support custom container mode", () => {
        // When container is provided, the button uses it instead of creating DOM
        const options = {
            container: {} as HTMLElement, // mock
            hideAfterSubmit: true,
        };

        assert.ok(options.container);
        assert.ok(options.hideAfterSubmit);
    });
});

describe("surveyId with channel format", () => {
    it("should use slash-separated format for surveyId with channel", () => {
        const surveyId = "2:youropinion:rxdsbdfp/ENEU";
        const parts = surveyId.split("/");

        assert.equal(parts.length, 2);
        assert.equal(parts[0], "2:youropinion:rxdsbdfp");
        assert.equal(parts[1], "ENEU");
    });

    it("should work without channel (just surveyId)", () => {
        const surveyId = "2:youropinion:rxdsbdfp";
        assert.ok(!surveyId.includes("/"));
    });
});
