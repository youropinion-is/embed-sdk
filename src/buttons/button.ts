/**
 * Composable button that opens any modal surface.
 *
 * Visual style is auto-detected from position:
 *   - left/right → rotated edge tab (like the old FeedbackTab)
 *   - bottom-left/bottom-right → floating action button (like the old ChatBubble)
 *   - If no icon is set, always renders as a text button regardless of position
 *
 * Custom container mode: pass `{ container: el }` to skip built-in DOM
 * and only wire click → handle.toggle() + hideAfterSubmit behavior.
 *
 * Usage:
 *   const dialog = createDialog('survey/channel', { size: 80 })
 *   const btn = createButton(dialog, { position: 'right', text: 'Feedback' })
 */

import { getGlobalTheme, onGlobalThemeChange } from "../core/theme-manager.ts";
import { resolveTheme } from "../core/theme.ts";
import { createTriggerMixin } from "../core/trigger-mixin.ts";
import { contrastColor, CSS_PREFIX, injectStyles, Z_INDEX } from "../core/utils.ts";
import type { ButtonHandle, ButtonOptions, ButtonTriggerAction, ButtonTriggerConfig, ModalHandle } from "../types.ts";

const DEFAULT_COLOR = "#003366";

/** Chat-bubble icon SVG (default for FAB when icon is not provided but text is absent). */
const DEFAULT_FAB_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;

const BUTTON_CSS = `
.${CSS_PREFIX}-btn-tab {
    position: fixed;
    z-index: ${Z_INDEX};
    border: none;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.5px;
    padding: 10px 20px;
    white-space: nowrap;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    transition: opacity 0.2s, transform 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
}
.${CSS_PREFIX}-btn-tab:hover { opacity: 0.9; }
.${CSS_PREFIX}-btn-tab--right {
    right: 0;
    top: 50%;
    transform: rotate(-90deg) translateX(50%);
    transform-origin: right bottom;
    border-radius: 8px 8px 0 0;
}
.${CSS_PREFIX}-btn-tab--left {
    left: 0;
    top: 50%;
    transform: rotate(90deg) translateX(-50%);
    transform-origin: left bottom;
    border-radius: 8px 8px 0 0;
}
.${CSS_PREFIX}-btn-tab--hidden { opacity: 0; pointer-events: none; }
.${CSS_PREFIX}-btn-tab-icon { width: 16px; height: 16px; flex-shrink: 0; }
.${CSS_PREFIX}-btn-fab {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: ${Z_INDEX};
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s, box-shadow 0.2s;
    font-size: 24px;
    line-height: 1;
}
.${CSS_PREFIX}-btn-fab--bottom-left { right: auto; left: 20px; }
.${CSS_PREFIX}-btn-fab:hover { transform: scale(1.06); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25); }
.${CSS_PREFIX}-btn-fab--hidden { display: none; }
.${CSS_PREFIX}-btn-tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    right: 0;
    background: var(--yo-bg, #fff);
    color: var(--yo-fg, #333);
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 13px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    pointer-events: none;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 0.2s, transform 0.2s;
}
.${CSS_PREFIX}-btn-fab:hover .${CSS_PREFIX}-btn-tooltip {
    opacity: 1;
    transform: translateY(0);
}
.${CSS_PREFIX}--dark .${CSS_PREFIX}-btn-tooltip {
    --yo-bg: #2a2a2a;
    --yo-fg: #e5e5e5;
}
@media (prefers-color-scheme: dark) {
    .${CSS_PREFIX}-btn-tooltip:not(.${CSS_PREFIX}--light .${CSS_PREFIX}-btn-tooltip) {
        --yo-bg: #2a2a2a;
        --yo-fg: #e5e5e5;
    }
}
`;

function isEdgePosition(position: string): position is "left" | "right" {
    return position === "left" || position === "right";
}

/** Sanitize an HTML/SVG string to prevent XSS — strips scripts, event handlers, and javascript: URIs. */
function sanitizeHtml(html: string): DocumentFragment {
    const doc = new DOMParser().parseFromString(html, "text/html");
    for (const node of doc.querySelectorAll("script,style,iframe,object,embed,form")) node.remove();
    for (const el of doc.querySelectorAll("*")) {
        for (const attr of [...el.attributes]) {
            if (attr.name.startsWith("on") || /^\s*javascript:/i.test(attr.value)) {
                el.removeAttribute(attr.name);
            }
        }
    }
    const fragment = document.createDocumentFragment();
    fragment.append(...document.importNode(doc.body, true).childNodes);
    return fragment;
}

function renderIcon(el: HTMLElement, icon: string, className: string) {
    const iconSpan = document.createElement("span");
    iconSpan.className = className;
    if (icon.startsWith("http") || icon.startsWith("//")) {
        const img = document.createElement("img");
        img.src = icon;
        img.style.width = "100%";
        img.style.height = "100%";
        iconSpan.appendChild(img);
    } else if (icon.startsWith("<")) {
        iconSpan.appendChild(sanitizeHtml(icon));
    } else {
        iconSpan.textContent = icon;
    }
    el.appendChild(iconSpan);
}

export function createButton(handle: ModalHandle, options: ButtonOptions = {}): ButtonHandle {
    const position = options.position ?? "right";
    const colorLight = options.color ?? DEFAULT_COLOR;
    const colorDark = options.colorDark ?? colorLight;
    const textColorLight = options.textColor ?? contrastColor(colorLight);
    const textColorDark = options.textColorDark ?? contrastColor(colorDark);
    const text = options.text ?? "Feedback";

    // --- Custom container mode ---
    if (options.container) {
        const el = options.container;
        const onClick = () => handle.toggle();
        el.addEventListener("click", onClick);

        if (options.initiallyHidden) el.style.display = "none";

        if (options.hideAfterSubmit) {
            handle.on("submit", () => {
                el.style.display = "none";
            });
        }

        const btnHandle: ButtonHandle = {
            show() {
                el.style.display = "";
            },
            hide() {
                el.style.display = "none";
            },
            addTrigger: null!,
            clearTriggers: null!,
            unmount() {
                btnHandle.clearTriggers();
                el.removeEventListener("click", onClick);
            },
        };

        function resolveAction(action: ButtonTriggerAction | undefined): () => void {
            if (typeof action === "function") return () => action(btnHandle);
            return action === "hide" ? () => btnHandle.hide() : () => btnHandle.show();
        }

        const mixin = createTriggerMixin<ButtonTriggerConfig>(resolveAction);
        btnHandle.addTrigger = mixin.addTrigger;
        btnHandle.clearTriggers = mixin.clearTriggers;

        return btnHandle;
    }

    // --- Built-in DOM mode ---
    injectStyles(BUTTON_CSS);

    const useTab = isEdgePosition(position) || !options.icon;
    const btn = document.createElement("button");
    let unmounted = false;

    if (useTab) {
        // Edge tab style (or text-only floating)
        btn.className = `${CSS_PREFIX}-btn-tab`;
        if (options.className) btn.classList.add(...options.className.split(/\s+/).filter(Boolean));
        if (isEdgePosition(position)) {
            btn.classList.add(`${CSS_PREFIX}-btn-tab--${position}`);
        } else {
            // bottom-left / bottom-right — flush against bottom edge
            btn.style.position = "fixed";
            btn.style.bottom = "0";
            btn.style.transform = "none";
            if (position === "bottom-left") {
                btn.style.left = "24px";
            } else {
                btn.style.right = "24px";
            }
            btn.style.borderRadius = "8px 8px 0 0";
        }
        if (options.icon) {
            renderIcon(btn, options.icon, `${CSS_PREFIX}-btn-tab-icon`);
        }

        const textSpan = document.createElement("span");
        textSpan.textContent = text;
        btn.appendChild(textSpan);
    } else {
        // FAB style (icon-only floating button)
        btn.className = `${CSS_PREFIX}-btn-fab`;
        if (options.className) btn.classList.add(...options.className.split(/\s+/).filter(Boolean));
        if (position === "bottom-left") {
            btn.classList.add(`${CSS_PREFIX}-btn-fab--bottom-left`);
        }
        btn.setAttribute("aria-label", text);

        if (options.icon) {
            renderIcon(btn, options.icon, "");
        } else {
            btn.innerHTML = DEFAULT_FAB_ICON;
        }

        if (options.tooltip) {
            const tooltip = document.createElement("span");
            tooltip.className = `${CSS_PREFIX}-btn-tooltip`;
            tooltip.textContent = options.tooltip;
            btn.appendChild(tooltip);
        }
    }

    // Apply theme-aware colors
    function applyThemeColors(resolved: "light" | "dark") {
        const bg = resolved === "dark" ? colorDark : colorLight;
        const fg = resolved === "dark" ? textColorDark : textColorLight;
        btn.style.backgroundColor = bg;
        btn.style.color = fg;
        btn.classList.toggle(`${CSS_PREFIX}--dark`, resolved === "dark");
        btn.classList.toggle(`${CSS_PREFIX}--light`, resolved === "light");
    }

    const initialTheme = getGlobalTheme();
    applyThemeColors(initialTheme === "auto" ? resolveTheme("auto") : resolveTheme(initialTheme));
    const unsubTheme = onGlobalThemeChange((resolved) => {
        applyThemeColors(resolved);
    });

    // Mark element so frameworks can preserve it across page transitions
    btn.setAttribute("data-yo-embed-root", "");
    if (options.initiallyHidden) btn.style.display = "none";
    document.body.appendChild(btn);

    // Re-attach button if removed by SPA/framework navigation
    const observer = new MutationObserver(() => {
        if (!unmounted && btn.parentNode == null) {
            document.body.appendChild(btn);
        }
    });
    observer.observe(document.body, { childList: true });

    // Click handler
    btn.addEventListener("click", () => {
        // For edge tabs, hide button while surface is open
        if (isEdgePosition(position)) {
            btn.classList.add(`${CSS_PREFIX}-btn-tab--hidden`);
        }
        handle.toggle();
    });

    // Show tab again when surface closes
    if (isEdgePosition(position)) {
        handle.on("close", () => {
            btn.classList.remove(`${CSS_PREFIX}-btn-tab--hidden`);
        });
    }

    // Hide button after submit
    if (options.hideAfterSubmit) {
        handle.on("submit", () => {
            btn.style.display = "none";
        });
    }

    const btnHandle: ButtonHandle = {
        show() {
            btn.style.display = "";
        },
        hide() {
            btn.style.display = "none";
        },
        addTrigger: null!,
        clearTriggers: null!,
        unmount() {
            btnHandle.clearTriggers();
            unsubTheme();
            unmounted = true;
            observer.disconnect();
            btn.remove();
        },
    };

    function resolveAction(action: ButtonTriggerAction | undefined): () => void {
        if (typeof action === "function") return () => action(btnHandle);
        return action === "hide" ? () => btnHandle.hide() : () => btnHandle.show();
    }

    const mixin = createTriggerMixin<ButtonTriggerConfig>(resolveAction);
    btnHandle.addTrigger = mixin.addTrigger;
    btnHandle.clearTriggers = mixin.clearTriggers;

    return btnHandle;
}
