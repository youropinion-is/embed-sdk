/**
 * Utility functions shared across embed modes.
 */

/** Prefix for SDK-injected elements. */
export const CSS_PREFIX = "yo-embed";

/** z-index for overlays and modal content. */
export const Z_INDEX = 10001;

/** Convert a number or CSS string to a CSS value. */
export function toCss(value: number | string | undefined, fallback: string): string {
    if (value === undefined) return fallback;
    if (typeof value === "number") return `${value}px`;
    if (/^\d+(\.\d+)?$/.test(value)) return `${value}px`;
    return value;
}

/**
 * Inject CSS once per unique block into the document head.
 * Uses a DOM-based check so styles are re-injected after client-side
 * navigation (e.g. Astro View Transitions) swaps the <head>.
 */
let styleCounter = 0;
const cssIds = new Map<string, string>();

function getStyleId(css: string): string {
    let id = cssIds.get(css);
    if (!id) {
        id = `yo-embed-${++styleCounter}`;
        cssIds.set(css, id);
    }
    return id;
}

export function injectStyles(css: string): void {
    const id = getStyleId(css);
    if (document.querySelector(`style[data-yo-embed="${id}"]`)) return;
    const style = document.createElement("style");
    style.setAttribute("data-yo-embed", id);
    style.textContent = css;
    document.head.appendChild(style);
}

/** Determine accessible text color (white or black) based on background color. */
export function contrastColor(bgColor: string): string {
    // Simple luminance check for hex colors
    const hex = bgColor.replace("#", "");
    if (hex.length < 6) return "#ffffff";
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    // Relative luminance formula (sRGB)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#ffffff";
}

/** Check if viewport is mobile-sized. */
export function isMobile(): boolean {
    return window.innerWidth <= 768;
}
