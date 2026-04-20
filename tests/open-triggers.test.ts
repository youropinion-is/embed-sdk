import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { createTrigger } from "../src/core/open-triggers.ts";
import { createTriggerMixin } from "../src/core/trigger-mixin.ts";

afterEach(() => {
    // Clean up any scroll/mouseleave listeners via destroy() — handled per-test
});

/** Simple resolve: ignores the action, always returns the same callback. */
const always = (fn: () => void) => () => fn;

describe("createTrigger", () => {
    describe("load trigger", () => {
        it("fires callback after a microtask delay", async () => {
            let fired = false;
            const trigger = createTrigger(
                { type: "load" },
                always(() => {
                    fired = true;
                })
            );
            trigger.listen();

            assert.ok(!fired, "should not fire synchronously");
            await new Promise((r) => setTimeout(r, 10));
            assert.ok(fired, "should fire after microtask");

            trigger.destroy();
        });

        it("destroy() cancels pending load before it fires", async () => {
            let fired = false;
            const trigger = createTrigger(
                { type: "load" },
                always(() => {
                    fired = true;
                })
            );
            trigger.listen();
            trigger.destroy(); // cancel immediately

            await new Promise((r) => setTimeout(r, 20));
            assert.ok(!fired, "callback must not fire after destroy()");
        });
    });

    describe("time trigger", () => {
        it("fires after the specified delay", async () => {
            let fired = false;
            const trigger = createTrigger(
                { type: "time", delay: 30 },
                always(() => {
                    fired = true;
                })
            );
            trigger.listen();

            await new Promise((r) => setTimeout(r, 10));
            assert.ok(!fired, "should not fire before delay");

            await new Promise((r) => setTimeout(r, 40));
            assert.ok(fired, "should fire after delay");

            trigger.destroy();
        });

        it("destroy() cancels a pending time trigger", async () => {
            let fired = false;
            const trigger = createTrigger(
                { type: "time", delay: 30 },
                always(() => {
                    fired = true;
                })
            );
            trigger.listen();

            await new Promise((r) => setTimeout(r, 10));
            trigger.destroy();

            await new Promise((r) => setTimeout(r, 40));
            assert.ok(!fired, "callback must not fire after destroy()");
        });

        it("uses default 3000ms when delay is undefined (verify not instant)", async () => {
            let fired = false;
            const trigger = createTrigger(
                { type: "time" },
                always(() => {
                    fired = true;
                })
            );
            trigger.listen();

            // Should NOT fire within 100ms (default is 3000ms)
            await new Promise((r) => setTimeout(r, 50));
            assert.ok(!fired, "should not fire well before default 3000ms delay");

            trigger.destroy();
        });
    });

    describe("scroll trigger", () => {
        it("fires when scroll percentage exceeds threshold", async () => {
            let fired = false;
            const trigger = createTrigger(
                { type: "scroll", threshold: 50 },
                always(() => {
                    fired = true;
                })
            );
            trigger.listen();

            // Mock scrollY to 50% of scrollable height
            Object.defineProperty(window, "scrollY", { value: 500, configurable: true });
            Object.defineProperty(document.documentElement, "scrollHeight", { value: 1100, configurable: true });
            Object.defineProperty(window, "innerHeight", { value: 100, configurable: true });
            // scrollPercent = 500 / (1100 - 100) = 500/1000 = 0.5 = 50%

            window.dispatchEvent(new window.Event("scroll"));
            await new Promise((r) => setTimeout(r, 0));

            assert.ok(fired, "should fire when scroll passes threshold");

            trigger.destroy();
        });

        it("does not fire when scroll is below threshold", async () => {
            let fired = false;
            const trigger = createTrigger(
                { type: "scroll", threshold: 80 },
                always(() => {
                    fired = true;
                })
            );
            trigger.listen();

            Object.defineProperty(window, "scrollY", { value: 100, configurable: true });
            Object.defineProperty(document.documentElement, "scrollHeight", { value: 1100, configurable: true });
            Object.defineProperty(window, "innerHeight", { value: 100, configurable: true });
            // scrollPercent = 100 / 1000 = 10%, threshold 80% not reached

            window.dispatchEvent(new window.Event("scroll"));
            await new Promise((r) => setTimeout(r, 0));

            assert.ok(!fired, "should not fire when below threshold");

            trigger.destroy();
        });

        it("fires only once even with multiple scroll events", async () => {
            let count = 0;
            const trigger = createTrigger(
                { type: "scroll", threshold: 50 },
                always(() => {
                    count++;
                })
            );
            trigger.listen();

            Object.defineProperty(window, "scrollY", { value: 600, configurable: true });
            Object.defineProperty(document.documentElement, "scrollHeight", { value: 1100, configurable: true });
            Object.defineProperty(window, "innerHeight", { value: 100, configurable: true });

            window.dispatchEvent(new window.Event("scroll"));
            window.dispatchEvent(new window.Event("scroll"));
            window.dispatchEvent(new window.Event("scroll"));
            await new Promise((r) => setTimeout(r, 0));

            assert.equal(count, 1, "callback must fire exactly once");

            trigger.destroy();
        });

        describe("with reverseAction (bidirectional)", () => {
            function setScroll(scrollY: number, scrollHeight = 1100, innerHeight = 100) {
                Object.defineProperty(window, "scrollY", { value: scrollY, configurable: true });
                Object.defineProperty(document.documentElement, "scrollHeight", {
                    value: scrollHeight,
                    configurable: true,
                });
                Object.defineProperty(window, "innerHeight", { value: innerHeight, configurable: true });
            }

            it("fires reverse when scrolling back below threshold", () => {
                let fwd = 0;
                let rev = 0;
                setScroll(0); // start at top
                const trigger = createTrigger(
                    { type: "scroll", threshold: 50, action: "hide", reverseAction: "show" },
                    (action) =>
                        action === "show"
                            ? () => {
                                  rev++;
                              }
                            : () => {
                                  fwd++;
                              }
                );
                trigger.listen();

                // Scroll past threshold → forward fires
                setScroll(600);
                window.dispatchEvent(new window.Event("scroll"));
                assert.equal(fwd, 1, "forward should fire once");
                assert.equal(rev, 0, "reverse should not fire yet");

                // Scroll back above threshold → reverse fires
                setScroll(100);
                window.dispatchEvent(new window.Event("scroll"));
                assert.equal(fwd, 1, "forward should still be 1");
                assert.equal(rev, 1, "reverse should fire once");

                trigger.destroy();
            });

            it("does not duplicate fires on same side of threshold", () => {
                let fwd = 0;
                let rev = 0;
                setScroll(0);
                const trigger = createTrigger(
                    { type: "scroll", threshold: 50, action: "hide", reverseAction: "show" },
                    (action) =>
                        action === "show"
                            ? () => {
                                  rev++;
                              }
                            : () => {
                                  fwd++;
                              }
                );
                trigger.listen();

                // Multiple scrolls past threshold → only one forward
                setScroll(600);
                window.dispatchEvent(new window.Event("scroll"));
                setScroll(700);
                window.dispatchEvent(new window.Event("scroll"));
                setScroll(800);
                window.dispatchEvent(new window.Event("scroll"));
                assert.equal(fwd, 1, "forward fires once despite repeated scrolls past threshold");

                trigger.destroy();
            });

            it("handles rapid back-and-forth crossing", () => {
                let fwd = 0;
                let rev = 0;
                setScroll(0);
                const trigger = createTrigger(
                    { type: "scroll", threshold: 50, action: "hide", reverseAction: "show" },
                    (action) =>
                        action === "show"
                            ? () => {
                                  rev++;
                              }
                            : () => {
                                  fwd++;
                              }
                );
                trigger.listen();

                // Cross forward
                setScroll(600);
                window.dispatchEvent(new window.Event("scroll"));
                // Cross back
                setScroll(100);
                window.dispatchEvent(new window.Event("scroll"));
                // Cross forward again
                setScroll(700);
                window.dispatchEvent(new window.Event("scroll"));
                // Cross back again
                setScroll(50);
                window.dispatchEvent(new window.Event("scroll"));

                assert.equal(fwd, 2, "forward should fire twice");
                assert.equal(rev, 2, "reverse should fire twice");

                trigger.destroy();
            });

            it("sets initial state from current scroll position", () => {
                let fwd = 0;
                let rev = 0;
                // Start already scrolled past threshold
                setScroll(600);
                const trigger = createTrigger(
                    { type: "scroll", threshold: 50, action: "hide", reverseAction: "show" },
                    (action) =>
                        action === "show"
                            ? () => {
                                  rev++;
                              }
                            : () => {
                                  fwd++;
                              }
                );
                trigger.listen();

                // Scrolling further past should NOT fire forward (already past)
                setScroll(700);
                window.dispatchEvent(new window.Event("scroll"));
                assert.equal(fwd, 0, "forward should not fire when already past threshold");

                // Scrolling back should fire reverse
                setScroll(100);
                window.dispatchEvent(new window.Event("scroll"));
                assert.equal(rev, 1, "reverse should fire when scrolling back");

                trigger.destroy();
            });

            it("works with a very low threshold (threshold: 1)", () => {
                let fwd = 0;
                let rev = 0;
                setScroll(0); // start at top
                const trigger = createTrigger(
                    { type: "scroll", threshold: 1, action: "hide", reverseAction: "show" },
                    (action) =>
                        action === "show"
                            ? () => {
                                  rev++;
                              }
                            : () => {
                                  fwd++;
                              }
                );
                trigger.listen();

                // Scroll past 1% → forward fires (hide)
                setScroll(20);
                window.dispatchEvent(new window.Event("scroll"));
                assert.equal(fwd, 1, "forward (hide) should fire");
                assert.equal(rev, 0, "reverse should not fire yet");

                // Scroll back to 0 → reverse fires (show)
                setScroll(0);
                window.dispatchEvent(new window.Event("scroll"));
                assert.equal(rev, 1, "reverse (show) should fire when scrolling back to top");

                // Scroll past again
                setScroll(50);
                window.dispatchEvent(new window.Event("scroll"));
                assert.equal(fwd, 2, "forward should fire again");

                trigger.destroy();
            });
        });
    });

    describe("exit trigger", () => {
        it("fires when mouse leaves near the top of viewport", async () => {
            let fired = false;
            const trigger = createTrigger(
                { type: "exit", sensitivity: 20 },
                always(() => {
                    fired = true;
                })
            );
            trigger.listen();

            document.dispatchEvent(new MouseEvent("mouseleave", { clientY: 5 }));
            await new Promise((r) => setTimeout(r, 0));

            assert.ok(fired, "should fire when mouse leaves at y ≤ sensitivity");

            trigger.destroy();
        });

        it("does not fire when mouse leaves outside the sensitivity zone", async () => {
            let fired = false;
            const trigger = createTrigger(
                { type: "exit", sensitivity: 20 },
                always(() => {
                    fired = true;
                })
            );
            trigger.listen();

            document.dispatchEvent(new MouseEvent("mouseleave", { clientY: 200 }));
            await new Promise((r) => setTimeout(r, 0));

            assert.ok(!fired, "should not fire when mouse leaves far from top");

            trigger.destroy();
        });

        it("fires only once even with multiple mouseleave events above threshold", async () => {
            let count = 0;
            const trigger = createTrigger(
                { type: "exit", sensitivity: 20 },
                always(() => {
                    count++;
                })
            );
            trigger.listen();

            document.dispatchEvent(new MouseEvent("mouseleave", { clientY: 0 }));
            document.dispatchEvent(new MouseEvent("mouseleave", { clientY: 0 }));
            await new Promise((r) => setTimeout(r, 0));

            assert.equal(count, 1, "callback must fire exactly once");

            trigger.destroy();
        });
    });
});

describe("createTriggerMixin integration", () => {
    function setScroll(scrollY: number, scrollHeight = 2000, innerHeight = 800) {
        Object.defineProperty(window, "scrollY", { value: scrollY, configurable: true });
        Object.defineProperty(document.documentElement, "scrollHeight", {
            value: scrollHeight,
            configurable: true,
        });
        Object.defineProperty(window, "innerHeight", { value: innerHeight, configurable: true });
    }

    it("button hide/show via scroll trigger with reverseAction (threshold: 1)", () => {
        // Simulates: button.addTrigger({ type: 'scroll', action: 'hide', reverseAction: 'show', threshold: 1 })
        let visible = true;
        const btnHandle = {
            show: () => {
                visible = true;
            },
            hide: () => {
                visible = false;
            },
        };

        type ButtonAction = "show" | "hide";
        function resolveAction(action: ButtonAction | undefined): () => void {
            return action === "hide" ? () => btnHandle.hide() : () => btnHandle.show();
        }

        const mixin = createTriggerMixin<{
            type: "scroll";
            action?: ButtonAction;
            reverseAction?: ButtonAction;
            threshold?: number;
        }>(resolveAction);

        setScroll(0);
        const remove = mixin.addTrigger({ type: "scroll", action: "hide", reverseAction: "show", threshold: 1 });

        assert.equal(visible, true, "button starts visible");

        // Scroll past 1% → hide
        setScroll(20);
        window.dispatchEvent(new window.Event("scroll"));
        assert.equal(visible, false, "button should be hidden after scrolling past 1%");

        // Scroll back to top → show
        setScroll(0);
        window.dispatchEvent(new window.Event("scroll"));
        assert.equal(visible, true, "button should be visible again after scrolling back to top");

        // Scroll past again → hide
        setScroll(50);
        window.dispatchEvent(new window.Event("scroll"));
        assert.equal(visible, false, "button should hide again on second scroll past threshold");

        // Scroll back → show
        setScroll(5);
        window.dispatchEvent(new window.Event("scroll"));
        assert.equal(visible, true, "button should show again on second scroll back");

        remove();
    });
});
