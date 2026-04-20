import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createEmitter } from "../src/core/emitter.ts";

interface TestEvents {
    ping: { value: number };
    pong: { message: string };
}

describe("createEmitter", () => {
    describe("on / emit", () => {
        it("listener is called when event is emitted", () => {
            const emitter = createEmitter<TestEvents>();
            let received: { value: number } | null = null;

            emitter.on("ping", (p) => {
                received = p;
            });
            emitter.emit("ping", { value: 42 });

            assert.deepEqual(received, { value: 42 });
        });

        it("listener receives the exact payload", () => {
            const emitter = createEmitter<TestEvents>();
            const payloads: { value: number }[] = [];

            emitter.on("ping", (p) => payloads.push(p));
            emitter.emit("ping", { value: 1 });
            emitter.emit("ping", { value: 2 });

            assert.deepEqual(payloads, [{ value: 1 }, { value: 2 }]);
        });

        it("multiple listeners on the same event all fire", () => {
            const emitter = createEmitter<TestEvents>();
            const calls: number[] = [];

            emitter.on("ping", () => calls.push(1));
            emitter.on("ping", () => calls.push(2));
            emitter.emit("ping", { value: 0 });

            assert.deepEqual(calls, [1, 2]);
        });

        it("listeners on different events do not cross-fire", () => {
            const emitter = createEmitter<TestEvents>();
            let pingFired = false;
            let pongFired = false;

            emitter.on("ping", () => {
                pingFired = true;
            });
            emitter.on("pong", () => {
                pongFired = true;
            });

            emitter.emit("ping", { value: 0 });

            assert.ok(pingFired, "ping listener should fire");
            assert.ok(!pongFired, "pong listener must not fire");
        });

        it("emitting with no listeners does not throw", () => {
            const emitter = createEmitter<TestEvents>();
            assert.doesNotThrow(() => emitter.emit("ping", { value: 0 }));
        });
    });

    describe("off", () => {
        it("removed listener no longer fires", () => {
            const emitter = createEmitter<TestEvents>();
            let count = 0;
            const listener = () => {
                count++;
            };

            emitter.on("ping", listener);
            emitter.emit("ping", { value: 0 }); // count = 1
            emitter.off("ping", listener);
            emitter.emit("ping", { value: 0 }); // should not increment

            assert.equal(count, 1);
        });

        it("removing a listener does not affect other listeners on the same event", () => {
            const emitter = createEmitter<TestEvents>();
            const calls: number[] = [];

            const l1 = () => calls.push(1);
            const l2 = () => calls.push(2);

            emitter.on("ping", l1);
            emitter.on("ping", l2);
            emitter.off("ping", l1);
            emitter.emit("ping", { value: 0 });

            assert.deepEqual(calls, [2]);
        });

        it("off for a listener that was never added does not throw", () => {
            const emitter = createEmitter<TestEvents>();
            assert.doesNotThrow(() => emitter.off("ping", () => {}));
        });
    });

    describe("clear", () => {
        it("clear removes all listeners across all events", () => {
            const emitter = createEmitter<TestEvents>();
            let pingFired = false;
            let pongFired = false;

            emitter.on("ping", () => {
                pingFired = true;
            });
            emitter.on("pong", () => {
                pongFired = true;
            });

            emitter.clear();
            emitter.emit("ping", { value: 0 });
            emitter.emit("pong", { message: "hi" });

            assert.ok(!pingFired, "ping listener must not fire after clear");
            assert.ok(!pongFired, "pong listener must not fire after clear");
        });

        it("new listeners registered after clear fire normally", () => {
            const emitter = createEmitter<TestEvents>();

            emitter.on("ping", () => {});
            emitter.clear();

            let fired = false;
            emitter.on("ping", () => {
                fired = true;
            });
            emitter.emit("ping", { value: 0 });

            assert.ok(fired, "listener registered after clear should fire");
        });
    });
});
