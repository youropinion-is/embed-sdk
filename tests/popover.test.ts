import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { postFromIframe } from "./helpers/messages.ts";
import { setGlobalTheme } from "../src/core/theme-manager.ts";
import { CSS_PREFIX } from "../src/core/utils.ts";
import { createPopover } from "../src/surfaces/popover.ts";

function getPanelElements() {
    const panel = document.querySelector(`.${CSS_PREFIX}-popover-panel`) as HTMLElement | null;
    const iframe = panel?.querySelector("iframe") as HTMLIFrameElement | null;
    return { panel, iframe };
}

afterEach(() => {
    for (const el of document.querySelectorAll(`.${CSS_PREFIX}-popover-panel`)) el.remove();
    for (const el of document.querySelectorAll(`style[data-yo-embed]`)) el.remove();
});

describe("createPopover", () => {
    describe("default sizing", () => {
        it("default width is 380px and height is 520px", () => {
            const handle = createPopover("test/ch", {});
            handle.open();

            const { panel } = getPanelElements();
            assert.ok(panel, "panel element should exist");
            assert.equal(panel.style.width, "380px");
            assert.equal(panel.style.height, "520px");

            handle.unmount();
        });
    });

    describe("explicit width and height", () => {
        it("should set width from number option (px)", () => {
            const handle = createPopover("test/ch", { width: 400 });
            handle.open();

            const { panel } = getPanelElements();
            assert.ok(panel, "panel element should exist");
            assert.equal(panel.style.width, "400px");

            handle.unmount();
        });

        it("should set width from string with unit", () => {
            const handle = createPopover("test/ch", { width: "500px" });
            handle.open();

            const { panel } = getPanelElements();
            assert.ok(panel, "panel element should exist");
            assert.equal(panel.style.width, "500px");

            handle.unmount();
        });

        it("should set width from numeric string without unit (toCss fix)", () => {
            // Playground reads values from text inputs as bare strings like "400"
            const handle = createPopover("test/ch", { width: "400" });
            handle.open();

            const { panel } = getPanelElements();
            assert.ok(panel, "panel element should exist");
            assert.equal(panel.style.width, "400px");

            handle.unmount();
        });

        it("should set height from number option (px)", () => {
            const handle = createPopover("test/ch", { height: 300 });
            handle.open();

            const { panel } = getPanelElements();
            assert.ok(panel, "panel element should exist");
            assert.equal(panel.style.height, "300px");

            handle.unmount();
        });

        it("should set height from string with unit", () => {
            const handle = createPopover("test/ch", { height: "400px" });
            handle.open();

            const { panel } = getPanelElements();
            assert.ok(panel, "panel element should exist");
            assert.equal(panel.style.height, "400px");

            handle.unmount();
        });

        it("should set both explicit width and height", () => {
            const handle = createPopover("test/ch", { width: "420px", height: "600px" });
            handle.open();

            const { panel } = getPanelElements();
            assert.ok(panel, "panel element should exist");
            assert.equal(panel.style.width, "420px");
            assert.equal(panel.style.height, "600px");

            handle.unmount();
        });
    });

    describe("position", () => {
        it("default position is bottom-right", () => {
            const handle = createPopover("test/ch", {});
            handle.open();

            const { panel } = getPanelElements();
            assert.ok(panel, "panel element should exist");
            assert.ok(
                panel.classList.contains(`${CSS_PREFIX}-popover-panel--bottom-right`),
                "bottom-right class should be present by default"
            );
            assert.ok(
                !panel.classList.contains(`${CSS_PREFIX}-popover-panel--bottom-left`),
                "bottom-left class must not be present"
            );

            handle.unmount();
        });

        it("position=bottom-left applies the correct class", () => {
            const handle = createPopover("test/ch", { position: "bottom-left" });
            handle.open();

            const { panel } = getPanelElements();
            assert.ok(panel, "panel element should exist");
            assert.ok(
                panel.classList.contains(`${CSS_PREFIX}-popover-panel--bottom-left`),
                "bottom-left class should be present"
            );
            assert.ok(
                !panel.classList.contains(`${CSS_PREFIX}-popover-panel--bottom-right`),
                "bottom-right class must not be present"
            );

            handle.unmount();
        });
    });

    describe("theme", () => {
        it("global theme 'dark' adds --dark class to the panel", () => {
            setGlobalTheme("dark");
            const handle = createPopover("test/ch", {});
            handle.open();

            const { panel } = getPanelElements();
            assert.ok(panel, "panel element should exist");
            assert.ok(panel.classList.contains(`${CSS_PREFIX}--dark`), "should have --dark class");

            handle.unmount();
            setGlobalTheme("auto");
        });

        it("global theme 'light' adds --light class (no --dark)", () => {
            setGlobalTheme("light");
            const handle = createPopover("test/ch", {});
            handle.open();

            const { panel } = getPanelElements();
            assert.ok(panel, "panel element should exist");
            assert.ok(!panel.classList.contains(`${CSS_PREFIX}--dark`), "should not have --dark class");
            assert.ok(panel.classList.contains(`${CSS_PREFIX}--light`), "should have --light class");

            handle.unmount();
            setGlobalTheme("auto");
        });
    });

    describe("autoGrow", () => {
        it("autoGrow=true — panel opens at default height with maxHeight calc(100vh - 60px)", () => {
            const handle = createPopover("test/ch", { autoGrow: true });
            handle.open();

            const { panel } = getPanelElements();
            assert.ok(panel, "panel element should exist");
            assert.equal(panel.style.maxHeight, "calc(100vh - 60px)");

            handle.unmount();
        });

        it("autoGrow=600 (number) — maxHeight is 600px", () => {
            const handle = createPopover("test/ch", { autoGrow: 600 });
            handle.open();

            const { panel } = getPanelElements();
            assert.ok(panel, "panel element should exist");
            assert.equal(panel.style.maxHeight, "600px");

            handle.unmount();
        });

        it("autoShrink=200 (number) — minHeight is 200px", () => {
            const handle = createPopover("test/ch", { height: 400, autoGrow: true, autoShrink: 200 });
            handle.open();

            const { panel } = getPanelElements();
            assert.ok(panel, "panel element should exist");
            assert.equal(panel.style.minHeight, "200px");

            handle.unmount();
        });

        it("autoGrow=true — heightChanged above initial height grows the panel", async () => {
            const handle = createPopover("test/ch", { height: 400, autoGrow: true, autoShrink: false });
            handle.open();

            postFromIframe(getPanelElements().iframe, { message: "survey-height-changed", surveyId: "test/ch", height: 600 });
            await new Promise((r) => setTimeout(r, 0));

            const { panel } = getPanelElements();
            assert.ok(panel, "panel element should exist");
            assert.equal(panel.style.height, "600px", "panel should grow to 600px");

            handle.unmount();
        });

        it("autoShrink=false — heightChanged below initial height does not shrink the panel", async () => {
            const handle = createPopover("test/ch", { height: 400, autoGrow: true, autoShrink: false });
            handle.open();

            postFromIframe(getPanelElements().iframe, { message: "survey-height-changed", surveyId: "test/ch", height: 200 });
            await new Promise((r) => setTimeout(r, 0));

            const { panel } = getPanelElements();
            assert.ok(panel, "panel element should exist");
            assert.equal(panel.style.height, "400px", "panel must not shrink when autoShrink=false");

            handle.unmount();
        });

        it("autoShrink=true — heightChanged below initial height shrinks the panel", async () => {
            const handle = createPopover("test/ch", { height: 400, autoGrow: true, autoShrink: true });
            handle.open();

            postFromIframe(getPanelElements().iframe, { message: "survey-height-changed", surveyId: "test/ch", height: 200 });
            await new Promise((r) => setTimeout(r, 0));

            const { panel } = getPanelElements();
            assert.ok(panel, "panel element should exist");
            assert.equal(panel.style.height, "200px", "panel should shrink to 200px when autoShrink=true");

            handle.unmount();
        });
    });

    describe("waitForReady", () => {
        it("panel should not be visible before survey-ready fires", () => {
            const handle = createPopover("test/ch", { waitForReady: true });
            handle.open();

            const { panel } = getPanelElements();
            assert.ok(panel, "panel element should exist");
            assert.ok(
                !panel.classList.contains(`${CSS_PREFIX}-popover-panel--open`),
                "panel should not be visible before ready"
            );

            handle.unmount();
        });

        it("panel becomes visible after survey-ready fires", () => {
            const handle = createPopover("test/ch", { waitForReady: true });
            handle.open();

            postFromIframe(getPanelElements().iframe, { message: "survey-ready", surveyId: "test/ch" });

            const { panel } = getPanelElements();
            assert.ok(panel, "panel element should exist");
            assert.ok(
                panel.classList.contains(`${CSS_PREFIX}-popover-panel--open`),
                "panel should be visible after ready event"
            );

            handle.unmount();
        });

        it("panel opens immediately without waitForReady", () => {
            const handle = createPopover("test/ch", {});
            handle.open();

            const { panel } = getPanelElements();
            assert.ok(panel, "panel element should exist");
            assert.ok(
                panel.classList.contains(`${CSS_PREFIX}-popover-panel--open`),
                "panel should be immediately visible when waitForReady is not set"
            );

            handle.unmount();
        });
    });

    describe("autoClose", () => {
        it("autoClose=0 — panel stays open after survey-completed", async () => {
            const handle = createPopover("test/ch", { autoClose: 0 });
            handle.open();

            postFromIframe(getPanelElements().iframe, { message: "survey-completed", surveyId: "test/ch", responseId: "r1" });
            await new Promise((r) => setTimeout(r, 0));

            const { panel } = getPanelElements();
            assert.ok(panel?.classList.contains(`${CSS_PREFIX}-popover-panel--open`), "panel should still be open");

            handle.unmount();
        });

        it("autoClose=10 — panel closes after the delay", async () => {
            const handle = createPopover("test/ch", { autoClose: 10 });
            handle.open();

            postFromIframe(getPanelElements().iframe, { message: "survey-completed", surveyId: "test/ch", responseId: "r1" });
            await new Promise((r) => setTimeout(r, 50));

            const { panel } = getPanelElements();
            assert.ok(
                !panel?.classList.contains(`${CSS_PREFIX}-popover-panel--open`),
                "panel should close after autoClose delay"
            );

            handle.unmount();
        });
    });

    describe("iframe", () => {
        it("iframe should not have loading=lazy", () => {
            const handle = createPopover("test/ch", {});
            handle.open();

            const { iframe } = getPanelElements();
            assert.ok(iframe, "iframe should exist");
            assert.ok(!iframe.hasAttribute("loading"), "iframe must not have loading attribute");

            handle.unmount();
        });

        it("iframe fills the panel at 100% width and height", () => {
            const handle = createPopover("test/ch", { width: "420px", height: "600px" });
            handle.open();

            const { iframe } = getPanelElements();
            assert.ok(iframe, "iframe should exist");
            assert.equal(iframe.style.width, "100%");
            assert.equal(iframe.style.height, "100%");

            handle.unmount();
        });
    });
});
