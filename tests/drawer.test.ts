import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { postFromIframe } from "./helpers/messages.ts";
import { setGlobalTheme } from "../src/core/theme-manager.ts";
import { CSS_PREFIX } from "../src/core/utils.ts";
import { createDrawer } from "../src/surfaces/drawer.ts";

function getDrawerElements() {
    const drawer = document.querySelector(`.${CSS_PREFIX}-drawer`) as HTMLElement | null;
    const iframe = drawer?.querySelector("iframe") as HTMLIFrameElement | null;
    return { drawer, iframe };
}

afterEach(() => {
    for (const el of document.querySelectorAll(`.${CSS_PREFIX}-drawer`)) el.remove();
    for (const el of document.querySelectorAll(`.${CSS_PREFIX}-drawer-overlay`)) el.remove();
    for (const el of document.querySelectorAll(`style[data-yo-embed]`)) el.remove();
    document.body.style.overflow = "";
});

describe("createDrawer", () => {
    describe("waitForReady", () => {
        it("drawer should open after ready fires (regression: iframe loading=lazy deadlock)", async () => {
            // Bug: iframe had loading="lazy" which prevented the browser loading an offscreen
            // (transformed) iframe. The "ready" postMessage never fired so waitForReady
            // kept pendingShow=true forever and the drawer never became visible.
            const handle = createDrawer("test/ch", { waitForReady: true });
            handle.open();

            const { drawer } = getDrawerElements();
            assert.ok(drawer, "drawer element should exist in DOM");

            // Before ready: drawer should not be open
            assert.ok(
                !drawer.classList.contains(`${CSS_PREFIX}-drawer--open`),
                "drawer must not be visible before ready fires"
            );

            // Simulate survey-ready from the iframe
            postFromIframe(getDrawerElements().iframe, { message: "survey-ready", surveyId: "test/ch" });

            // After ready: drawer should be open
            assert.ok(
                drawer.classList.contains(`${CSS_PREFIX}-drawer--open`),
                "drawer must be visible after ready fires — fails if iframe had loading=lazy"
            );

            handle.unmount();
        });

        it("waitForReady: drawer shows --peek state while waiting for survey-ready", () => {
            // While waiting for survey-ready, the drawer slides in to a ~40px "peek"
            // position to signal loading. This also keeps the iframe partially in the
            // viewport (avoiding Chromium throttling of off-screen iframes).
            const handle = createDrawer("test/ch", { waitForReady: true });
            handle.open();

            const { drawer } = getDrawerElements();
            assert.ok(drawer, "drawer element should exist in DOM");

            // Drawer should be peeking: --peek present, --open absent
            assert.ok(
                drawer.classList.contains(`${CSS_PREFIX}-drawer--peek`),
                "drawer must have --peek class while waiting for survey-ready"
            );
            assert.ok(
                !drawer.classList.contains(`${CSS_PREFIX}-drawer--open`),
                "drawer must not have --open class before survey-ready"
            );

            // After ready: peek removed, open added
            postFromIframe(getDrawerElements().iframe, { message: "survey-ready", surveyId: "test/ch" });

            assert.ok(
                !drawer.classList.contains(`${CSS_PREFIX}-drawer--peek`),
                "drawer must not have --peek class after survey-ready"
            );
            assert.ok(
                drawer.classList.contains(`${CSS_PREFIX}-drawer--open`),
                "drawer must have --open class after survey-ready"
            );

            handle.unmount();
        });

        it("waitForReady: --peek is removed on close and re-shown on next open()", () => {
            const handle = createDrawer("test/ch", { waitForReady: true });
            handle.open();

            // Fire ready → drawer opens fully
            postFromIframe(getDrawerElements().iframe, { message: "survey-ready", surveyId: "test/ch" });

            const { drawer } = getDrawerElements();
            assert.ok(drawer!.classList.contains(`${CSS_PREFIX}-drawer--open`), "drawer open after ready");

            // Close → both --open and --peek are gone
            handle.close();
            assert.ok(!drawer!.classList.contains(`${CSS_PREFIX}-drawer--open`), "drawer must not be open after close");
            assert.ok(
                !drawer!.classList.contains(`${CSS_PREFIX}-drawer--peek`),
                "drawer must not have --peek after close (peek only shows while waiting)"
            );

            // Re-open → peek shown again while waiting for ready
            handle.open();
            assert.ok(
                drawer!.classList.contains(`${CSS_PREFIX}-drawer--peek`),
                "drawer must show --peek again on re-open while waiting for survey-ready"
            );

            handle.unmount();
        });

        it("drawer opens immediately without waitForReady", () => {
            const handle = createDrawer("test/ch", {});
            handle.open();

            const { drawer } = getDrawerElements();
            assert.ok(drawer, "drawer element should exist in DOM");
            assert.ok(
                drawer.classList.contains(`${CSS_PREFIX}-drawer--open`),
                "drawer should be immediately visible when waitForReady is not set"
            );

            handle.unmount();
        });
    });

    describe("default width", () => {
        it("default width is 420px", () => {
            const handle = createDrawer("test/ch", {});
            handle.open();

            const { drawer } = getDrawerElements();
            assert.ok(drawer, "drawer element should exist");
            assert.equal(drawer.style.width, "420px");

            handle.unmount();
        });
    });

    describe("explicit width", () => {
        it("should set width from number option (px)", () => {
            const handle = createDrawer("test/ch", { width: 500 });
            handle.open();

            const { drawer } = getDrawerElements();
            assert.ok(drawer, "drawer element should exist");
            assert.equal(drawer.style.width, "500px");

            handle.unmount();
        });

        it("should set width from string with unit", () => {
            const handle = createDrawer("test/ch", { width: "600px" });
            handle.open();

            const { drawer } = getDrawerElements();
            assert.ok(drawer, "drawer element should exist");
            assert.equal(drawer.style.width, "600px");

            handle.unmount();
        });

        it("should set width from numeric string without unit (toCss fix)", () => {
            // Playground reads values from text inputs as bare strings like "500"
            const handle = createDrawer("test/ch", { width: "500" });
            handle.open();

            const { drawer } = getDrawerElements();
            assert.ok(drawer, "drawer element should exist");
            assert.equal(drawer.style.width, "500px");

            handle.unmount();
        });
    });

    describe("position", () => {
        it("default position is right", () => {
            const handle = createDrawer("test/ch", {});
            handle.open();

            const { drawer } = getDrawerElements();
            assert.ok(drawer, "drawer element should exist");
            assert.ok(
                drawer.classList.contains(`${CSS_PREFIX}-drawer--right`),
                "--right class should be present by default"
            );
            assert.ok(!drawer.classList.contains(`${CSS_PREFIX}-drawer--left`), "--left class must not be present");

            handle.unmount();
        });

        it("position=left applies the --left class", () => {
            const handle = createDrawer("test/ch", { position: "left" });
            handle.open();

            const { drawer } = getDrawerElements();
            assert.ok(drawer, "drawer element should exist");
            assert.ok(drawer.classList.contains(`${CSS_PREFIX}-drawer--left`), "--left class should be present");
            assert.ok(!drawer.classList.contains(`${CSS_PREFIX}-drawer--right`), "--right class must not be present");

            handle.unmount();
        });
    });

    describe("modal", () => {
        it("modal=false (default) — no overlay added to DOM", () => {
            const handle = createDrawer("test/ch", {});
            handle.open();

            const overlay = document.querySelector(`.${CSS_PREFIX}-drawer-overlay`);
            assert.ok(!overlay, "overlay must not be in the DOM when modal=false");

            handle.unmount();
        });

        it("modal=true — overlay is added to DOM", () => {
            const handle = createDrawer("test/ch", { modal: true });
            handle.open();

            const overlay = document.querySelector(`.${CSS_PREFIX}-drawer-overlay`);
            assert.ok(overlay, "overlay should be present in DOM when modal=true");

            handle.unmount();
        });

        it("modal=true — overlay gets --open class when drawer opens", () => {
            const handle = createDrawer("test/ch", { modal: true });
            handle.open();

            const overlay = document.querySelector(`.${CSS_PREFIX}-drawer-overlay`);
            assert.ok(
                overlay?.classList.contains(`${CSS_PREFIX}-drawer-overlay--open`),
                "overlay should have --open class when drawer is open"
            );

            handle.unmount();
        });

        it("modal=true — body scroll is locked when drawer is open", () => {
            const handle = createDrawer("test/ch", { modal: true });
            handle.open();

            assert.equal(document.body.style.overflow, "hidden", "body scroll must be locked when modal drawer opens");

            handle.unmount();
        });

        it("modal=true — body scroll is restored when drawer closes", () => {
            const handle = createDrawer("test/ch", { modal: true });
            handle.open();
            handle.close();

            assert.equal(document.body.style.overflow, "", "body scroll must be restored after modal drawer closes");

            handle.unmount();
        });

        it("modal=true — Escape key closes the drawer", () => {
            const handle = createDrawer("test/ch", { modal: true });
            handle.open();

            document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

            const { drawer } = getDrawerElements();
            assert.ok(
                !drawer?.classList.contains(`${CSS_PREFIX}-drawer--open`),
                "drawer must close when Escape is pressed"
            );

            handle.unmount();
        });

        it("modal=true — overlay click closes the drawer", () => {
            const handle = createDrawer("test/ch", { modal: true });
            handle.open();

            const overlay = document.querySelector(`.${CSS_PREFIX}-drawer-overlay`) as HTMLElement | null;
            overlay?.click();

            const { drawer } = getDrawerElements();
            assert.ok(
                !drawer?.classList.contains(`${CSS_PREFIX}-drawer--open`),
                "drawer must close when overlay is clicked"
            );

            handle.unmount();
        });
    });

    describe("theme", () => {
        it("global theme 'dark' adds --dark class to the drawer element", () => {
            setGlobalTheme("dark");
            const handle = createDrawer("test/ch", {});
            handle.open();

            const { drawer } = getDrawerElements();
            assert.ok(drawer, "drawer element should exist");
            assert.ok(drawer.classList.contains(`${CSS_PREFIX}--dark`), "should have --dark class");

            handle.unmount();
            setGlobalTheme("auto");
        });

        it("global theme 'light' adds --light class (no --dark)", () => {
            setGlobalTheme("light");
            const handle = createDrawer("test/ch", {});
            handle.open();

            const { drawer } = getDrawerElements();
            assert.ok(drawer, "drawer element should exist");
            assert.ok(!drawer.classList.contains(`${CSS_PREFIX}--dark`), "should not have --dark class");
            assert.ok(drawer.classList.contains(`${CSS_PREFIX}--light`), "should have --light class");

            handle.unmount();
            setGlobalTheme("auto");
        });
    });

    describe("autoClose", () => {
        it("autoClose=0 — drawer stays open after survey-completed", async () => {
            const handle = createDrawer("test/ch", { autoClose: 0 });
            handle.open();

            postFromIframe(getDrawerElements().iframe, { message: "survey-completed", surveyId: "test/ch", responseId: "r1" });
            await new Promise((r) => setTimeout(r, 0));

            const { drawer } = getDrawerElements();
            assert.ok(drawer?.classList.contains(`${CSS_PREFIX}-drawer--open`), "drawer should still be open");

            handle.unmount();
        });

        it("autoClose=10 — drawer closes after the delay", async () => {
            const handle = createDrawer("test/ch", { autoClose: 10 });
            handle.open();

            postFromIframe(getDrawerElements().iframe, { message: "survey-completed", surveyId: "test/ch", responseId: "r1" });
            await new Promise((r) => setTimeout(r, 50));

            const { drawer } = getDrawerElements();
            assert.ok(
                !drawer?.classList.contains(`${CSS_PREFIX}-drawer--open`),
                "drawer should close after autoClose delay"
            );

            handle.unmount();
        });
    });

    describe("iframe", () => {
        it("iframe should not have loading=lazy", () => {
            const handle = createDrawer("test/ch", {});
            handle.open();

            const { iframe } = getDrawerElements();
            assert.ok(iframe, "iframe should exist");
            assert.ok(!iframe.hasAttribute("loading"), "iframe must not have loading attribute");

            handle.unmount();
        });

        it("iframe fills the drawer body at 100% width and height", () => {
            const handle = createDrawer("test/ch", {});
            handle.open();

            const { iframe } = getDrawerElements();
            assert.ok(iframe, "iframe should exist");
            assert.equal(iframe.style.width, "100%");
            assert.equal(iframe.style.height, "100%");

            handle.unmount();
        });
    });
});
