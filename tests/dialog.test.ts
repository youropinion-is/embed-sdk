import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { postFromIframe } from "./helpers/messages.ts";
import { setGlobalTheme } from "../src/core/theme-manager.ts";
import { CSS_PREFIX } from "../src/core/utils.ts";
import { createDialog } from "../src/surfaces/dialog.ts";

function getDialogElements() {
    const overlay = document.querySelector(`.${CSS_PREFIX}-dialog-overlay`) as HTMLElement | null;
    const dialog = overlay?.querySelector(`.${CSS_PREFIX}-dialog`) as HTMLElement | null;
    const iframe = dialog?.querySelector("iframe") as HTMLIFrameElement | null;
    return { overlay, dialog, iframe };
}

afterEach(() => {
    // Clean up any dialog DOM from the body
    for (const el of document.querySelectorAll(`.${CSS_PREFIX}-dialog-overlay`)) el.remove();
    for (const el of document.querySelectorAll(`style[data-yo-embed]`)) el.remove();
    document.body.style.overflow = "";
});

describe("createDialog", () => {
    describe("default sizing (size option)", () => {
        it("should set dialog dimensions from default size (80)", () => {
            const handle = createDialog("test/ch", {});
            handle.open();

            const { dialog } = getDialogElements();
            assert.ok(dialog, "dialog element should exist");
            assert.equal(dialog.style.width, "80vw");
            assert.equal(dialog.style.height, "80vh");

            handle.unmount();
        });

        it("should set dialog dimensions from custom size", () => {
            const handle = createDialog("test/ch", { size: 60 });
            handle.open();

            const { dialog } = getDialogElements();
            assert.ok(dialog, "dialog element should exist");
            assert.equal(dialog.style.width, "60vw");
            assert.equal(dialog.style.height, "60vh");

            handle.unmount();
        });
    });

    describe("explicit width and height", () => {
        it("should set dialog width from string option", () => {
            const handle = createDialog("test/ch", { width: "600px" });
            handle.open();

            const { dialog } = getDialogElements();
            assert.ok(dialog, "dialog element should exist");
            assert.equal(dialog.style.width, "600px");

            handle.unmount();
        });

        it("should set dialog width from number option (px)", () => {
            const handle = createDialog("test/ch", { width: 500 });
            handle.open();

            const { dialog } = getDialogElements();
            assert.ok(dialog, "dialog element should exist");
            assert.equal(dialog.style.width, "500px");

            handle.unmount();
        });

        it("should set dialog height from string option", () => {
            const handle = createDialog("test/ch", { height: "400px" });
            handle.open();

            const { dialog } = getDialogElements();
            assert.ok(dialog, "dialog element should exist");
            assert.equal(dialog.style.height, "400px");

            handle.unmount();
        });

        it("should set dialog height from number option (px)", () => {
            const handle = createDialog("test/ch", { height: 350 });
            handle.open();

            const { dialog } = getDialogElements();
            assert.ok(dialog, "dialog element should exist");
            assert.equal(dialog.style.height, "350px");

            handle.unmount();
        });

        it("should set both explicit width and height", () => {
            const handle = createDialog("test/ch", { width: "700px", height: "500px" });
            handle.open();

            const { dialog } = getDialogElements();
            assert.ok(dialog, "dialog element should exist");
            assert.equal(dialog.style.width, "700px");
            assert.equal(dialog.style.height, "500px");

            handle.unmount();
        });
    });

    describe("iframe loading attribute", () => {
        it("iframe should not have loading=lazy (prevents waitForReady deadlock)", () => {
            const handle = createDialog("test/ch", {});
            handle.open();

            const { iframe } = getDialogElements();
            assert.ok(iframe, "iframe should exist");
            assert.ok(!iframe.hasAttribute("loading"), "iframe must not have loading attribute");

            handle.unmount();
        });
    });

    describe("waitForReady", () => {
        it("dialog should not be visible before ready event fires", () => {
            const handle = createDialog("test/ch", { waitForReady: true });
            handle.open();

            const overlay = document.querySelector(`.${CSS_PREFIX}-dialog-overlay`) as HTMLElement | null;
            assert.ok(overlay, "overlay should exist");
            assert.ok(
                !overlay.classList.contains(`${CSS_PREFIX}-dialog-overlay--open`),
                "dialog should not be visible before ready"
            );

            handle.unmount();
        });

        it("dialog should become visible after ready event fires", () => {
            const handle = createDialog("test/ch", { waitForReady: true });
            handle.open();

            // Simulate survey-ready postMessage from the survey iframe
            postFromIframe(getDialogElements().iframe, { message: "survey-ready", surveyId: "test/ch" });

            const overlay = document.querySelector(`.${CSS_PREFIX}-dialog-overlay`) as HTMLElement | null;
            assert.ok(overlay, "overlay should exist");
            assert.ok(
                overlay.classList.contains(`${CSS_PREFIX}-dialog-overlay--open`),
                "dialog should be visible after ready event"
            );

            handle.unmount();
        });
    });

    describe("explicit width overrides size", () => {
        it("size=80, width=400 — width should be 400px, height should be 80vh", () => {
            const handle = createDialog("test/ch", { size: 80, width: 400 });
            handle.open();

            const { dialog } = getDialogElements();
            assert.ok(dialog, "dialog element should exist");
            assert.equal(dialog.style.width, "400px");
            assert.equal(dialog.style.height, "80vh");

            handle.unmount();
        });

        it("size=80, width='400' (string without unit) — should treat as px and set 400px", () => {
            // Bug: toCss() only converts numbers to px. A string "400" is passed as-is,
            // which is invalid CSS and gets silently ignored by the browser, leaving
            // width unset. This happens when the playground reads values from text inputs.
            const handle = createDialog("test/ch", { size: 80, width: "400" });
            handle.open();

            const { dialog } = getDialogElements();
            assert.ok(dialog, "dialog element should exist");
            assert.equal(dialog.style.width, "400px");

            handle.unmount();
        });
    });

    describe("fullScreen", () => {
        it("fullScreen=true adds fullscreen class and skips explicit sizing", () => {
            const handle = createDialog("test/ch", { fullScreen: true });
            handle.open();

            const { dialog } = getDialogElements();
            assert.ok(dialog, "dialog element should exist");
            assert.ok(
                dialog.classList.contains(`${CSS_PREFIX}-dialog--fullscreen`),
                "fullscreen class should be present"
            );
            // Shell does not set explicit width — the CSS class handles 100vw/100vh via !important
            assert.equal(dialog.style.width, "");

            handle.unmount();
        });

        it("without fullScreen — fullscreen class is absent", () => {
            const handle = createDialog("test/ch", {});
            handle.open();

            const { dialog } = getDialogElements();
            assert.ok(dialog, "dialog element should exist");
            assert.ok(
                !dialog.classList.contains(`${CSS_PREFIX}-dialog--fullscreen`),
                "fullscreen class must not be present by default"
            );

            handle.unmount();
        });
    });

    describe("theme", () => {
        it("global theme 'dark' adds --dark class to the dialog element", () => {
            setGlobalTheme("dark");
            const handle = createDialog("test/ch", {});
            handle.open();

            const { dialog } = getDialogElements();
            assert.ok(dialog, "dialog element should exist");
            assert.ok(dialog.classList.contains(`${CSS_PREFIX}--dark`), "should have --dark class");

            handle.unmount();
            setGlobalTheme("auto");
        });

        it("global theme 'light' adds --light class (no --dark)", () => {
            setGlobalTheme("light");
            const handle = createDialog("test/ch", {});
            handle.open();

            const { dialog } = getDialogElements();
            assert.ok(dialog, "dialog element should exist");
            assert.ok(!dialog.classList.contains(`${CSS_PREFIX}--dark`), "should not have --dark class");
            assert.ok(dialog.classList.contains(`${CSS_PREFIX}--light`), "should have --light class");

            handle.unmount();
            setGlobalTheme("auto");
        });
    });

    describe("autoGrow", () => {
        it("width=400, height=400, autoGrow=true — dialog opens at 400×400", () => {
            const handle = createDialog("test/ch", { width: 400, height: 400, autoGrow: true });
            handle.open();

            const { dialog } = getDialogElements();
            assert.ok(dialog, "dialog element should exist");
            assert.equal(dialog.style.width, "400px");
            assert.equal(dialog.style.height, "400px");

            handle.unmount();
        });

        it("width=400, height=400, autoGrow=true — maxHeight is 90vh", () => {
            const handle = createDialog("test/ch", { width: 400, height: 400, autoGrow: true });
            handle.open();

            const { dialog } = getDialogElements();
            assert.ok(dialog, "dialog element should exist");
            assert.equal(dialog.style.maxHeight, "90vh");

            handle.unmount();
        });

        it("autoGrow=600 (number) — maxHeight is 600px", () => {
            const handle = createDialog("test/ch", { width: 400, height: 400, autoGrow: 600 });
            handle.open();

            const { dialog } = getDialogElements();
            assert.ok(dialog, "dialog element should exist");
            assert.equal(dialog.style.maxHeight, "600px");

            handle.unmount();
        });

        it("width=400, height=400, autoGrow=true, autoShrink=false — dialog opens at 400×400", () => {
            const handle = createDialog("test/ch", { width: 400, height: 400, autoGrow: true, autoShrink: false });
            handle.open();

            const { dialog } = getDialogElements();
            assert.ok(dialog, "dialog element should exist");
            assert.equal(dialog.style.width, "400px");
            assert.equal(dialog.style.height, "400px");

            handle.unmount();
        });

        it("autoShrink=200 (number) — minHeight is 200px", () => {
            const handle = createDialog("test/ch", { height: 400, autoGrow: true, autoShrink: 200 });
            handle.open();

            const { dialog } = getDialogElements();
            assert.ok(dialog, "dialog element should exist");
            assert.equal(dialog.style.minHeight, "200px");

            handle.unmount();
        });

        it("autoGrow=true — heightChanged above initial height grows the dialog", async () => {
            const handle = createDialog("test/ch", { width: 400, height: 400, autoGrow: true, autoShrink: false });
            handle.open();

            postFromIframe(getDialogElements().iframe, { message: "survey-height-changed", surveyId: "test/ch", height: 600 });
            await new Promise((r) => setTimeout(r, 0));

            const { dialog } = getDialogElements();
            assert.ok(dialog, "dialog element should exist");
            assert.equal(dialog.style.height, "600px", "dialog should grow to 600px");

            handle.unmount();
        });

        it("autoShrink=false — heightChanged below initial height does not shrink the dialog", async () => {
            const handle = createDialog("test/ch", { width: 400, height: 400, autoGrow: true, autoShrink: false });
            handle.open();

            postFromIframe(getDialogElements().iframe, { message: "survey-height-changed", surveyId: "test/ch", height: 200 });
            await new Promise((r) => setTimeout(r, 0));

            const { dialog } = getDialogElements();
            assert.ok(dialog, "dialog element should exist");
            assert.equal(dialog.style.height, "400px", "dialog must not shrink when autoShrink=false");

            handle.unmount();
        });

        it("autoShrink=true — heightChanged below initial height shrinks the dialog", async () => {
            const handle = createDialog("test/ch", { width: 400, height: 400, autoGrow: true, autoShrink: true });
            handle.open();

            postFromIframe(getDialogElements().iframe, { message: "survey-height-changed", surveyId: "test/ch", height: 200 });
            await new Promise((r) => setTimeout(r, 0));

            const { dialog } = getDialogElements();
            assert.ok(dialog, "dialog element should exist");
            assert.equal(dialog.style.height, "200px", "dialog should shrink to 200px when autoShrink=true");

            handle.unmount();
        });
    });

    describe("autoClose", () => {
        it("autoClose=0 — dialog stays open after survey-completed", async () => {
            const handle = createDialog("test/ch", { autoClose: 0 });
            handle.open();

            postFromIframe(getDialogElements().iframe, { message: "survey-completed", surveyId: "test/ch", responseId: "r1" });
            await new Promise((r) => setTimeout(r, 0));

            const overlay = document.querySelector(`.${CSS_PREFIX}-dialog-overlay`) as HTMLElement | null;
            assert.ok(overlay?.classList.contains(`${CSS_PREFIX}-dialog-overlay--open`), "dialog should still be open");

            handle.unmount();
        });

        it("autoClose=true — dialog closes after survey-completed (3s timer)", async () => {
            const handle = createDialog("test/ch", { autoClose: 10 }); // 10ms for fast test
            handle.open();

            postFromIframe(getDialogElements().iframe, { message: "survey-completed", surveyId: "test/ch", responseId: "r1" });
            await new Promise((r) => setTimeout(r, 50));

            const overlay = document.querySelector(`.${CSS_PREFIX}-dialog-overlay`) as HTMLElement | null;
            assert.ok(
                !overlay?.classList.contains(`${CSS_PREFIX}-dialog-overlay--open`),
                "dialog should close after autoClose delay"
            );

            handle.unmount();
        });
    });

    describe("modal-behavior shared", () => {
        it("toggle() opens a closed dialog", () => {
            const handle = createDialog("test/ch", {});

            handle.toggle();

            const overlay = document.querySelector(`.${CSS_PREFIX}-dialog-overlay`) as HTMLElement | null;
            assert.ok(
                overlay?.classList.contains(`${CSS_PREFIX}-dialog-overlay--open`),
                "dialog should open on toggle()"
            );

            handle.unmount();
        });

        it("toggle() closes an open dialog", () => {
            const handle = createDialog("test/ch", {});
            handle.open();
            handle.toggle(); // close it

            const overlay = document.querySelector(`.${CSS_PREFIX}-dialog-overlay`) as HTMLElement | null;
            assert.ok(
                !overlay?.classList.contains(`${CSS_PREFIX}-dialog-overlay--open`),
                "dialog should close on second toggle()"
            );

            handle.unmount();
        });

        it("emits 'open' event when dialog is opened", () => {
            const handle = createDialog("test/ch", {});
            let opened = false;
            handle.on("open", () => {
                opened = true;
            });

            handle.open();

            assert.ok(opened, "'open' event should fire when dialog opens");

            handle.unmount();
        });

        it("emits 'close' event when dialog is closed", () => {
            const handle = createDialog("test/ch", {});
            let closed = false;
            handle.on("close", () => {
                closed = true;
            });

            handle.open();
            handle.close();

            assert.ok(closed, "'close' event should fire when dialog closes");

            handle.unmount();
        });

        it("preload() throws without keepSession", () => {
            const handle = createDialog("test/ch", {});

            assert.throws(() => handle.preload(), /keepSession/i, "preload() must throw when keepSession is not set");

            handle.unmount();
        });

        it("preload() with keepSession creates the widget without opening", () => {
            const handle = createDialog("test/ch", { keepSession: true });

            assert.doesNotThrow(() => handle.preload());

            // Dialog should not be visually open
            const overlay = document.querySelector(`.${CSS_PREFIX}-dialog-overlay`) as HTMLElement | null;
            assert.ok(
                !overlay?.classList.contains(`${CSS_PREFIX}-dialog-overlay--open`),
                "dialog must not be open after preload()"
            );

            handle.unmount();
        });

        it("keepSession: widget persists across close/reopen (no second iframe creation)", () => {
            const handle = createDialog("test/ch", { keepSession: true });
            handle.open();

            const iframeAfterOpen = document.querySelector(`.${CSS_PREFIX}-dialog iframe`) as HTMLIFrameElement | null;
            const srcAfterOpen = iframeAfterOpen?.src;

            handle.close();
            handle.open();

            const iframeAfterReopen = document.querySelector(
                `.${CSS_PREFIX}-dialog iframe`
            ) as HTMLIFrameElement | null;
            assert.equal(iframeAfterReopen?.src, srcAfterOpen, "same iframe should be reused with keepSession");

            handle.unmount();
        });

        it("without keepSession: dialog can be opened again after close", () => {
            const handle = createDialog("test/ch", {});
            handle.open();
            handle.close();
            handle.open();

            const overlay = document.querySelector(`.${CSS_PREFIX}-dialog-overlay`) as HTMLElement | null;
            assert.ok(
                overlay?.classList.contains(`${CSS_PREFIX}-dialog-overlay--open`),
                "dialog should be openable again after close without keepSession"
            );

            handle.unmount();
        });
    });

    describe("iframe sizing inside dialog", () => {
        it("iframe should fill dialog container at 100% width", () => {
            const handle = createDialog("test/ch", { width: "600px", height: "400px" });
            handle.open();

            const { iframe } = getDialogElements();
            assert.ok(iframe, "iframe should exist");
            assert.equal(iframe.style.width, "100%", "iframe width must be 100% regardless of dialog width");

            handle.unmount();
        });

        it("iframe should fill dialog container at 100% height", () => {
            const handle = createDialog("test/ch", { width: "600px", height: "400px" });
            handle.open();

            const { iframe } = getDialogElements();
            assert.ok(iframe, "iframe should exist");
            assert.equal(iframe.style.height, "100%", "iframe height must be 100%");

            handle.unmount();
        });

        it("iframe should be 100% width even with default size option", () => {
            const handle = createDialog("test/ch", {});
            handle.open();

            const { iframe } = getDialogElements();
            assert.ok(iframe, "iframe should exist");
            assert.equal(iframe.style.width, "100%");

            handle.unmount();
        });
    });
});
