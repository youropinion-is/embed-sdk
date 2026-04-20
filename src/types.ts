/**
 * Shared types for the YouOpinion Embed SDK.
 *
 * Concept hierarchy:
 *   Surfaces — iframe containers: Widget, Dialog, Drawer, Popover
 *   Buttons — pre-built UI controls that open surfaces: createButton
 *
 * SurveyId format: "surveySlug/channelSlug" — channel is always part of the ID.
 */

/** Embed theme mode. */
export type ThemeMode = "light" | "dark" | "auto";

// ---------------------------------------------------------------------------
// Trigger system — composable, type-safe auto-open triggers
// ---------------------------------------------------------------------------

/** Per-trigger-type configuration. Generic param A is the action type.
 *  Each entry includes its own `action` so the discriminated union is self-contained. */
export interface TriggerMap<A> {
    /** Open immediately when the page loads. */
    load: { action?: A };
    /** Open after a delay in milliseconds. Default: 3000. */
    time: { delay?: number; action?: A };
    /** Open when the user scrolls past a percentage of the page (0-100). Default: 50. */
    scroll: { threshold?: number; action?: A; reverseAction?: A };
    /** Open when the user moves their mouse toward the top of the page. Default sensitivity: 20px. */
    exit: { sensitivity?: number; action?: A };
}

/** Convert a TriggerMap into a strict discriminated union. */
type CreateTriggerUnion<A> = {
    [K in keyof TriggerMap<A>]: { type: K } & TriggerMap<A>[K];
}[keyof TriggerMap<A>];

/** What happens when a trigger fires. String shorthand or a custom callback receiving the handle. */
export type TriggerAction = "open" | "close" | "preload" | "toggle" | "unmount" | ((handle: ModalHandle) => void);

/**
 * Discriminated union — each trigger type carries only its own config fields.
 *
 * Usage:
 *   { type: "scroll", threshold: 50, action: "preload" }  ✅
 *   { type: "scroll", delay: 50 }                          ❌ type error
 */
export type TriggerConfig = CreateTriggerUnion<TriggerAction>;

// ---------------------------------------------------------------------------
// Event payloads
// ---------------------------------------------------------------------------

export interface ReadyPayload {
    surveyId: string;
}

export interface StartedPayload {
    surveyId: string;
    responseId: string;
}

export interface SubmitPayload {
    surveyId: string;
    responseId: string;
}

export interface QuestionChangedPayload {
    surveyId: string;
    ref: string;
}

export interface HeightChangedPayload {
    surveyId: string;
    height: number;
}

export interface ClosePayload {
    surveyId: string;
}

// ---------------------------------------------------------------------------
// Event maps — typed on()/off() for handles
// ---------------------------------------------------------------------------

/** Events emitted by all surfaces (widget, dialog, drawer, popover). */
export interface EmbedEventMap {
    ready: ReadyPayload;
    started: StartedPayload;
    submit: SubmitPayload;
    questionChanged: QuestionChangedPayload;
    heightChanged: HeightChangedPayload;
}

/** Events emitted by modal surfaces (dialog, drawer, popover). */
export interface ModalEventMap extends EmbedEventMap {
    open: void;
    close: ClosePayload;
}

// ---------------------------------------------------------------------------
// Common options (pure configuration — no callbacks)
// ---------------------------------------------------------------------------

/** Common options shared by all embed modes. */
export interface CommonOptions {
    /** Language code (e.g., 'en', 'de', 'et'). Default: auto-detect from browser. */
    language?: string;

    /** Custom domain for the share URL. Default: 'https://share.youropinion.is'. */
    domain?: string;

    /** Hidden fields passed to the survey as key-value pairs. */
    hidden?: Record<string, string>;

    /** JWT payload for safe links with pre-filled data. */
    payload?: string;

    /** Hide the iframe until the survey sends `survey-ready`. Avoids showing the splash/loading screen. */
    waitForReady?: boolean;
}

/** Options shared by modal-type surfaces (dialog, drawer, popover). */
export interface ModalOptions extends CommonOptions {
    /** Auto-close after submit. Set to true (default 3s) or a number of milliseconds. */
    autoClose?: boolean | number;

    /** Don't re-open after the user closes the modal. Uses localStorage. */
    preventReopenOnClose?: boolean;

    /** Preserve survey state when modal is closed and reopened. */
    keepSession?: boolean;
}

// ---------------------------------------------------------------------------
// Surface options
// ---------------------------------------------------------------------------

/** Options for createWidget (inline embed). */
export interface WidgetOptions extends CommonOptions {
    /** Container element to render the survey into. Required. */
    container: HTMLElement;

    /** Width in pixels or CSS units. */
    width?: number | string;

    /** Starting height in pixels or CSS units. Used as initial height before content reports its size. */
    height?: number | string;

    /** Auto-grow iframe height when content gets taller. Pass a number to set a max height (px). Default: true. */
    autoGrow?: boolean | number;

    /** Auto-shrink iframe height when content gets shorter. Pass a number to set a min height (px). Default: true. */
    autoShrink?: boolean | number;

    /** Lazy-load: only start loading when the container scrolls into view. */
    lazy?: boolean;
}

/** Options for createDialog (centered modal overlay). */
export interface DialogOptions extends ModalOptions {
    /** Dialog size as percentage of viewport (desktop only). Default: 80. */
    size?: number;

    /** Width in pixels or CSS units. Overrides size. */
    width?: number | string;

    /** Height in pixels or CSS units. Overrides size. */
    height?: number | string;

    /** Auto-grow height when content gets taller. Pass a number for max height (px). Default: false. */
    autoGrow?: boolean | number;

    /** Auto-shrink height when content gets shorter. Pass a number for min height (px). Default: false. */
    autoShrink?: boolean | number;

    /** Open in full-screen mode. */
    fullScreen?: boolean;
}

/** Options for createDrawer (side panel). */
export interface DrawerOptions extends ModalOptions {
    /** Panel position: 'left' or 'right'. Default: 'right'. */
    position?: "left" | "right";

    /** Panel width in pixels or CSS units. Default: '420px'. */
    width?: number | string;

    /**
     * Render as a modal with an overlay that dims the page and locks body scroll.
     * Default: false (non-modal — the drawer slides in but the page remains usable).
     */
    modal?: boolean;
}

/** Options for createPopover (corner panel surface). */
export interface PopoverOptions extends ModalOptions {
    /** Panel position. Default: 'bottom-right'. */
    position?: "bottom-right" | "bottom-left";

    /** Panel width in pixels or CSS units. Default: '380px'. */
    width?: number | string;

    /** Panel height in pixels or CSS units. Default: '520px'. */
    height?: number | string;

    /** Auto-grow height when content gets taller. Pass a number for max height (px). Default: false. */
    autoGrow?: boolean | number;

    /** Auto-shrink height when content gets shorter. Pass a number for min height (px). Default: false. */
    autoShrink?: boolean | number;

    /**
     * Render as a modal with an overlay that dims the page and traps focus.
     * Default: false (non-modal — the popover floats without blocking page interaction).
     */
    modal?: boolean;
}

// ---------------------------------------------------------------------------
// Button options
// ---------------------------------------------------------------------------

/** Button position on the page. left/right → edge tab style, bottom-* → floating style. */
export type ButtonPosition = "left" | "right" | "bottom-left" | "bottom-right";

/** Options for createButton (composable UI control that opens any modal surface). */
export interface ButtonOptions {
    /** Button position on the page. Default: 'right'. */
    position?: ButtonPosition;

    /** Button label text. Default: 'Feedback'. */
    text?: string;

    /** Tooltip shown on hover. */
    tooltip?: string;

    /** Custom icon: SVG markup, URL, emoji, or HTML. */
    icon?: string;

    /** Button background color (light mode). Default: '#003366'. */
    color?: string;

    /** Button background color (dark mode). Defaults to `color` if unset. */
    colorDark?: string;

    /** Button text/icon color (light mode). Auto-determined from background if not set. */
    textColor?: string;

    /** Button text/icon color (dark mode). Auto-determined from `colorDark` if not set. */
    textColorDark?: string;

    /** Use a custom element as the button — skips built-in DOM, only wires behavior. */
    container?: HTMLElement;

    /** Hide the button after the survey is submitted. */
    hideAfterSubmit?: boolean;

    /** Additional CSS class names to add to the button element. */
    className?: string;

    /** Start with the button hidden. Use with triggers to reveal it on scroll/delay. */
    initiallyHidden?: boolean;
}

// ---------------------------------------------------------------------------
// Handle types
// ---------------------------------------------------------------------------

/** What happens when a widget trigger fires. */
export type WidgetTriggerAction = "unmount" | "refresh" | "preload" | ((handle: WidgetHandle) => void);

/** Trigger config for widgets — same trigger types, widget-specific actions. */
export type WidgetTriggerConfig = CreateTriggerUnion<WidgetTriggerAction>;

/** Return value from createWidget. */
export interface WidgetHandle {
    /** Subscribe to an event. */
    on<K extends keyof EmbedEventMap>(event: K, callback: (payload: EmbedEventMap[K]) => void): void;

    /** Unsubscribe from an event. */
    off<K extends keyof EmbedEventMap>(event: K, callback: (payload: EmbedEventMap[K]) => void): void;

    /**
     * Add a behavioral trigger that fires an action automatically.
     * Returns a cleanup function that removes just this trigger.
     */
    addTrigger(config: WidgetTriggerConfig): () => void;

    /** Remove all active triggers added via addTrigger(). */
    clearTriggers(): void;

    /** Start loading the iframe early (useful with lazy). */
    preload(): void;

    /** Reload the survey iframe. */
    refresh(): void;

    /** Remove the widget from the DOM and clean up. */
    unmount(): void;
}

/** Return value from modal surface creators (dialog, drawer, popover). */
export interface ModalHandle {
    /** Subscribe to an event. */
    on<K extends keyof ModalEventMap>(event: K, callback: (payload: ModalEventMap[K]) => void): void;

    /** Unsubscribe from an event. */
    off<K extends keyof ModalEventMap>(event: K, callback: (payload: ModalEventMap[K]) => void): void;

    /**
     * Start loading the iframe without showing the modal.
     * When open() is called later the content is already loaded.
     * Requires keepSession — throws if keepSession is not set.
     */
    preload(): void;

    /** Open the surface. */
    open(): void;

    /** Close the surface. */
    close(): void;

    /** Toggle: open when closed, close when opened. */
    toggle(): void;

    /**
     * Add a behavioral trigger that fires an action automatically.
     * Returns a cleanup function that removes just this trigger.
     */
    addTrigger(config: TriggerConfig): () => void;

    /** Remove all active triggers added via addTrigger(). */
    clearTriggers(): void;

    /** Reload the survey iframe. */
    refresh(): void;

    /** Remove the embed from the DOM and clean up. */
    unmount(): void;
}

/** Return value from createButton. */
export interface ButtonHandle {
    /** Show the button. */
    show(): void;

    /** Hide the button. */
    hide(): void;

    /**
     * Add a behavioral trigger that fires an action automatically.
     * Returns a cleanup function that removes just this trigger.
     */
    addTrigger(config: ButtonTriggerConfig): () => void;

    /** Remove all active triggers added via addTrigger(). */
    clearTriggers(): void;

    /** Remove the button from the DOM and clean up. */
    unmount(): void;
}

/** What happens when a button trigger fires. */
export type ButtonTriggerAction = "show" | "hide" | ((handle: ButtonHandle) => void);

/** Trigger config for buttons — same trigger types, button-specific actions. */
export type ButtonTriggerConfig = CreateTriggerUnion<ButtonTriggerAction>;
