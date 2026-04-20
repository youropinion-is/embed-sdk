/**
 * @youropinion/embed/react — React bindings for @youropinion/embed SDK.
 *
 * Hooks: useDialog, useDrawer, usePopover — return a ModalHandle to control the surface.
 * Components: EmbedWidget (inline, needs a container), EmbedButton (composable button).
 *
 * Usage:
 *   import { useDialog, EmbedWidget, EmbedButton } from '@youropinion/embed/react'
 */

import { useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { createButton } from "./buttons/button.ts";
import type { Emitter } from "./core/emitter.ts";
import { createEmitter } from "./core/emitter.ts";
import { createDialog } from "./surfaces/dialog.ts";
import { createDrawer } from "./surfaces/drawer.ts";
import { createPopover } from "./surfaces/popover.ts";
import { createWidget } from "./surfaces/widget.ts";
import type {
  ButtonHandle,
  ButtonOptions,
  ButtonTriggerConfig,
  DialogOptions,
  DrawerOptions,
  ModalEventMap,
  ModalHandle,
  PopoverOptions,
  TriggerConfig,
  WidgetHandle,
  WidgetOptions,
  WidgetTriggerConfig,
} from "./types.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** All event names in ModalEventMap for wiring forwarding. */
const MODAL_EVENTS: (keyof ModalEventMap)[] = [
  "open",
  "close",
  "ready",
  "started",
  "submit",
  "questionChanged",
  "heightChanged",
];

/**
 * Forward all events from a ModalHandle into a stable emitter.
 * This wires the real handle (created after effects settle) to the
 * stable emitter that consumers (e.g. createButton) subscribe to.
 */
function wireEvents(handle: ModalHandle, emitter: Emitter<ModalEventMap>) {
  for (const event of MODAL_EVENTS) {
    handle.on(event, ((payload: ModalEventMap[typeof event]) => {
      emitter.emit(event, payload);
    }) as never);
  }
}

/** Create a stable proxy for a ModalHandle ref. */
function useModalProxy(
  handleRef: React.RefObject<ModalHandle | null>,
  stableEmitter: Emitter<ModalEventMap>,
): ModalHandle {
  return useMemo<ModalHandle>(
    () => ({
      on(event, callback) {
        // Register on the stable emitter — works even if handle is not yet created
        stableEmitter.on(event, callback);
      },
      off(event, callback) {
        stableEmitter.off(event, callback);
      },
      open: () => handleRef.current?.open(),
      close: () => handleRef.current?.close(),
      toggle: () => handleRef.current?.toggle(),
      preload: () => handleRef.current?.preload(),
      addTrigger: (config: TriggerConfig) =>
        handleRef.current?.addTrigger(config) ?? (() => {}),
      clearTriggers: () => handleRef.current?.clearTriggers(),
      refresh: () => handleRef.current?.refresh(),
      unmount: () => handleRef.current?.unmount(),
    }),
    [],
  );
}

// ---------------------------------------------------------------------------
// Hooks — headless surface controls
// ---------------------------------------------------------------------------

/**
 * Create and manage a Dialog surface.
 * Returns a stable handle with open/close/toggle/refresh.
 * The dialog overlay is managed by the SDK (no React DOM needed).
 */
export function useDialog(
  surveyId: string,
  options: DialogOptions = {},
): ModalHandle {
  const handleRef = useRef<ModalHandle | null>(null);
  const stableEmitter = useMemo(() => createEmitter<ModalEventMap>(), []);

  useEffect(() => {
    const handle = createDialog(surveyId, options);
    handleRef.current = handle;
    wireEvents(handle, stableEmitter);
    return () => {
      handleRef.current?.unmount();
      handleRef.current = null;
    };
  }, [surveyId, options.language]);

  return useModalProxy(handleRef, stableEmitter);
}

/**
 * Create and manage a Drawer surface.
 * Returns a stable handle with open/close/toggle/refresh.
 */
export function useDrawer(
  surveyId: string,
  options: DrawerOptions = {},
): ModalHandle {
  const handleRef = useRef<ModalHandle | null>(null);
  const stableEmitter = useMemo(() => createEmitter<ModalEventMap>(), []);

  useEffect(() => {
    const handle = createDrawer(surveyId, options);
    handleRef.current = handle;
    wireEvents(handle, stableEmitter);
    return () => {
      handleRef.current?.unmount();
      handleRef.current = null;
    };
  }, [surveyId, options.language]);

  return useModalProxy(handleRef, stableEmitter);
}

/**
 * Create and manage a Popover surface.
 * Returns a stable handle with open/close/toggle/refresh.
 */
export function usePopover(
  surveyId: string,
  options: PopoverOptions = {},
): ModalHandle {
  const handleRef = useRef<ModalHandle | null>(null);
  const stableEmitter = useMemo(() => createEmitter<ModalEventMap>(), []);

  useEffect(() => {
    const handle = createPopover(surveyId, options);
    handleRef.current = handle;
    wireEvents(handle, stableEmitter);
    return () => {
      handleRef.current?.unmount();
      handleRef.current = null;
    };
  }, [surveyId, options.language]);

  return useModalProxy(handleRef, stableEmitter);
}

// ---------------------------------------------------------------------------
// EmbedWidget — inline survey in a container
// ---------------------------------------------------------------------------

export interface EmbedWidgetProps extends Omit<WidgetOptions, "container"> {
  surveyId: string;
  className?: string;
  style?: React.CSSProperties;
  ref?: React.Ref<WidgetHandle>;
}

/**
 * Renders an inline survey widget inside a container div.
 * Use `ref` for imperative access to refresh/unmount.
 */
export function EmbedWidget({
  surveyId,
  className,
  style,
  ref,
  ...options
}: EmbedWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<WidgetHandle | null>(null);

  useImperativeHandle(ref, () => ({
    on(event, callback) {
      handleRef.current?.on(event, callback);
    },
    off(event, callback) {
      handleRef.current?.off(event, callback);
    },
    addTrigger(config: WidgetTriggerConfig) {
      return handleRef.current?.addTrigger(config) ?? (() => {});
    },
    clearTriggers() {
      handleRef.current?.clearTriggers();
    },
    preload() {
      handleRef.current?.preload();
    },
    refresh() {
      handleRef.current?.refresh();
    },
    unmount() {
      handleRef.current?.unmount();
    },
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    handleRef.current = createWidget(surveyId, {
      ...options,
      container: containerRef.current,
    });

    return () => {
      handleRef.current?.unmount();
      handleRef.current = null;
    };
  }, [surveyId, options.language]);

  return <div ref={containerRef} className={className} style={style} />;
}

// ---------------------------------------------------------------------------
// EmbedButton — composable button that opens a modal surface
// ---------------------------------------------------------------------------

export interface EmbedButtonProps extends ButtonOptions {
  /** The modal handle returned by useDialog, useDrawer, or usePopover. */
  handle: ModalHandle;
  /** Optional ref for imperative access (addTrigger, clearTriggers, show, hide). */
  ref?: React.Ref<ButtonHandle>;
}

/**
 * Renders a button that opens the given modal surface.
 * Returns null — the SDK creates and manages all DOM elements.
 *
 * Usage:
 *   const drawer = useDrawer('survey/channel', { size: 50 })
 *   <EmbedButton handle={drawer} position="right" text="Feedback" />
 */
export function EmbedButton({ handle, ref, ...options }: EmbedButtonProps) {
  const btnRef = useRef<ButtonHandle | null>(null);

  useImperativeHandle(ref, () => ({
    show() {
      btnRef.current?.show();
    },
    hide() {
      btnRef.current?.hide();
    },
    addTrigger(config: ButtonTriggerConfig) {
      return btnRef.current?.addTrigger(config) ?? (() => {});
    },
    clearTriggers() {
      btnRef.current?.clearTriggers();
    },
    unmount() {
      btnRef.current?.unmount();
    },
  }));

  useEffect(() => {
    btnRef.current = createButton(handle, options);
    return () => {
      btnRef.current?.unmount();
      btnRef.current = null;
    };
  }, [handle, options.position, options.text, options.color]);

  return null;
}
