/**
 * Global theme management singleton.
 *
 * Allows setting a global theme that applies to all SDK instances.
 * Individual instances can still override with per-instance setTheme().
 */

import type { ThemeMode } from "../types.ts";
import { resolveTheme, type ThemeController } from "./theme.ts";

let globalThemeMode: ThemeMode = "auto";
const controllers = new Set<ThemeController>();
const listeners = new Set<(resolved: "light" | "dark") => void>();

/** Get the current global theme mode. */
export function getGlobalTheme(): ThemeMode {
    return globalThemeMode;
}

/** Set the global theme. Broadcasts to all registered instances and listeners. */
export function setGlobalTheme(mode: ThemeMode): void {
    globalThemeMode = mode;
    const resolved = resolveTheme(mode);
    for (const controller of controllers) {
        controller.setTheme(resolved);
    }
    for (const listener of listeners) {
        listener(resolved);
    }
}

/** Register a theme controller with the global manager. */
export function registerController(controller: ThemeController): void {
    controllers.add(controller);
}

/** Unregister a theme controller from the global manager. */
export function unregisterController(controller: ThemeController): void {
    controllers.delete(controller);
}

/** Subscribe a lightweight listener for global theme changes (for shell DOM updates). */
export function onGlobalThemeChange(listener: (resolved: "light" | "dark") => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}
