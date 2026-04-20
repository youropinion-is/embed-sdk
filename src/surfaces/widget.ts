/**
 * Widget mode: the core surface primitive.
 *
 * Widget owns the iframe lifecycle, postMessage bridge, theme controller,
 * and height management. All other surfaces (Dialog, Drawer, Popover) are
 * shells that embed a Widget inside them.
 *
 * Height model:
 *   - The iframe always fills its container (height: 100%).
 *   - When autoGrow/autoShrink is active, Widget manages container.style.height.
 *   - When neither is active, container sizing is the caller's responsibility
 *     (shell CSS or an explicit `height` option).
 *
 * Usage:
 *   const handle = createWidget('survey/channel', { container: el })
 *   handle.on('submit', (p) => console.log(p.responseId))
 */

import { createEmitter } from "../core/emitter.ts";
import { createIframeInstance, type IframeInstance } from "../core/iframe-manager.ts";
import { createTriggerMixin } from "../core/trigger-mixin.ts";
import { toCss } from "../core/utils.ts";
import type { EmbedEventMap, WidgetHandle, WidgetOptions, WidgetTriggerAction, WidgetTriggerConfig } from "../types.ts";

export function createWidget(surveyId: string, options: WidgetOptions): WidgetHandle {
    const { container } = options;
    if (!container) {
        throw new Error("[@youropinion/embed] createWidget requires a 'container' option.");
    }

    let instance: IframeInstance | null = null;
    const emitter = createEmitter<EmbedEventMap>();

    const autoGrow = options.autoGrow ?? true;
    const autoShrink = options.autoShrink ?? true;
    const waitForReady = options.waitForReady ?? false;
    const canGrow = autoGrow !== false;
    const canShrink = autoShrink !== false;
    const managingHeight = canGrow || canShrink;
    const maxHeight = typeof autoGrow === "number" ? autoGrow : Infinity;
    const minHeight = typeof autoShrink === "number" ? autoShrink : 0;

    // Track the container height so we can detect grow vs shrink
    let currentHeight = 0;
    let ready = false;
    let hasHeight = false;

    function init() {
        // Resize the container — only when widget owns height management.
        function applyHeight(h: number) {
            if (!managingHeight) return;
            const clamped = Math.min(Math.max(h, minHeight), maxHeight);
            const isGrow = clamped > currentHeight;
            const isShrink = clamped < currentHeight;
            if ((isGrow && canGrow) || (isShrink && canShrink) || currentHeight === 0) {
                container.style.height = `${clamped}px`;
                currentHeight = clamped;
            }
        }

        // Wire internal event listeners for height management and waitForReady
        emitter.on("ready", () => {
            ready = true;
            if (waitForReady && instance) {
                if (hasHeight) {
                    instance.iframe.style.opacity = "1";
                }
            }
        });

        emitter.on("heightChanged", (payload) => {
            hasHeight = true;
            applyHeight(payload.height);
            if (waitForReady && ready && instance && instance.iframe.style.opacity === "0") {
                instance.iframe.style.opacity = "1";
            }
        });

        instance = createIframeInstance(surveyId, options, emitter);

        // Seed currentHeight from the container's rendered size so the first
        // height event is correctly judged as a grow or shrink relative to the
        // initial shell height (e.g. 80vh for a dialog), not relative to 0.
        // Fall back to the numeric option when layout is unavailable (e.g. jsdom).
        if (currentHeight === 0) {
            const laidOut = container.offsetHeight;
            if (laidOut > 0) {
                currentHeight = laidOut;
            } else if (options.height !== undefined) {
                const parsed = typeof options.height === "number" ? options.height : parseFloat(options.height);
                if (!isNaN(parsed) && parsed > 0) currentHeight = parsed;
            }
        }
        const { iframe } = instance;

        // Iframe always fills its container.
        iframe.style.width = toCss(options.width, "100%");
        iframe.style.height = "100%";

        if (managingHeight) {
            // Widget manages container height: start at 0 (or specified) and grow/shrink.
            container.style.height = toCss(options.height, "0");
            if (typeof autoGrow === "number") container.style.maxHeight = `${autoGrow}px`;
            if (typeof autoShrink === "number") container.style.minHeight = `${autoShrink}px`;
        } else if (options.height !== undefined) {
            // Fixed height explicitly provided — size the container.
            container.style.height = toCss(options.height, "");
        }
        // Otherwise: container sizing is the caller's responsibility.

        // waitForReady: hide iframe content until survey-ready fires.
        if (waitForReady) {
            iframe.style.opacity = "0";
            iframe.style.transition = "opacity 0.3s ease";
        }

        container.appendChild(iframe);
    }

    let observer: IntersectionObserver | null = null;

    if (options.lazy && typeof IntersectionObserver !== "undefined") {
        observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    observer?.disconnect();
                    observer = null;
                    init();
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(container);
    } else {
        init();
    }

    function resolveAction(action: WidgetTriggerAction | undefined): () => void {
        if (typeof action === "function") return () => action(handle);
        switch (action) {
            case "refresh":
                return () => handle.refresh();
            case "preload":
                return () => handle.preload();
            case "unmount":
            default:
                return () => handle.unmount();
        }
    }

    const { addTrigger, clearTriggers } = createTriggerMixin<WidgetTriggerConfig>(resolveAction);

    const handle: WidgetHandle = {
        on: (event, callback) => emitter.on(event, callback),
        off: (event, callback) => emitter.off(event, callback),
        addTrigger,
        clearTriggers,
        preload() {
            if (!instance) {
                observer?.disconnect();
                observer = null;
                init();
            }
        },
        refresh() {
            instance?.refresh();
        },
        unmount() {
            clearTriggers();
            emitter.clear();
            observer?.disconnect();
            observer = null;
            instance?.destroy();
            instance = null;
        },
    };

    return handle;
}
