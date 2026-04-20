/**
 * @youropinion/embed — Public SDK for embedding YouOpinion surveys.
 *
 * Concept hierarchy:
 *   Surfaces — iframe containers: Widget, Dialog, Drawer, Popover
 *   Buttons — pre-built UI controls that open surfaces: FeedbackTab, ChatBubble
 *
 * Usage (npm):
 *   import { createWidget, createDialog, createDrawer } from '@youropinion/embed'
 *
 * Usage (CDN):
 *   <script src="https://embed.youropinion.is/v1/embed.js"></script>
 *   <div data-yo-widget="SURVEY_ID"></div>
 *
 * Global: window.yo
 */

// --- Public API: Surfaces ---
import { createDialog } from "./surfaces/dialog.ts";
import { createDrawer } from "./surfaces/drawer.ts";
import { createPopover } from "./surfaces/popover.ts";
import { createWidget } from "./surfaces/widget.ts";

// --- Public API: Buttons ---
import { createButton } from "./buttons/button.ts";

// --- Global Theme ---
import { setGlobalTheme } from "./core/theme-manager.ts";

// --- HTML API ---
import { reloadAll, scanAndInitialize } from "./core/html-api.ts";

export {
  createButton,
  createDialog,
  createDrawer,
  createPopover,
  createWidget,
  setGlobalTheme as setTheme,
};

// --- Public API: types ---
export type {
  ButtonHandle,
  ButtonOptions,
  ButtonPosition,
  ButtonTriggerAction,
  ButtonTriggerConfig,
  ClosePayload,
  CommonOptions,
  DialogOptions,
  DrawerOptions,
  EmbedEventMap,
  HeightChangedPayload,
  ModalEventMap,
  ModalHandle,
  ModalOptions,
  PopoverOptions,
  QuestionChangedPayload,
  ReadyPayload,
  StartedPayload,
  SubmitPayload,
  ThemeMode,
  TriggerAction,
  TriggerConfig,
  TriggerMap,
  WidgetHandle,
  WidgetOptions,
  WidgetTriggerAction,
  WidgetTriggerConfig,
} from "./types.ts";

/**
 * Global API exposed as `window.yo` when loaded via `<script>` tag.
 * Also serves as the module's default export.
 */
export const yo = {
  // Surfaces
  createWidget,
  createDialog,
  createDrawer,
  createPopover,

  // Buttons
  createButton,

  /** Set the global theme for all SDK instances. */
  setTheme: setGlobalTheme,

  /** Re-scan the DOM for new data-yo-* elements added after initial load. */
  load: scanAndInitialize,

  /** Destroy all embeds and re-initialize from DOM. */
  reload: reloadAll,
};

// --- Auto-initialize ---
// When loaded via <script> tag:
// 1. Expose window.yo global
// 2. Auto-scan DOM for data-yo-* attributes

if (typeof window !== "undefined") {
  (window as any).yo = yo;
  // Auto-scan when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scanAndInitialize);
  } else {
    // DOM already loaded (script loaded async or deferred)
    scanAndInitialize();
  }
}
