/**
 * HTML data-attribute API for embedding surveys without writing JavaScript.
 *
 * Scans the DOM for elements with `data-yo-*` attributes and initializes embeds.
 *
 * Supported attributes:
 *   data-yo-widget="SURVEY_ID"         → inline widget
 *   data-yo-dialog="SURVEY_ID"         → dialog trigger button
 *   data-yo-drawer="SURVEY_ID"         → drawer trigger button
 *   data-yo-popover="SURVEY_ID"        → popover (auto-opens on click)
 *   data-yo-feedback-tab="SURVEY_ID"   → feedback tab (auto-creates edge button + drawer)
 *   data-yo-chat-bubble="SURVEY_ID"    → chat bubble (auto-creates FAB + popover)
 *
 * Options are specified as data-yo-* attributes in kebab-case:
 *   data-yo-theme="dark"               → sets global theme (applies to ALL embeds)
 *   data-yo-language="en"
 *   data-yo-auto-close="3000"
 *   data-yo-button-text="Give Feedback"
 *   etc.
 */

import { createButton } from "../buttons/button.ts";
import { createDialog } from "../surfaces/dialog.ts";
import { createDrawer } from "../surfaces/drawer.ts";
import { createPopover } from "../surfaces/popover.ts";
import { createWidget } from "../surfaces/widget.ts";
import type {
    ButtonHandle,
    ButtonOptions,
    ButtonTriggerConfig,
    ModalHandle,
    TriggerConfig,
    WidgetHandle,
    WidgetTriggerConfig,
} from "../types.ts";
import { setGlobalTheme } from "./theme-manager.ts";

type AnyHandle = WidgetHandle | ModalHandle | ButtonHandle;

/** Track active handles for cleanup. */
const activeHandles: AnyHandle[] = [];

/** Cleanup functions for scan-scoped event listeners (cleaned up on reloadAll). */
let scanCleanups: (() => void)[] = [];

/** Register a click listener that will be cleaned up on reloadAll. */
function addScanClickListener(el: HTMLElement, handler: () => void): void {
    el.addEventListener("click", handler);
    scanCleanups.push(() => el.removeEventListener("click", handler));
}

/** Convert kebab-case to camelCase. */
function kebabToCamel(str: string): string {
    return str.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

/** Nested attribute prefixes for button config (e.g., data-yo-button-text → button.text). */
const NESTED_PREFIXES = ["button"];

/** Parse data-yo-* attributes into an options object. */
function parseAttributes(el: HTMLElement): Record<string, unknown> {
    const opts: Record<string, unknown> = {};

    for (const attr of Array.from(el.attributes)) {
        if (!attr.name.startsWith("data-yo-")) continue;

        const rawKey = attr.name.slice(8); // Remove "data-yo-"
        // Skip the embed type attributes, triggers, and theme (parsed separately)
        if (
            ["widget", "dialog", "drawer", "popover", "feedback-tab", "chat-bubble", "triggers", "theme"].includes(
                rawKey
            )
        )
            continue;

        const value = attr.value;
        const parsed =
            value === "" || value === "true"
                ? true
                : value === "false"
                  ? false
                  : /^\d+$/.test(value)
                    ? parseInt(value, 10)
                    : value;

        // Check for nested prefixes: data-yo-button-text → { button: { text } }
        const prefix = NESTED_PREFIXES.find((p) => rawKey.startsWith(p + "-"));
        if (prefix) {
            const nestedKey = kebabToCamel(rawKey.slice(prefix.length + 1));
            const group = (opts[prefix] ?? {}) as Record<string, unknown>;
            group[nestedKey] = parsed;
            opts[prefix] = group;
        } else {
            opts[kebabToCamel(rawKey)] = parsed;
        }
    }

    return opts;
}

/** Parse the data-yo-triggers JSON attribute into an array of TriggerConfig. */
function parseTriggers(el: HTMLElement): TriggerConfig[] {
    const raw = el.getAttribute("data-yo-triggers");
    if (!raw) return [];
    try {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as TriggerConfig[];
    } catch {
        // Invalid JSON — ignore
    }
    return [];
}

/** Add all parsed triggers to a modal handle. */
function wireTriggers(el: HTMLElement, handle: ModalHandle): void {
    for (const config of parseTriggers(el)) {
        handle.addTrigger(config);
    }
}

/** Add all parsed triggers to a widget handle. */
function wireWidgetTriggers(el: HTMLElement, handle: WidgetHandle): void {
    for (const config of parseTriggers(el)) {
        handle.addTrigger(config as WidgetTriggerConfig);
    }
}

/** Parse data-yo-button-triggers and add to a button handle. */
function wireButtonTriggers(el: HTMLElement, handle: ButtonHandle): void {
    const raw = el.getAttribute("data-yo-button-triggers");
    if (!raw) return;
    try {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            for (const config of parsed as ButtonTriggerConfig[]) {
                handle.addTrigger(config);
            }
        }
    } catch {
        // Invalid JSON — ignore
    }
}

/** Scan the DOM and initialize all data-yo-* elements. */
export function scanAndInitialize(): void {
    scanCleanups = [];

    // Apply global theme from the first element that has data-yo-theme
    const themeEl = document.querySelector<HTMLElement>("[data-yo-theme]");
    if (themeEl) {
        const theme = themeEl.getAttribute("data-yo-theme");
        if (theme === "light" || theme === "dark" || theme === "auto") {
            setGlobalTheme(theme);
        }
    }

    // Widget (inline)
    document.querySelectorAll<HTMLElement>("[data-yo-widget]").forEach((el) => {
        if (el.hasAttribute("data-yo-initialized")) return;
        el.setAttribute("data-yo-initialized", "");

        const surveyId = el.getAttribute("data-yo-widget")!;
        const opts = parseAttributes(el);
        const handle = createWidget(surveyId, { ...opts, container: el } as any);
        wireWidgetTriggers(el, handle);
        activeHandles.push(handle);
    });

    // Dialog (button click → modal)
    document.querySelectorAll<HTMLElement>("[data-yo-dialog]").forEach((el) => {
        if (el.hasAttribute("data-yo-initialized")) return;
        el.setAttribute("data-yo-initialized", "");

        const surveyId = el.getAttribute("data-yo-dialog")!;
        const opts = parseAttributes(el);
        const handle = createDialog(surveyId, opts as any);
        wireTriggers(el, handle);
        addScanClickListener(el, () => handle.open());
        activeHandles.push(handle);
    });

    // Drawer (button click → side panel)
    document.querySelectorAll<HTMLElement>("[data-yo-drawer]").forEach((el) => {
        if (el.hasAttribute("data-yo-initialized")) return;
        el.setAttribute("data-yo-initialized", "");

        const surveyId = el.getAttribute("data-yo-drawer")!;
        const opts = parseAttributes(el);
        const handle = createDrawer(surveyId, opts as any);
        wireTriggers(el, handle);
        addScanClickListener(el, () => handle.open());
        activeHandles.push(handle);
    });

    // Feedback Tab (auto-creates edge button → opens drawer)
    document.querySelectorAll<HTMLElement>("[data-yo-feedback-tab]").forEach((el) => {
        if (el.hasAttribute("data-yo-initialized")) return;
        el.setAttribute("data-yo-initialized", "");

        const surveyId = el.getAttribute("data-yo-feedback-tab")!;
        const opts = parseAttributes(el);
        const buttonOpts = (opts.button ?? {}) as Record<string, unknown>;
        // Surface options = everything except button-prefixed keys
        const { button: _btn, ...surfaceOpts } = opts;

        const drawerHandle = createDrawer(surveyId, surfaceOpts as any);
        wireTriggers(el, drawerHandle);
        const btnHandle = createButton(drawerHandle, {
            position: (buttonOpts.position as ButtonOptions["position"]) ?? "right",
            text: buttonOpts.text as string | undefined,
            color: buttonOpts.color as string | undefined,
            icon: buttonOpts.icon as string | undefined,
            hideAfterSubmit: opts.hideAfterSubmit as boolean | undefined,
            initiallyHidden: buttonOpts.initiallyHidden as boolean | undefined,
        });
        wireButtonTriggers(el, btnHandle);
        activeHandles.push(drawerHandle, btnHandle);
    });

    // Chat Bubble (auto-creates FAB → opens popover)
    document.querySelectorAll<HTMLElement>("[data-yo-chat-bubble]").forEach((el) => {
        if (el.hasAttribute("data-yo-initialized")) return;
        el.setAttribute("data-yo-initialized", "");

        const surveyId = el.getAttribute("data-yo-chat-bubble")!;
        const opts = parseAttributes(el);
        const buttonOpts = (opts.button ?? {}) as Record<string, unknown>;
        const { button: _btn, ...surfaceOpts } = opts;

        const popoverHandle = createPopover(surveyId, surfaceOpts as any);
        wireTriggers(el, popoverHandle);
        const btnHandle = createButton(popoverHandle, {
            position: (buttonOpts.position as ButtonOptions["position"]) ?? "bottom-right",
            text: buttonOpts.text as string | undefined,
            color: buttonOpts.color as string | undefined,
            icon: buttonOpts.icon as string | undefined,
            tooltip: buttonOpts.tooltip as string | undefined,
            hideAfterSubmit: opts.hideAfterSubmit as boolean | undefined,
            initiallyHidden: buttonOpts.initiallyHidden as boolean | undefined,
        });
        wireButtonTriggers(el, btnHandle);
        activeHandles.push(popoverHandle, btnHandle);
    });

    // Popover (button click → corner panel)
    document.querySelectorAll<HTMLElement>("[data-yo-popover]").forEach((el) => {
        if (el.hasAttribute("data-yo-initialized")) return;
        el.setAttribute("data-yo-initialized", "");

        const surveyId = el.getAttribute("data-yo-popover")!;
        const opts = parseAttributes(el);
        const handle = createPopover(surveyId, opts as any);
        wireTriggers(el, handle);
        addScanClickListener(el, () => handle.open());
        activeHandles.push(handle);
    });
}

/** Destroy all active embeds and re-scan. */
export function reloadAll(): void {
    for (const cleanup of scanCleanups) cleanup();
    scanCleanups = [];

    for (const handle of activeHandles) {
        handle.unmount();
    }
    activeHandles.length = 0;

    // Remove initialized markers
    document.querySelectorAll("[data-yo-initialized]").forEach((el) => {
        el.removeAttribute("data-yo-initialized");
    });

    scanAndInitialize();
}
