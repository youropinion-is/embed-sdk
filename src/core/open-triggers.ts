/**
 * Behavioral triggers for automatically opening modal embeds.
 *
 * Triggers:
 * - load: Open immediately when the page loads
 * - scroll: Open when the user scrolls past a threshold (0-100%)
 * - exit: Open when the user moves their mouse toward the top of the page (exit intent)
 * - time: Open after a specified delay in milliseconds
 *
 * Each trigger accepts a typed `TriggerConfig` (see types.ts).
 */

import type { TriggerConfig, WidgetTriggerConfig } from "../types.ts";

export interface TriggerController {
    /** Start observing the trigger condition. */
    listen(): void;

    /** Stop observing and clean up. */
    destroy(): void;
}

const STORAGE_PREFIX = "yo-embed-closed-";

/**
 * Check if the user has previously closed this survey and preventReopenOnClose is set.
 */
export function wasClosedByUser(surveyId: string): boolean {
    try {
        return localStorage.getItem(STORAGE_PREFIX + surveyId) === "1";
    } catch {
        return false;
    }
}

/**
 * Mark a survey as closed by the user (for preventReopenOnClose).
 */
export function markClosedByUser(surveyId: string): void {
    try {
        localStorage.setItem(STORAGE_PREFIX + surveyId, "1");
    } catch {
        // localStorage might be unavailable
    }
}

/**
 * Create a trigger controller from a typed TriggerConfig.
 *
 * @param config — trigger configuration including type-specific options.
 * @param resolve — maps an action value to a callable; provided by each surface.
 *
 * Most triggers are one-shot (listener removed after firing).
 * The scroll trigger reads `config.reverseAction` to decide whether to stay
 * active and fire the reverse callback when scrolling back below the threshold.
 */
export function createTrigger(
    config: TriggerConfig | WidgetTriggerConfig,
    resolve: (action: unknown) => () => void
): TriggerController {
    let cleanup: (() => void) | null = null;
    const callback = resolve(config.action);

    function fire() {
        cleanup?.();
        callback();
    }

    return {
        listen() {
            switch (config.type) {
                case "load": {
                    const id = setTimeout(fire, 0);
                    cleanup = () => clearTimeout(id);
                    break;
                }
                case "time": {
                    const delay = config.delay ?? 3000;
                    const id = setTimeout(fire, delay);
                    cleanup = () => clearTimeout(id);
                    break;
                }
                case "scroll": {
                    const threshold = (config.threshold ?? 50) / 100;
                    const reverse = config.reverseAction != null ? resolve(config.reverseAction) : undefined;

                    if (reverse) {
                        // Bidirectional: track state, fire forward/reverse on threshold crossing
                        const rev = reverse;
                        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                        let above = scrollHeight > 0 ? window.scrollY / scrollHeight < threshold : true;

                        function onScrollBidi() {
                            const h = document.documentElement.scrollHeight - window.innerHeight;
                            if (h <= 0) return;
                            const pct = window.scrollY / h;
                            const nowAbove = pct < threshold;
                            if (above && !nowAbove) {
                                above = false;
                                callback();
                            } else if (!above && nowAbove) {
                                above = true;
                                rev();
                            }
                        }
                        window.addEventListener("scroll", onScrollBidi, { passive: true });
                        cleanup = () => window.removeEventListener("scroll", onScrollBidi);
                    } else {
                        // One-shot: fire once when threshold is crossed
                        function onScroll() {
                            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                            if (scrollHeight <= 0) return;
                            const scrollPercent = window.scrollY / scrollHeight;
                            if (scrollPercent >= threshold) {
                                fire();
                            }
                        }
                        window.addEventListener("scroll", onScroll, { passive: true });
                        cleanup = () => window.removeEventListener("scroll", onScroll);
                    }
                    break;
                }
                case "exit": {
                    const sensitivity = config.sensitivity ?? 20;
                    function onMouseLeave(e: MouseEvent) {
                        if (e.clientY <= sensitivity) {
                            fire();
                        }
                    }
                    document.addEventListener("mouseleave", onMouseLeave);
                    cleanup = () => document.removeEventListener("mouseleave", onMouseLeave);
                    break;
                }
            }
        },
        destroy() {
            cleanup?.();
            cleanup = null;
        },
    };
}
