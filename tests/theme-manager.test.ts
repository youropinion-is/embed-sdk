import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

describe("theme-manager", () => {
    afterEach(async () => {
        // Reset global theme between tests
        const { setGlobalTheme } = await import("../src/core/theme-manager.ts");
        setGlobalTheme("auto");
    });

    it("should default to auto theme", async () => {
        const { getGlobalTheme } = await import("../src/core/theme-manager.ts");
        assert.equal(getGlobalTheme(), "auto");
    });

    it("should update global theme", async () => {
        const { setGlobalTheme, getGlobalTheme } = await import("../src/core/theme-manager.ts");
        setGlobalTheme("dark");
        assert.equal(getGlobalTheme(), "dark");
        setGlobalTheme("light");
        assert.equal(getGlobalTheme(), "light");
    });

    it("should broadcast theme to registered controllers", async () => {
        const { setGlobalTheme, registerController, unregisterController } = await import("../src/core/theme-manager.ts");

        const calls: string[] = [];
        const controller = {
            setTheme(resolved: "light" | "dark") {
                calls.push(resolved);
            },
        };

        registerController(controller);
        setGlobalTheme("dark");
        assert.deepEqual(calls, ["dark"], "controller should receive dark theme");

        setGlobalTheme("light");
        assert.deepEqual(calls, ["dark", "light"], "controller should receive light theme");

        unregisterController(controller);
        setGlobalTheme("dark");
        assert.deepEqual(calls, ["dark", "light"], "unregistered controller should not receive broadcasts");
    });

    it("should not fail when broadcasting to empty set", async () => {
        const { setGlobalTheme } = await import("../src/core/theme-manager.ts");
        assert.doesNotThrow(() => setGlobalTheme("dark"));
    });
});
