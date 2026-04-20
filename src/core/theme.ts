/**
 * Theme detection and synchronization.
 *
 * Handles:
 * - Detecting the user's preferred color scheme via prefers-color-scheme
 * - Forwarding theme changes to the iframe via postMessage
 * - Applying theme to SDK-owned DOM elements (overlays, buttons)
 */

import type { ThemeMode } from "../types.ts";
import type { PostMessageBridge } from "./postmessage.ts";
import { getGlobalTheme, registerController, unregisterController } from "./theme-manager.ts";

export interface ThemeController {
    /** Get the current resolved theme ('light' or 'dark'). */
    getTheme(): "light" | "dark";

    /** Override the theme at runtime. Stops auto-detection. */
    setTheme(theme: "light" | "dark"): void;

    /** Start listening for system theme changes (when mode is 'auto'). */
    listen(): void;

    /** Stop listening and clean up. */
    destroy(): void;
}

/**
 * Resolve a ThemeMode to a concrete 'light' or 'dark' value.
 */
export function resolveTheme(mode: ThemeMode | undefined): "light" | "dark" {
    if (mode === "light" || mode === "dark") return mode;
    // auto or undefined: detect from system
    if (typeof window !== "undefined" && window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
}

/**
 * Create a theme controller that monitors system theme changes
 * and forwards them to the iframe + SDK DOM elements.
 *
 * Always uses the global theme setting (default: 'auto' / prefers-color-scheme).
 * Call setTheme() on the global manager to change the theme for all instances.
 */
export function createThemeController(bridge: PostMessageBridge): ThemeController {
    const effectiveMode = getGlobalTheme();
    let currentTheme = resolveTheme(effectiveMode);
    let mediaQuery: MediaQueryList | null = null;
    let overridden = false;

    function handleChange(e: MediaQueryListEvent) {
        if (overridden) return;
        if (effectiveMode !== "auto") return;
        currentTheme = e.matches ? "dark" : "light";
        bridge.sendThemeChange(currentTheme);
    }

    function stopListening() {
        if (mediaQuery) {
            mediaQuery.removeEventListener("change", handleChange);
            mediaQuery = null;
        }
    }

    const controller: ThemeController = {
        getTheme() {
            return currentTheme;
        },
        setTheme(theme: "light" | "dark") {
            overridden = true;
            stopListening();
            currentTheme = theme;
            bridge.sendThemeChange(theme);
        },
        listen() {
            if (effectiveMode === "auto" && typeof window !== "undefined" && window.matchMedia) {
                mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
                mediaQuery.addEventListener("change", handleChange);
            }
        },
        destroy() {
            stopListening();
            unregisterController(controller);
        },
    };

    registerController(controller);
    return controller;
}
