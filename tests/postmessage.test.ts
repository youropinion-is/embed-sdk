import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { createEmitter } from "../src/core/emitter.ts";
import { createPostMessageBridge } from "../src/core/postmessage.ts";
import type { EmbedEventMap } from "../src/types.ts";
import { postFromIframe } from "./helpers/messages.ts";

function makeIframe(): HTMLIFrameElement {
    const iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    return iframe;
}

afterEach(() => {
    for (const el of document.querySelectorAll("iframe")) el.remove();
});

describe("createPostMessageBridge", () => {
    describe("origin security", () => {
        it("ignores messages from unknown origins", async () => {
            const iframe = makeIframe();
            const emitter = createEmitter<EmbedEventMap>();
            const bridge = createPostMessageBridge(iframe, "test/ch", emitter);
            bridge.listen();

            let fired = false;
            emitter.on("ready", () => {
                fired = true;
            });

            postFromIframe(iframe, { message: "survey-ready", surveyId: "test/ch" }, "https://evil.example.com");
            await new Promise((r) => setTimeout(r, 0));

            assert.ok(!fired, "event must not fire from unknown origin");
            bridge.destroy();
        });

        it("ignores messages from another window at the allowed origin", async () => {
            const iframe = makeIframe();
            const other = makeIframe();
            const emitter = createEmitter<EmbedEventMap>();
            const bridge = createPostMessageBridge(iframe, "test/ch", emitter);
            bridge.listen();

            let fired = false;
            emitter.on("ready", () => {
                fired = true;
            });

            postFromIframe(other, { message: "survey-ready", surveyId: "test/ch" });
            await new Promise((r) => setTimeout(r, 0));

            assert.ok(!fired, "event must not fire from a window other than the bridge's iframe");
            bridge.destroy();
        });

        it("ignores messages without a source window", async () => {
            const iframe = makeIframe();
            const emitter = createEmitter<EmbedEventMap>();
            const bridge = createPostMessageBridge(iframe, "test/ch", emitter);
            bridge.listen();

            let fired = false;
            emitter.on("ready", () => {
                fired = true;
            });

            window.dispatchEvent(
                new window.MessageEvent("message", {
                    data: { message: "survey-ready", surveyId: "test/ch" },
                    origin: "https://share.youropinion.is",
                })
            );
            await new Promise((r) => setTimeout(r, 0));

            assert.ok(!fired, "event must not fire when the message has no source");
            bridge.destroy();
        });

        it("accepts messages from allowed origin https://share.youropinion.is", async () => {
            const iframe = makeIframe();
            const emitter = createEmitter<EmbedEventMap>();
            const bridge = createPostMessageBridge(iframe, "test/ch", emitter);
            bridge.listen();

            let fired = false;
            emitter.on("ready", () => {
                fired = true;
            });

            postFromIframe(iframe, { message: "survey-ready", surveyId: "test/ch" });
            await new Promise((r) => setTimeout(r, 0));

            assert.ok(fired, "event should fire from allowed origin");
            bridge.destroy();
        });

        it("accepts messages from a custom domain when provided", async () => {
            const iframe = makeIframe();
            const emitter = createEmitter<EmbedEventMap>();
            const bridge = createPostMessageBridge(iframe, "test/ch", emitter, "https://custom.example.com");
            bridge.listen();

            let fired = false;
            emitter.on("ready", () => {
                fired = true;
            });

            postFromIframe(iframe, { message: "survey-ready", surveyId: "test/ch" }, "https://custom.example.com");
            await new Promise((r) => setTimeout(r, 0));

            assert.ok(fired, "custom domain should be accepted");
            bridge.destroy();
        });

        it("ignores non-object message data", async () => {
            const iframe = makeIframe();
            const emitter = createEmitter<EmbedEventMap>();
            const bridge = createPostMessageBridge(iframe, "test/ch", emitter);
            bridge.listen();

            let fired = false;
            emitter.on("ready", () => {
                fired = true;
            });

            postFromIframe(iframe, "just a string");
            postFromIframe(iframe, null);
            postFromIframe(iframe, 42);
            await new Promise((r) => setTimeout(r, 0));

            assert.ok(!fired, "non-object data must be ignored");
            bridge.destroy();
        });

        it("ignores messages with unknown message type", async () => {
            const iframe = makeIframe();
            const emitter = createEmitter<EmbedEventMap>();
            const bridge = createPostMessageBridge(iframe, "test/ch", emitter);
            bridge.listen();

            let fired = false;
            emitter.on("ready", () => {
                fired = true;
            });

            postFromIframe(iframe, { message: "unknown-message-type", surveyId: "test/ch" });
            await new Promise((r) => setTimeout(r, 0));

            assert.ok(!fired, "unknown message type must be ignored");
            bridge.destroy();
        });
    });

    describe("event mapping", () => {
        it("survey-ready → emitter.ready", async () => {
            const iframe = makeIframe();
            const emitter = createEmitter<EmbedEventMap>();
            const bridge = createPostMessageBridge(iframe, "test/ch", emitter);
            bridge.listen();

            let payload: EmbedEventMap["ready"] | null = null;
            emitter.on("ready", (p) => {
                payload = p;
            });

            postFromIframe(iframe, { message: "survey-ready", surveyId: "test/ch" });
            await new Promise((r) => setTimeout(r, 0));

            assert.ok(payload !== null);
            assert.equal(payload!.surveyId, "test/ch");
            bridge.destroy();
        });

        it("survey-started → emitter.started", async () => {
            const iframe = makeIframe();
            const emitter = createEmitter<EmbedEventMap>();
            const bridge = createPostMessageBridge(iframe, "test/ch", emitter);
            bridge.listen();

            let payload: EmbedEventMap["started"] | null = null;
            emitter.on("started", (p) => {
                payload = p;
            });

            postFromIframe(iframe, { message: "survey-started", surveyId: "test/ch", responseId: "r1" });
            await new Promise((r) => setTimeout(r, 0));

            assert.ok(payload !== null);
            assert.equal(payload!.responseId, "r1");
            bridge.destroy();
        });

        it("survey-completed → emitter.submit", async () => {
            const iframe = makeIframe();
            const emitter = createEmitter<EmbedEventMap>();
            const bridge = createPostMessageBridge(iframe, "test/ch", emitter);
            bridge.listen();

            let payload: EmbedEventMap["submit"] | null = null;
            emitter.on("submit", (p) => {
                payload = p;
            });

            postFromIframe(iframe, { message: "survey-completed", surveyId: "test/ch", responseId: "r2" });
            await new Promise((r) => setTimeout(r, 0));

            assert.ok(payload !== null);
            assert.equal(payload!.responseId, "r2");
            bridge.destroy();
        });

        it("survey-question-changed → emitter.questionChanged", async () => {
            const iframe = makeIframe();
            const emitter = createEmitter<EmbedEventMap>();
            const bridge = createPostMessageBridge(iframe, "test/ch", emitter);
            bridge.listen();

            let payload: EmbedEventMap["questionChanged"] | null = null;
            emitter.on("questionChanged", (p) => {
                payload = p;
            });

            postFromIframe(iframe, { message: "survey-question-changed", surveyId: "test/ch", ref: "q5" });
            await new Promise((r) => setTimeout(r, 0));

            assert.ok(payload !== null);
            assert.equal(payload!.ref, "q5");
            bridge.destroy();
        });

        it("survey-height-changed → emitter.heightChanged", async () => {
            const iframe = makeIframe();
            const emitter = createEmitter<EmbedEventMap>();
            const bridge = createPostMessageBridge(iframe, "test/ch", emitter);
            bridge.listen();

            let payload: EmbedEventMap["heightChanged"] | null = null;
            emitter.on("heightChanged", (p) => {
                payload = p;
            });

            postFromIframe(iframe, { message: "survey-height-changed", surveyId: "test/ch", height: 480 });
            await new Promise((r) => setTimeout(r, 0));

            assert.ok(payload !== null);
            assert.equal(payload!.height, 480);
            bridge.destroy();
        });

        it("surveyId falls back to the bridge surveyId when not in message", async () => {
            const iframe = makeIframe();
            const emitter = createEmitter<EmbedEventMap>();
            const bridge = createPostMessageBridge(iframe, "fallback/ch", emitter);
            bridge.listen();

            let payload: EmbedEventMap["ready"] | null = null;
            emitter.on("ready", (p) => {
                payload = p;
            });

            // message without surveyId
            postFromIframe(iframe, { message: "survey-ready" });
            await new Promise((r) => setTimeout(r, 0));

            assert.ok(payload !== null);
            assert.equal(payload!.surveyId, "fallback/ch");
            bridge.destroy();
        });

        it("onSurveyCompleted callback is invoked on survey-completed", async () => {
            const iframe = makeIframe();
            const emitter = createEmitter<EmbedEventMap>();
            let completedInfo: { allowEdits: boolean } | null = null;
            const bridge = createPostMessageBridge(iframe, "test/ch", emitter, undefined, (info) => {
                completedInfo = info;
            });
            bridge.listen();

            postFromIframe(iframe, { message: "survey-completed", surveyId: "test/ch", responseId: "r3", allowEdits: false });
            await new Promise((r) => setTimeout(r, 0));

            assert.ok(completedInfo !== null);
            assert.equal(completedInfo!.allowEdits, false);
            bridge.destroy();
        });
    });

    describe("destroy", () => {
        it("destroy stops listening — no more events after destroy()", async () => {
            const iframe = makeIframe();
            const emitter = createEmitter<EmbedEventMap>();
            const bridge = createPostMessageBridge(iframe, "test/ch", emitter);
            bridge.listen();
            bridge.destroy();

            let fired = false;
            emitter.on("ready", () => {
                fired = true;
            });

            postFromIframe(iframe, { message: "survey-ready", surveyId: "test/ch" });
            await new Promise((r) => setTimeout(r, 0));

            assert.ok(!fired, "no events should fire after destroy");
        });
    });
});
