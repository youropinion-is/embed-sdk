import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { iframeWindow, postFromIframe, postFromWindow } from "./helpers/messages.ts";
import { createWidget } from "../src/surfaces/widget.ts";

function makeContainer(): HTMLDivElement {
    const el = document.createElement("div");
    document.body.appendChild(el);
    return el;
}

afterEach(() => {
    for (const el of document.querySelectorAll(`div`)) el.remove();
    for (const el of document.querySelectorAll(`style[data-yo-embed]`)) el.remove();
    for (const el of document.querySelectorAll(`iframe`)) el.remove();
});

describe("createWidget", () => {
    describe("container requirement", () => {
        it("throws when no container is provided", () => {
            assert.throws(
                () => createWidget("test/ch", {} as any),
                /container/i,
                "should throw with a message mentioning 'container'"
            );
        });
    });

    describe("iframe creation", () => {
        it("appends an iframe to the container", () => {
            const container = makeContainer();
            const handle = createWidget("test/ch", { container });

            const iframe = container.querySelector("iframe");
            assert.ok(iframe, "iframe should be in container");

            handle.unmount();
        });

        it("iframe must not have loading=lazy", () => {
            const container = makeContainer();
            const handle = createWidget("test/ch", { container });

            const iframe = container.querySelector("iframe");
            assert.ok(iframe, "iframe should exist");
            assert.ok(!iframe.hasAttribute("loading"), "iframe must not have loading attribute");

            handle.unmount();
        });

        it("iframe src includes the surveyId", () => {
            const container = makeContainer();
            const handle = createWidget("my-survey/ch", { container });

            const iframe = container.querySelector("iframe") as HTMLIFrameElement;
            assert.ok(iframe.src.includes("my-survey/ch"), "iframe src should contain surveyId");

            handle.unmount();
        });

        it("iframe fills container at 100% width by default", () => {
            const container = makeContainer();
            const handle = createWidget("test/ch", { container });

            const iframe = container.querySelector("iframe") as HTMLIFrameElement;
            assert.equal(iframe.style.width, "100%");

            handle.unmount();
        });

        it("width option overrides iframe width", () => {
            const container = makeContainer();
            const handle = createWidget("test/ch", { container, width: "80%" });

            const iframe = container.querySelector("iframe") as HTMLIFrameElement;
            assert.equal(iframe.style.width, "80%");

            handle.unmount();
        });

        it("width number option appends px", () => {
            const container = makeContainer();
            const handle = createWidget("test/ch", { container, width: 400 });

            const iframe = container.querySelector("iframe") as HTMLIFrameElement;
            assert.equal(iframe.style.width, "400px");

            handle.unmount();
        });
    });

    describe("height management", () => {
        it("with fixed height and no autoGrow/autoShrink — container height set to the value", () => {
            const container = makeContainer();
            // autoGrow and autoShrink both default to true for widget — override to false
            const handle = createWidget("test/ch", { container, height: "400px", autoGrow: false, autoShrink: false });

            assert.equal(container.style.height, "400px");

            handle.unmount();
        });

        it("height number option sets container height in px", () => {
            const container = makeContainer();
            const handle = createWidget("test/ch", { container, height: 350, autoGrow: false, autoShrink: false });

            assert.equal(container.style.height, "350px");

            handle.unmount();
        });

        it("autoGrow=true (default) — container grows on heightChanged", async () => {
            const container = makeContainer();
            const handle = createWidget("test/ch", { container });

            postFromIframe(container.querySelector("iframe"), { message: "survey-height-changed", surveyId: "test/ch", height: 500 });
            await new Promise((r) => setTimeout(r, 0));

            assert.equal(container.style.height, "500px");

            handle.unmount();
        });

        it("autoGrow=false — container does NOT grow on heightChanged", async () => {
            const container = makeContainer();
            container.style.height = "300px";
            const handle = createWidget("test/ch", { container, autoGrow: false, autoShrink: false });

            postFromIframe(container.querySelector("iframe"), { message: "survey-height-changed", surveyId: "test/ch", height: 600 });
            await new Promise((r) => setTimeout(r, 0));

            assert.equal(container.style.height, "300px", "height must not change when autoGrow=false");

            handle.unmount();
        });

        it("autoGrow=true, autoShrink=false — does not shrink after growing", async () => {
            const container = makeContainer();
            // No height option — widget starts at 0 and grows via postMessage
            const handle = createWidget("test/ch", { container, autoShrink: false });

            // Grow the widget to 400px first
            postFromIframe(container.querySelector("iframe"), { message: "survey-height-changed", surveyId: "test/ch", height: 400 });
            await new Promise((r) => setTimeout(r, 0));
            assert.equal(container.style.height, "400px", "widget should grow to 400px");

            // Now try to shrink — autoShrink=false should block it
            postFromIframe(container.querySelector("iframe"), { message: "survey-height-changed", surveyId: "test/ch", height: 100 });
            await new Promise((r) => setTimeout(r, 0));

            assert.equal(container.style.height, "400px", "should not shrink when autoShrink=false");

            handle.unmount();
        });

        it("autoGrow=600 (number) — container maxHeight is 600px", () => {
            const container = makeContainer();
            const handle = createWidget("test/ch", { container, autoGrow: 600 });

            assert.equal(container.style.maxHeight, "600px");

            handle.unmount();
        });

        it("autoShrink=100 (number) — container minHeight is 100px", () => {
            const container = makeContainer();
            const handle = createWidget("test/ch", { container, autoShrink: 100 });

            assert.equal(container.style.minHeight, "100px");

            handle.unmount();
        });
    });

    describe("waitForReady", () => {
        it("iframe starts with opacity 0 when waitForReady=true", () => {
            const container = makeContainer();
            const handle = createWidget("test/ch", { container, waitForReady: true });

            const iframe = container.querySelector("iframe") as HTMLIFrameElement;
            assert.equal(iframe.style.opacity, "0");

            handle.unmount();
        });

        it("iframe remains hidden after survey-ready alone (needs heightChanged too)", () => {
            const container = makeContainer();
            const handle = createWidget("test/ch", { container, waitForReady: true });

            // Only send ready — no heightChanged
            postFromIframe(container.querySelector("iframe"), { message: "survey-ready", surveyId: "test/ch" });

            const iframe = container.querySelector("iframe") as HTMLIFrameElement;
            assert.equal(iframe.style.opacity, "0", "iframe must stay hidden until heightChanged also fires");

            handle.unmount();
        });

        it("iframe becomes visible after survey-ready AND survey-height-changed both fire", () => {
            const container = makeContainer();
            const handle = createWidget("test/ch", { container, waitForReady: true });

            postFromIframe(container.querySelector("iframe"), { message: "survey-ready", surveyId: "test/ch" });
            postFromIframe(container.querySelector("iframe"), { message: "survey-height-changed", surveyId: "test/ch", height: 400 });

            const iframe = container.querySelector("iframe") as HTMLIFrameElement;
            assert.equal(iframe.style.opacity, "1");

            handle.unmount();
        });

        it("iframe is visible immediately when waitForReady=false", () => {
            const container = makeContainer();
            const handle = createWidget("test/ch", { container, waitForReady: false });

            const iframe = container.querySelector("iframe") as HTMLIFrameElement;
            assert.notEqual(iframe.style.opacity, "0");

            handle.unmount();
        });
    });

    describe("events", () => {
        it("on('submit') fires when survey-completed postMessage received", async () => {
            const container = makeContainer();
            const handle = createWidget("test/ch", { container });

            let received: { surveyId: string; responseId: string } | null = null;
            handle.on("submit", (p) => {
                received = p;
            });

            postFromIframe(container.querySelector("iframe"), { message: "survey-completed", surveyId: "test/ch", responseId: "resp-1" });
            await new Promise((r) => setTimeout(r, 0));

            assert.ok(received !== null, "submit event should have fired");
            assert.equal(received!.responseId, "resp-1");

            handle.unmount();
        });

        it("on('started') fires when survey-started postMessage received", async () => {
            const container = makeContainer();
            const handle = createWidget("test/ch", { container });

            let fired = false;
            handle.on("started", () => {
                fired = true;
            });

            postFromIframe(container.querySelector("iframe"), { message: "survey-started", surveyId: "test/ch", responseId: "resp-1" });
            await new Promise((r) => setTimeout(r, 0));

            assert.ok(fired, "started event should have fired");

            handle.unmount();
        });

        it("off() unsubscribes a listener", async () => {
            const container = makeContainer();
            const handle = createWidget("test/ch", { container });

            let count = 0;
            const listener = () => {
                count++;
            };
            handle.on("ready", listener);
            handle.off("ready", listener);

            postFromIframe(container.querySelector("iframe"), { message: "survey-ready", surveyId: "test/ch" });
            await new Promise((r) => setTimeout(r, 0));

            assert.equal(count, 0, "listener should not fire after off()");

            handle.unmount();
        });
    });

    describe("unmount", () => {
        it("removes the iframe from the container", () => {
            const container = makeContainer();
            const handle = createWidget("test/ch", { container });

            assert.ok(container.querySelector("iframe"), "iframe should exist before unmount");

            handle.unmount();

            assert.equal(container.querySelector("iframe"), null, "iframe should be removed after unmount");
        });

        it("unmount is idempotent (double-unmount does not throw)", () => {
            const container = makeContainer();
            const handle = createWidget("test/ch", { container });

            handle.unmount();
            assert.doesNotThrow(() => handle.unmount());
        });

        it("postMessage events after unmount() do not fire registered callbacks", async () => {
            const container = makeContainer();
            const handle = createWidget("test/ch", { container });

            let fired = false;
            handle.on("submit", () => {
                fired = true;
            });

            // The window the survey posted from while mounted
            const source = iframeWindow(container.querySelector("iframe"));
            handle.unmount();

            postFromWindow(source, { message: "survey-completed", surveyId: "test/ch", responseId: "r1" });
            await new Promise((r) => setTimeout(r, 0));

            assert.ok(!fired, "submit must not fire after unmount()");
        });
    });
});
