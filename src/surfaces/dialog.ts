/**
 * Dialog mode: centered modal overlay.
 *
 * Shell responsibilities: overlay DOM, open/close animation, scroll lock, Escape key.
 * Widget + iframe + theme + auto-close: handled by createModalBehavior.
 *
 * Usage:
 *   const { open, close, toggle } = createDialog('SURVEY_ID', { size: 80 })
 */

import { createModalBehavior } from "../core/modal-behavior.ts";
import { getGlobalTheme, onGlobalThemeChange, resolveTheme } from "../core/theme-manager.ts";
import {
  CSS_PREFIX,
  Z_INDEX,
  injectStyles,
  isMobile,
  toCss,
} from "../core/utils.ts";
import type { DialogOptions, ModalHandle } from "../types.ts";

const DIALOG_CSS = `
.${CSS_PREFIX}-dialog-overlay {
    position: fixed;
    inset: 0;
    z-index: ${Z_INDEX};
    background: var(--yo-overlay-bg, rgba(0, 0, 0, 0.6));
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.25s ease, visibility 0.25s ease;
}
.${CSS_PREFIX}-dialog-overlay--open {
    opacity: 1;
    visibility: visible;
}
.${CSS_PREFIX}-dialog {
    background: var(--yo-bg, #fff);
    border-radius: var(--yo-border-radius, 12px);
    overflow: hidden;
    position: relative;
    box-shadow: var(--yo-shadow, 0 25px 50px -12px rgba(0, 0, 0, 0.25));
    transform: scale(0.95) translateY(10px);
    transition: transform 0.25s ease;
    max-width: 100vw;
    max-height: 100vh;
}
.${CSS_PREFIX}-dialog-overlay--open .${CSS_PREFIX}-dialog {
    transform: scale(1) translateY(0);
}
.${CSS_PREFIX}-dialog-close {
    all: revert;
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 1;
    background: rgba(0, 0, 0, 0.1);
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    padding: 0;
    margin: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: inherit;
    font-size: 18px;
    line-height: 1;
    box-sizing: border-box;
    transition: background 0.15s;
}
.${CSS_PREFIX}-dialog-close:hover {
    background: rgba(0, 0, 0, 0.2);
}
.${CSS_PREFIX}-dialog.${CSS_PREFIX}--dark {
    --yo-bg: #1a1a1a;
}
.${CSS_PREFIX}-dialog.${CSS_PREFIX}--dark .${CSS_PREFIX}-dialog-close {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}
.${CSS_PREFIX}-dialog.${CSS_PREFIX}--dark .${CSS_PREFIX}-dialog-close:hover {
    background: rgba(255, 255, 255, 0.2);
}
@media (prefers-color-scheme: dark) {
    .${CSS_PREFIX}-dialog:not(.${CSS_PREFIX}--light) {
        --yo-bg: #1a1a1a;
    }
    .${CSS_PREFIX}-dialog:not(.${CSS_PREFIX}--light) .${CSS_PREFIX}-dialog-close {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
    }
    .${CSS_PREFIX}-dialog:not(.${CSS_PREFIX}--light) .${CSS_PREFIX}-dialog-close:hover {
        background: rgba(255, 255, 255, 0.2);
    }
}
.${CSS_PREFIX}-dialog--fullscreen {
    width: 100vw !important;
    height: 100vh !important;
    border-radius: 0;
}
@media (max-width: 768px) {
    .${CSS_PREFIX}-dialog {
        width: 100vw !important;
        height: 100vh !important;
        border-radius: 0;
    }
}
`;

export function createDialog(
  surveyId: string,
  options: DialogOptions = {},
): ModalHandle {
  injectStyles(DIALOG_CSS);

  const autoGrow = options.autoGrow ?? false;
  const autoShrink = options.autoShrink ?? false;
  const canGrow = autoGrow !== false;
  const canShrink = autoShrink !== false;
  const canResize = canGrow || canShrink;

  // --- DOM shell ---
  const overlay = document.createElement("div");
  overlay.className = `${CSS_PREFIX}-dialog-overlay`;

  const dialog = document.createElement("div");
  dialog.className = `${CSS_PREFIX}-dialog`;
  // Apply theme from global state: explicit dark/light via class, auto via @media fallback
  const globalTheme = getGlobalTheme();
  const initialResolved = resolveTheme(globalTheme);
  dialog.classList.toggle(
    `${CSS_PREFIX}--dark`,
    initialResolved === "dark" && globalTheme !== "auto",
  );
  dialog.classList.toggle(
    `${CSS_PREFIX}--light`,
    initialResolved === "light" && globalTheme !== "auto",
  );

  // Subscribe to global theme changes so the shell updates even before open()
  const unsubTheme = onGlobalThemeChange((resolved) => {
    dialog.classList.toggle(`${CSS_PREFIX}--dark`, resolved === "dark");
    dialog.classList.toggle(`${CSS_PREFIX}--light`, resolved === "light");
  });

  if (options.fullScreen)
    dialog.classList.add(`${CSS_PREFIX}-dialog--fullscreen`);

  const size = options.size ?? 80;
  const mobile = isMobile();
  // Compute the base height that becomes the widget's starting container height.
  const baseHeight = options.height ?? `${size}vh`;
  if (!options.fullScreen && !mobile) {
    dialog.style.width = toCss(options.width, `${size}vw`);
    dialog.style.height = toCss(baseHeight, "");
    if (canResize) {
      dialog.style.maxHeight =
        typeof autoGrow === "number" ? `${autoGrow}px` : "90vh";
      if (typeof autoShrink === "number")
        dialog.style.minHeight = `${autoShrink}px`;
    }
  } else if (!options.fullScreen && mobile) {
    dialog.style.width = "100vw";
    dialog.style.height = "100vh";
  }

  const closeBtn = document.createElement("button");
  closeBtn.className = `${CSS_PREFIX}-dialog-close`;
  closeBtn.innerHTML = "&#10005;";
  closeBtn.setAttribute("aria-label", "Close survey");

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") handle.close();
  }

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) handle.close();
  });
  closeBtn.addEventListener("click", () => handle.close());

  dialog.appendChild(closeBtn);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  let savedOverflow: string | null = null;

  // --- Shared behavior ---
  const handle = createModalBehavior(
    surveyId,
    dialog,
    options,
    { autoGrow, autoShrink, height: baseHeight },
    {
      onShow() {
        if (!document.body.contains(overlay))
          document.body.appendChild(overlay);
        overlay.classList.add(`${CSS_PREFIX}-dialog-overlay--open`);
        savedOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", onKeyDown);
      },
      onHide() {
        overlay.classList.remove(`${CSS_PREFIX}-dialog-overlay--open`);
        document.body.style.overflow = savedOverflow ?? "";
        savedOverflow = null;
        document.removeEventListener("keydown", onKeyDown);
      },
      onUnmount() {
        unsubTheme();
        overlay.remove();
        document.removeEventListener("keydown", onKeyDown);
        document.body.style.overflow = savedOverflow ?? "";
        savedOverflow = null;
      },
    },
  );

  return handle;
}
