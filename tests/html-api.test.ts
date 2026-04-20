import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { CSS_PREFIX } from "../src/core/utils.ts";

afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = "";
    for (const el of document.querySelectorAll(`style[data-yo-embed]`)) el.remove();
    // Reset activeHandles inside html-api between tests by using reloadAll
});

describe("html-api", () => {
    describe("parseAttributes — attribute type coercion", () => {
        it("numeric string attribute parsed as integer: data-yo-wait-for-ready with numeric autoGrow", async () => {
            const { scanAndInitialize } = await import("../src/core/html-api.ts");

            const el = document.createElement("div");
            el.setAttribute("data-yo-widget", "test/ch");
            // autoGrow="600" should be parsed to integer 600, setting container maxHeight
            el.setAttribute("data-yo-auto-grow", "600");
            document.body.appendChild(el);

            scanAndInitialize();

            // Integer parsing: maxHeight CSS should be set to "600px"
            assert.equal((el as HTMLElement).style.maxHeight, "600px", "autoGrow=600 (integer) should set maxHeight");
        });

        it("'true' string attribute parsed as boolean true: waitForReady hides iframe", async () => {
            const { scanAndInitialize } = await import("../src/core/html-api.ts");

            const el = document.createElement("div");
            el.setAttribute("data-yo-widget", "test/ch");
            el.setAttribute("data-yo-wait-for-ready", "true");
            document.body.appendChild(el);

            scanAndInitialize();

            // If "true" was parsed as boolean true, waitForReady=true is set on widget
            // and the iframe should have opacity:0
            const iframe = el.querySelector("iframe") as HTMLIFrameElement;
            assert.ok(iframe, "widget should have created an iframe");
            assert.equal(iframe.style.opacity, "0", "waitForReady=true should hide the iframe initially");
        });

        it("'false' string attribute parsed as boolean false: waitForReady=false makes iframe visible", async () => {
            const { scanAndInitialize } = await import("../src/core/html-api.ts");

            const el = document.createElement("div");
            el.setAttribute("data-yo-widget", "test/ch");
            el.setAttribute("data-yo-wait-for-ready", "false");
            document.body.appendChild(el);

            scanAndInitialize();

            const iframe = el.querySelector("iframe") as HTMLIFrameElement;
            assert.ok(iframe, "widget should have created an iframe");
            // If "false" was parsed as boolean false, opacity must NOT be "0"
            assert.notEqual(iframe.style.opacity, "0", "waitForReady=false must NOT hide the iframe");
        });

        it("empty attribute value parsed as boolean true: waitForReady hides iframe", async () => {
            const { scanAndInitialize } = await import("../src/core/html-api.ts");

            const el = document.createElement("div");
            el.setAttribute("data-yo-widget", "test/ch");
            el.setAttribute("data-yo-wait-for-ready", "");
            document.body.appendChild(el);

            scanAndInitialize();

            const iframe = el.querySelector("iframe") as HTMLIFrameElement;
            assert.ok(iframe, "widget should have created an iframe");
            assert.equal(iframe.style.opacity, "0", "empty attribute should be treated as true, hiding the iframe");
        });

        it("kebab-case attribute converted to camelCase: data-yo-wait-for-ready sets waitForReady", async () => {
            const { scanAndInitialize } = await import("../src/core/html-api.ts");

            const el = document.createElement("div");
            el.setAttribute("data-yo-widget", "test/ch");
            // kebab → camel: wait-for-ready → waitForReady
            el.setAttribute("data-yo-wait-for-ready", "true");
            document.body.appendChild(el);

            scanAndInitialize();

            const iframe = el.querySelector("iframe") as HTMLIFrameElement;
            assert.ok(iframe, "widget should have created an iframe");
            // If kebab→camel failed, the attribute would be ignored and iframe would be visible
            assert.equal(iframe.style.opacity, "0", "kebab-to-camelCase conversion must work for waitForReady");
        });
    });

    describe("scanAndInitialize", () => {
        it("widget: initializes an iframe inside the container element", async () => {
            const { scanAndInitialize } = await import("../src/core/html-api.ts");

            const el = document.createElement("div");
            el.setAttribute("data-yo-widget", "test/ch");
            document.body.appendChild(el);

            scanAndInitialize();

            const iframe = el.querySelector("iframe");
            assert.ok(iframe, "widget should append an iframe to the element");
        });

        it("widget: does not double-initialize if called twice", async () => {
            const { scanAndInitialize } = await import("../src/core/html-api.ts");

            const el = document.createElement("div");
            el.setAttribute("data-yo-widget", "test/ch");
            document.body.appendChild(el);

            scanAndInitialize();
            scanAndInitialize(); // second call

            const iframes = el.querySelectorAll("iframe");
            assert.equal(iframes.length, 1, "should have exactly one iframe after two scan calls");
        });

        it("dialog: marks element as initialized and wires click", async () => {
            const { scanAndInitialize } = await import("../src/core/html-api.ts");

            const btn = document.createElement("button");
            btn.setAttribute("data-yo-dialog", "test/ch");
            document.body.appendChild(btn);

            scanAndInitialize();

            assert.ok(btn.hasAttribute("data-yo-initialized"), "button should be marked initialized");

            // Clicking should open dialog (appends overlay to body)
            btn.click();
            const overlay = document.querySelector(`.${CSS_PREFIX}-dialog-overlay`);
            assert.ok(overlay, "clicking the button should open the dialog overlay");
        });

        it("popover: marks element as initialized and wires click", async () => {
            const { scanAndInitialize } = await import("../src/core/html-api.ts");

            const btn = document.createElement("button");
            btn.setAttribute("data-yo-popover", "test/ch");
            document.body.appendChild(btn);

            scanAndInitialize();

            assert.ok(btn.hasAttribute("data-yo-initialized"), "element should be marked initialized");

            btn.click();
            const panel = document.querySelector(`.${CSS_PREFIX}-popover-panel`);
            assert.ok(panel, "clicking should open the popover panel");
        });

        it("multiple elements of different types all get initialized", async () => {
            const { scanAndInitialize } = await import("../src/core/html-api.ts");

            const widgetEl = document.createElement("div");
            widgetEl.setAttribute("data-yo-widget", "test/ch");

            const dialogBtn = document.createElement("button");
            dialogBtn.setAttribute("data-yo-dialog", "test/ch");

            document.body.appendChild(widgetEl);
            document.body.appendChild(dialogBtn);

            scanAndInitialize();

            assert.ok(widgetEl.hasAttribute("data-yo-initialized"), "widget should be initialized");
            assert.ok(dialogBtn.hasAttribute("data-yo-initialized"), "dialog should be initialized");
        });
    });

    describe("reloadAll", () => {
        it("re-initializes existing elements after reloadAll", async () => {
            const { scanAndInitialize, reloadAll } = await import("../src/core/html-api.ts");

            const el = document.createElement("div");
            el.setAttribute("data-yo-widget", "test/ch");
            document.body.appendChild(el);

            scanAndInitialize();
            assert.ok(el.hasAttribute("data-yo-initialized"), "should be initialized after first scan");

            // reloadAll removes the marker and immediately re-scans,
            // so the element ends up initialized again
            reloadAll();
            assert.ok(el.hasAttribute("data-yo-initialized"), "should be re-initialized after reloadAll");
        });

        it("picks up new elements added after the initial scan", async () => {
            const { scanAndInitialize, reloadAll } = await import("../src/core/html-api.ts");

            // First scan — no elements
            scanAndInitialize();

            // Add a new element after the first scan
            const el = document.createElement("div");
            el.setAttribute("data-yo-widget", "test/ch");
            document.body.appendChild(el);

            // reloadAll should pick it up
            reloadAll();
            assert.ok(el.hasAttribute("data-yo-initialized"), "new element should be initialized after reloadAll");
        });
    });
});
