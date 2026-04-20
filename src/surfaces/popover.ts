/**
 * Popover mode: corner panel anchored to the viewport.
 *
 * Shell responsibilities: panel DOM, positioning, click-outside (when modal), Escape key.
 * Widget + iframe + theme + auto-close: handled by createModalBehavior.
 *
 * For the FAB trigger + popover combo, use createButton(popoverHandle, { position: 'bottom-right' }).
 *
 * Usage:
 *   const { open, close, toggle } = createPopover('SURVEY_ID', { position: 'bottom-right' })
 */

import { createModalBehavior } from "../core/modal-behavior.ts";
import { getGlobalTheme, onGlobalThemeChange } from "../core/theme-manager.ts";
import { resolveTheme } from "../core/theme.ts";
import { CSS_PREFIX, Z_INDEX, injectStyles, toCss } from "../core/utils.ts";
import type { ModalHandle, PopoverOptions } from "../types.ts";

const POPOVER_CSS = `
.${CSS_PREFIX}-popover-panel {
    position: fixed;
    z-index: ${Z_INDEX + 1};
    background: var(--yo-bg, #fff);
    border-radius: var(--yo-border-radius, 12px);
    box-shadow: var(--yo-shadow, 0 12px 40px rgba(0, 0, 0, 0.2));
    overflow: hidden;
    opacity: 0;
    visibility: hidden;
    transform: scale(0.9) translateY(10px);
    transition: opacity 0.25s ease, visibility 0.25s ease, transform 0.25s ease;
}
.${CSS_PREFIX}-popover-panel--bottom-right {
    bottom: 20px;
    right: 20px;
    transform-origin: bottom right;
}
.${CSS_PREFIX}-popover-panel--bottom-left {
    bottom: 20px;
    left: 20px;
    transform-origin: bottom left;
}
.${CSS_PREFIX}-popover-panel--open {
    opacity: 1;
    visibility: visible;
    transform: scale(1) translateY(0);
}
.${CSS_PREFIX}-popover-panel-close {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 1;
    background: rgba(0, 0, 0, 0.1);
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: inherit;
    font-size: 14px;
    line-height: 1;
    transition: background 0.15s;
}
.${CSS_PREFIX}-popover-panel-close:hover {
    background: rgba(0, 0, 0, 0.2);
}
.${CSS_PREFIX}-popover-panel.${CSS_PREFIX}--dark {
    --yo-bg: #1a1a1a;
}
.${CSS_PREFIX}-popover-panel.${CSS_PREFIX}--dark .${CSS_PREFIX}-popover-panel-close {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}
@media (prefers-color-scheme: dark) {
    .${CSS_PREFIX}-popover-panel:not(.${CSS_PREFIX}--light) {
        --yo-bg: #1a1a1a;
    }
    .${CSS_PREFIX}-popover-panel:not(.${CSS_PREFIX}--light) .${CSS_PREFIX}-popover-panel-close {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
    }
}
@media (max-width: 768px) {
    .${CSS_PREFIX}-popover-panel {
        bottom: 0;
        right: 0;
        left: 0;
        width: 100vw !important;
        height: 85vh !important;
        border-radius: 12px 12px 0 0;
        transform-origin: bottom center;
    }
}
`;

export function createPopover(surveyId: string, options: PopoverOptions = {}): ModalHandle {
    injectStyles(POPOVER_CSS);

    const position = options.position || "bottom-right";
    const isModal = options.modal ?? false;
    const autoGrow = options.autoGrow ?? false;
    const autoShrink = options.autoShrink ?? false;

    // --- DOM shell ---
    const panel = document.createElement("div");
    panel.className = `${CSS_PREFIX}-popover-panel ${CSS_PREFIX}-popover-panel--${position}`;
    const baseHeight = options.height ?? "520px";
    panel.style.width = toCss(options.width, "380px");
    panel.style.height = toCss(baseHeight, "");
    if (autoGrow !== false || autoShrink !== false) {
        panel.style.maxHeight = typeof autoGrow === "number" ? `${autoGrow}px` : "calc(100vh - 60px)";
        if (typeof autoShrink === "number") panel.style.minHeight = `${autoShrink}px`;
    }
    // Apply theme from global state: explicit dark/light via class, auto via @media fallback
    const globalTheme = getGlobalTheme();
    const initialResolved = resolveTheme(globalTheme);
    panel.classList.toggle(`${CSS_PREFIX}--dark`, initialResolved === "dark" && globalTheme !== "auto");
    panel.classList.toggle(`${CSS_PREFIX}--light`, initialResolved === "light" && globalTheme !== "auto");

    // Subscribe to global theme changes so the shell updates even before open()
    const unsubTheme = onGlobalThemeChange((resolved) => {
        panel.classList.toggle(`${CSS_PREFIX}--dark`, resolved === "dark");
        panel.classList.toggle(`${CSS_PREFIX}--light`, resolved === "light");
    });

    const panelClose = document.createElement("button");
    panelClose.className = `${CSS_PREFIX}-popover-panel-close`;
    panelClose.innerHTML = "&#10005;";
    panelClose.setAttribute("aria-label", "Close survey");
    panelClose.addEventListener("click", () => handle.close());

    panel.appendChild(panelClose);
    document.body.appendChild(panel);

    function onKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") handle.close();
    }
    function onClickOutside(e: MouseEvent) {
        if (!panel.contains(e.target as Node)) handle.close();
    }

    // --- Shared behavior ---
    const handle = createModalBehavior(
        surveyId,
        panel,
        options,
        { autoGrow, autoShrink, height: baseHeight },
        {
            onShow() {
                if (!document.body.contains(panel)) document.body.appendChild(panel);
                panel.classList.add(`${CSS_PREFIX}-popover-panel--open`);
                document.addEventListener("keydown", onKeyDown);
                if (isModal) document.addEventListener("click", onClickOutside, true);
            },
            onHide() {
                panel.classList.remove(`${CSS_PREFIX}-popover-panel--open`);
                document.removeEventListener("keydown", onKeyDown);
                document.removeEventListener("click", onClickOutside, true);
            },
            onUnmount() {
                unsubTheme();
                panel.remove();
                document.removeEventListener("keydown", onKeyDown);
                document.removeEventListener("click", onClickOutside, true);
            },
        }
    );

    return handle;
}
