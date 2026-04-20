/**
 * Shared trigger infrastructure for all surfaces.
 *
 * Eliminates the duplicated Map + addTrigger + clearTriggers boilerplate
 * across modal-behavior, widget, and button.
 */

import type { TriggerMap } from "../types.ts";
import { createTrigger, type TriggerController } from "./open-triggers.ts";

/** Minimal trigger config shape — every surface-specific config extends this. */
interface BaseTriggerConfig {
    type: keyof TriggerMap<unknown>;
    action?: unknown;
}

export interface TriggerMixin<C extends BaseTriggerConfig> {
    addTrigger(this: void, config: C): () => void;
    clearTriggers(this: void): void;
}

/**
 * Create the shared addTrigger / clearTriggers pair.
 *
 * @param resolveAction — surface-specific function that maps an action value to a callback.
 * @param shouldSkip — optional predicate; when it returns true, addTrigger is a no-op
 *                     (used by modals for preventReopenOnClose).
 */
export function createTriggerMixin<C extends BaseTriggerConfig>(
    resolveAction: (action: C["action"]) => () => void,
    shouldSkip?: () => boolean
): TriggerMixin<C> {
    const triggers = new Map<symbol, TriggerController>();

    function clearTriggers() {
        for (const t of triggers.values()) t.destroy();
        triggers.clear();
    }

    function addTrigger(config: C): () => void {
        if (shouldSkip?.()) return () => {};
        const key = Symbol();
        const controller = createTrigger(config as any, resolveAction);
        triggers.set(key, controller);
        controller.listen();
        return () => {
            controller.destroy();
            triggers.delete(key);
        };
    }

    return { addTrigger, clearTriggers };
}
