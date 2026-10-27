/**
 * Drawer mode: panel sliding in from the left or right edge.
 *
 * Shell responsibilities: sliding panel DOM, overlay (when modal), scroll lock, Escape key.
 * Widget + iframe + theme + auto-close: handled by createModalBehavior.
 *
 * Usage:
 *   const { open, close } = createDrawer('SURVEY_ID', { position: 'right' })
 */

import { createModalBehavior } from "../core/modal-behavior.ts";
import { getGlobalTheme, onGlobalThemeChange, resolveTheme } from "../core/theme-manager.ts";
import { CSS_PREFIX, Z_INDEX, injectStyles, toCss } from "../core/utils.ts";
import type { DrawerOptions, ModalHandle } from "../types.ts";

const DRAWER_CSS = `
.${CSS_PREFIX}-drawer-overlay {
    position: fixed;
    inset: 0;
    z-index: ${Z_INDEX};
    background: var(--yo-overlay-bg, rgba(0, 0, 0, 0.4));
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
}
.${CSS_PREFIX}-drawer-overlay--open {
    opacity: 1;
    visibility: visible;
}
.${CSS_PREFIX}-drawer {
    position: fixed;
    top: 0;
    bottom: 0;
    z-index: ${Z_INDEX + 1};
    background: var(--yo-bg, #fff);
    box-shadow: var(--yo-shadow, -4px 0 24px rgba(0, 0, 0, 0.15));
    transition: transform 0.3s ease;
    display: flex;
    flex-direction: column;
    max-width: 100vw;
}
.${CSS_PREFIX}-drawer--right {
    right: 0;
    transform: translateX(100%);
}
.${CSS_PREFIX}-drawer--left {
    left: 0;
    transform: translateX(-100%);
}
.${CSS_PREFIX}-drawer--open {
    transform: translateX(0);
}
/* Peek state: partial slide-in while waiting for survey-ready.
   Shows ~40px of the drawer edge to signal that the survey is loading.
   Position-specific overrides maintain the correct slide direction. */
.${CSS_PREFIX}-drawer--right.${CSS_PREFIX}-drawer--peek {
    transform: translateX(calc(100% - 40px));
    pointer-events: none;
}
.${CSS_PREFIX}-drawer--left.${CSS_PREFIX}-drawer--peek {
    transform: translateX(calc(-100% + 40px));
    pointer-events: none;
}
/* Hide the close button during peek — it sits in the visible 40px strip */
.${CSS_PREFIX}-drawer--peek .${CSS_PREFIX}-drawer-close {
    display: none;
}
/* Subtle breathing animation on the exposed strip to communicate loading */
@keyframes ${CSS_PREFIX}-peek-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}
.${CSS_PREFIX}-drawer--peek {
    animation: ${CSS_PREFIX}-peek-pulse 1.6s ease-in-out infinite;
}
.${CSS_PREFIX}-drawer-close {
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
.${CSS_PREFIX}-drawer-close:hover {
    background: rgba(0, 0, 0, 0.2);
}
.${CSS_PREFIX}-drawer-body {
    flex: 1;
    overflow: hidden;
}
.${CSS_PREFIX}-drawer.${CSS_PREFIX}--dark {
    --yo-bg: #1a1a1a;
}
.${CSS_PREFIX}-drawer.${CSS_PREFIX}--dark .${CSS_PREFIX}-drawer-close {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}
@media (prefers-color-scheme: dark) {
    .${CSS_PREFIX}-drawer:not(.${CSS_PREFIX}--light) {
        --yo-bg: #1a1a1a;
    }
    .${CSS_PREFIX}-drawer:not(.${CSS_PREFIX}--light) .${CSS_PREFIX}-drawer-close {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
    }
}
@media (max-width: 768px) {
    .${CSS_PREFIX}-drawer {
        width: 100vw !important;
    }
}
`;

export function createDrawer(
  surveyId: string,
  options: DrawerOptions = {},
): ModalHandle {
  injectStyles(DRAWER_CSS);

  const position = options.position || "right";
  const isModal = options.modal ?? false;

  // --- DOM shell ---
  const overlay = document.createElement("div");
  overlay.className = `${CSS_PREFIX}-drawer-overlay`;
  overlay.addEventListener("click", () => handle.close());

  const drawer = document.createElement("div");
  drawer.className = `${CSS_PREFIX}-drawer ${CSS_PREFIX}-drawer--${position}`;
  // Apply theme from global state: explicit dark/light via class, auto via @media fallback
  const globalTheme = getGlobalTheme();
  const initialResolved = resolveTheme(globalTheme);
  drawer.classList.toggle(
    `${CSS_PREFIX}--dark`,
    initialResolved === "dark" && globalTheme !== "auto",
  );
  drawer.classList.toggle(
    `${CSS_PREFIX}--light`,
    initialResolved === "light" && globalTheme !== "auto",
  );

  // Subscribe to global theme changes so the shell updates even before open()
  const unsubTheme = onGlobalThemeChange((resolved) => {
    drawer.classList.toggle(`${CSS_PREFIX}--dark`, resolved === "dark");
    drawer.classList.toggle(`${CSS_PREFIX}--light`, resolved === "light");
  });

  drawer.style.width = toCss(options.width, "420px");

  const closeBtn = document.createElement("button");
  closeBtn.className = `${CSS_PREFIX}-drawer-close`;
  closeBtn.innerHTML = "&#10005;";
  closeBtn.setAttribute("aria-label", "Close survey");
  closeBtn.addEventListener("click", () => handle.close());

  // Body is the widget container — flex:1 fills the panel height, no height mgmt needed.
  const body = document.createElement("div");
  body.className = `${CSS_PREFIX}-drawer-body`;

  drawer.appendChild(closeBtn);
  drawer.appendChild(body);
  if (isModal) document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") handle.close();
  }

  let savedOverflow: string | null = null;

  // --- Shared behavior ---
  // Drawer body fills via flex — widget should not manage height.
  const handle = createModalBehavior(
    surveyId,
    body,
    options,
    { autoGrow: false, autoShrink: false },
    {
      onPendingShow() {
        // Slide the drawer in to a "peek" position (~40px visible from the edge)
        // while the survey loads. This keeps the iframe partially in the viewport
        // (avoiding browser throttling of off-screen iframes) and signals to the
        // user that something is loading. The CSS transition animates the peek→open
        // slide when onShow() fires.
        if (!document.body.contains(drawer)) document.body.appendChild(drawer);
        drawer.classList.add(`${CSS_PREFIX}-drawer--peek`);
      },
      onShow() {
        // Removing --peek while adding --open in the same tick causes the browser
        // to transition from the peek position to fully open — no reflow needed.
        drawer.classList.remove(`${CSS_PREFIX}-drawer--peek`);
        if (isModal && !document.body.contains(overlay))
          document.body.appendChild(overlay);
        if (!document.body.contains(drawer)) document.body.appendChild(drawer);
        if (isModal) {
          overlay.classList.add(`${CSS_PREFIX}-drawer-overlay--open`);
          savedOverflow = document.body.style.overflow;
          document.body.style.overflow = "hidden";
          document.addEventListener("keydown", onKeyDown);
        }
        drawer.classList.add(`${CSS_PREFIX}-drawer--open`);
      },
      onHide() {
        drawer.classList.remove(`${CSS_PREFIX}-drawer--open`);
        drawer.classList.remove(`${CSS_PREFIX}-drawer--peek`);
        if (isModal) {
          overlay.classList.remove(`${CSS_PREFIX}-drawer-overlay--open`);
          document.body.style.overflow = savedOverflow ?? "";
          savedOverflow = null;
          document.removeEventListener("keydown", onKeyDown);
        }
      },
      onUnmount() {
        unsubTheme();
        overlay.remove();
        drawer.remove();
        document.removeEventListener("keydown", onKeyDown);
        if (isModal) {
          document.body.style.overflow = savedOverflow ?? "";
          savedOverflow = null;
        }
      },
    },
  );

  return handle;
}
