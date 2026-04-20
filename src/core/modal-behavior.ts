/**
 * Shared modal behavior for all modal surfaces (Dialog, Drawer, Popover).
 *
 * Handles all the logic that is identical across every modal surface:
 *   - Lazy widget creation and keepSession teardown
 *   - autoClose timer (triggered via 'submit' event)
 *   - preventReopenOnClose + localStorage tracking
 *   - Event forwarding from widget → modal handle
 *   - toggle()
 *   - Auto-open trigger wiring
 *   - refresh() / unmount() delegation
 *
 * Each surface provides ModalHooks to handle the surface-specific DOM parts:
 *   onShow()     — add open classes, lock scroll, start event listeners
 *   onHide()     — remove open classes, unlock scroll, stop event listeners
 *   onUnmount()  — remove surface DOM elements from the page
 *
 * Theme is handled independently by each surface via onGlobalThemeChange().
 */

import { createWidget } from "../surfaces/widget.ts";
import type {
    EmbedEventMap,
    ModalEventMap,
    ModalHandle,
    ModalOptions,
    TriggerAction,
    TriggerConfig,
    WidgetHandle,
    WidgetOptions,
} from "../types.ts";
import { createEmitter } from "./emitter.ts";
import { markClosedByUser, wasClosedByUser } from "./open-triggers.ts";
import { createTriggerMixin } from "./trigger-mixin.ts";

export interface ModalHooks {
    /** Called when the surface becomes visible. */
    onShow(): void;
    /** Called when open() is invoked but waitForReady is still pending (survey not yet ready). */
    onPendingShow?(): void;
    /** Called when the surface hides (before widget teardown). */
    onHide(): void;
    /** Called during unmount — remove surface DOM from the page. */
    onUnmount(): void;
}

/**
 * Wire up shared modal state and return a complete ModalHandle.
 *
 * @param surveyId   - Survey identifier (includes channel: "survey/channel")
 * @param container  - The element that Widget will mount into
 * @param options    - ModalOptions from the surface
 * @param widgetOverrides - Extra WidgetOptions passed to createWidget (e.g. autoGrow: false)
 * @param hooks      - Surface-specific DOM callbacks
 */
export function createModalBehavior(
    surveyId: string,
    container: HTMLElement,
    options: ModalOptions,
    widgetOverrides: Partial<WidgetOptions>,
    hooks: ModalHooks
): ModalHandle {
    let isOpen = false;
    let widgetHandle: WidgetHandle | null = null;
    let autoCloseTimer: ReturnType<typeof setTimeout> | null = null;
    let widgetReady = false;
    let pendingShow = false;

    const emitter = createEmitter<ModalEventMap>();

    // Events we forward from widget → modal handle
    const FORWARDED_EVENTS: (keyof EmbedEventMap)[] = [
        "ready",
        "started",
        "submit",
        "questionChanged",
        "heightChanged",
    ];

    function ensureWidget() {
        if (!widgetHandle) {
            widgetHandle = createWidget(surveyId, {
                ...(options as WidgetOptions),
                container,
                ...widgetOverrides,
                // The iframe must fill the modal container at 100% — don't let
                // surface-level width leak through (the container is already
                // sized by the surface shell).
                width: undefined,
                // Modal handles waitForReady at the container level (hide the
                // whole panel), so never let the widget hide the iframe itself.
                waitForReady: false,
            });

            // Forward widget events through the modal emitter
            for (const event of FORWARDED_EVENTS) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                widgetHandle.on(event, ((payload: unknown) => {
                    (emitter.emit as (e: string, p: unknown) => void)(event as string, payload);
                }) as any);
            }

            // When the survey is ready, show the panel if open() is waiting
            widgetHandle.on("ready", () => {
                widgetReady = true;
                if (pendingShow) {
                    pendingShow = false;
                    hooks.onShow();
                }
            });

            // Wire autoClose on submit
            widgetHandle.on("submit", () => {
                const delay =
                    options.autoClose === true ? 3000 : typeof options.autoClose === "number" ? options.autoClose : 0;
                if (delay > 0) {
                    autoCloseTimer = setTimeout(() => close(), delay);
                }
            });
        }
    }

    function open() {
        if (isOpen) return;
        isOpen = true;
        ensureWidget();

        // When waitForReady is set, defer showing the panel until the survey
        // signals it is loaded. This avoids a flash of the loading/splash
        // screen inside the modal.
        if (options.waitForReady && !widgetReady) {
            pendingShow = true;
            hooks.onPendingShow?.();
        } else {
            hooks.onShow();
        }

        emitter.emit("open", undefined as never);
    }

    function close() {
        if (!isOpen) return;
        isOpen = false;
        pendingShow = false;
        hooks.onHide();

        if (autoCloseTimer) {
            clearTimeout(autoCloseTimer);
            autoCloseTimer = null;
        }

        if (options.preventReopenOnClose) {
            markClosedByUser(surveyId);
        }

        emitter.emit("close", { surveyId });

        if (!options.keepSession && widgetHandle) {
            widgetHandle.unmount();
            widgetHandle = null;
            widgetReady = false;
        }
    }

    function toggle() {
        if (isOpen) {
            close();
        } else {
            open();
        }
    }

    function resolveAction(action: TriggerAction | undefined): () => void {
        if (typeof action === "function") return () => action(handle);
        switch (action) {
            case "close":
                return close;
            case "preload":
                return () => handle.preload();
            case "toggle":
                return toggle;
            case "unmount":
                return () => handle.unmount();
            case "open":
            default:
                return open;
        }
    }

    const { addTrigger, clearTriggers } = createTriggerMixin<TriggerConfig>(
        resolveAction,
        options.preventReopenOnClose ? () => wasClosedByUser(surveyId) : undefined
    );

    // Build the handle object — we need a reference for resolveAction callbacks
    const handle: ModalHandle = {
        on: (event, callback) => emitter.on(event, callback),
        off: (event, callback) => emitter.off(event, callback),
        preload() {
            if (!options.keepSession) {
                throw new Error(
                    "embed-sdk: preload() requires keepSession. Without it the widget is destroyed on close, defeating the purpose of preloading."
                );
            }
            ensureWidget();
        },
        open,
        close,
        toggle,
        addTrigger,
        clearTriggers,
        refresh() {
            widgetHandle?.refresh();
        },
        unmount() {
            pendingShow = false;
            widgetReady = false;
            clearTriggers();
            emitter.clear();
            widgetHandle?.unmount();
            widgetHandle = null;
            hooks.onUnmount();
        },
    };

    return handle;
}
