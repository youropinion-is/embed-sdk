# @youropinion/embed

Embed YouOpinion surveys on any website. Zero dependencies, framework-agnostic, tiny bundle.

## Quick Start

### HTML (no JavaScript needed)

```html
<!-- Inline survey -->
<div data-yo-widget="SURVEY_ID"></div>
<script src="https://share.youropinion.is/embed/latest.js"></script>
```

The script auto-scans the page for `data-yo-*` attributes and initializes embeds.

### npm

```bash
npm install @youropinion/embed
```

```js
import { createWidget } from "@youropinion/embed";

createWidget("SURVEY_ID", {
  container: document.querySelector("#survey"),
});
```

## Embed Modes

| Mode             | Function          | HTML Attribute         | Description                                        |
| ---------------- | ----------------- | ---------------------- | -------------------------------------------------- |
| **Widget**       | `createWidget()`  | `data-yo-widget`       | Inline survey rendered inside a container element  |
| **Dialog**       | `createDialog()`  | `data-yo-dialog`       | Centered modal overlay                             |
| **Drawer**       | `createDrawer()`  | `data-yo-drawer`       | Side panel sliding from screen edge                |
| **Popover**      | `createPopover()` | `data-yo-popover`      | Corner floating panel                              |
| **Button**       | `createButton()`  | —                      | Composable UI control that opens any modal surface |
| **Feedback Tab** | —                 | `data-yo-feedback-tab` | HTML API shorthand: Button + Drawer combo          |
| **Chat Bubble**  | —                 | `data-yo-chat-bubble`  | HTML API shorthand: Button + Popover combo         |

### Widget (inline)

```html
<div data-yo-widget="SURVEY_ID" data-yo-auto-grow data-yo-auto-shrink></div>
```

```js
const widget = createWidget("SURVEY_ID", {
  container: document.querySelector("#survey"),
  height: "600px",
  autoGrow: true,
  autoShrink: true,
  lazy: true,
});

widget.on("submit", ({ responseId }) => console.log("Submitted:", responseId));
// widget.refresh()  widget.unmount()
```

### Dialog (modal)

```html
<button data-yo-dialog="SURVEY_ID" data-yo-size="80">Give Feedback</button>
```

```js
const dialog = createDialog("SURVEY_ID", {
  size: 80,
  autoClose: 3000,
});

dialog.on("submit", ({ responseId }) => console.log("Submitted:", responseId));
dialog.open();
// dialog.close()  dialog.toggle()  dialog.refresh()  dialog.unmount()
```

### Drawer (side panel)

```html
<button data-yo-drawer="SURVEY_ID" data-yo-position="right">Open Survey</button>
```

```js
const drawer = createDrawer("SURVEY_ID", {
  position: "right",
  width: "450px",
});

drawer.open();
```

### Popover (floating panel)

```html
<button data-yo-popover="SURVEY_ID" data-yo-position="bottom-right">
  Open Survey
</button>
```

```js
const popover = createPopover("SURVEY_ID", {
  position: "bottom-right",
  width: "380px",
  height: "520px",
});

popover.open();
```

### Button + Surface combos

`createButton()` is a composable UI control that attaches to any modal surface. Use it to build feedback tabs, chat bubbles, or custom trigger buttons.

**Feedback Tab** (edge button → drawer):

```html
<div
  data-yo-feedback-tab="SURVEY_ID"
  data-yo-button-text="Feedback"
  data-yo-button-color="#003366"
  data-yo-position="right"
></div>
```

```js
const drawer = createDrawer("SURVEY_ID", { width: "420px", autoClose: 3000 });
const tab = createButton(drawer, {
  position: "right",
  text: "Feedback",
  color: "#003366",
  hideAfterSubmit: true,
});
```

**Chat Bubble** (FAB → popover):

```html
<div
  data-yo-chat-bubble="SURVEY_ID"
  data-yo-button-tooltip="Share your thoughts!"
  data-yo-position="bottom-right"
></div>
```

```js
const popover = createPopover("SURVEY_ID", { width: "380px", height: "520px" });
const bubble = createButton(popover, {
  position: "bottom-right",
  tooltip: "Share your thoughts!",
  color: "#003366",
  hideAfterSubmit: true,
});
```

## Configuration

### Common Options

Shared by all embed modes.

| Option         | Type                     | Default                        | Description                                  |
| -------------- | ------------------------ | ------------------------------ | -------------------------------------------- |
| `language`     | `string`                 | auto-detect                    | Language code (`en`, `de`, `et`, `fr`, etc.) |
| `domain`       | `string`                 | `https://share.youropinion.is` | Custom share domain (must be HTTPS)          |
| `hidden`       | `Record<string, string>` | —                              | Hidden fields as key-value pairs             |
| `payload`      | `string`                 | —                              | JWT payload for safe links                   |
| `waitForReady` | `boolean`                | `false`                        | Hide iframe until survey signals it's loaded |

### Widget Options

| Option       | Type                | Default      | Description                                                         |
| ------------ | ------------------- | ------------ | ------------------------------------------------------------------- |
| `container`  | `HTMLElement`       | **required** | Container element                                                   |
| `width`      | `number \| string`  | —            | Widget width                                                        |
| `height`     | `number \| string`  | —            | Widget height (starting point when auto-grow/shrink enabled)        |
| `autoGrow`   | `boolean \| number` | `true`       | Auto-grow height to fit content. Number sets max height in pixels   |
| `autoShrink` | `boolean \| number` | `true`       | Auto-shrink height to fit content. Number sets min height in pixels |
| `lazy`       | `boolean`           | `false`      | Lazy-load with IntersectionObserver                                 |

### Dialog Options

| Option       | Type                | Default | Description                                                         |
| ------------ | ------------------- | ------- | ------------------------------------------------------------------- |
| `size`       | `number`            | `80`    | Percentage of viewport (desktop)                                    |
| `width`      | `number \| string`  | —       | Width override                                                      |
| `height`     | `number \| string`  | —       | Height override                                                     |
| `fullScreen` | `boolean`           | `false` | Full-screen mode                                                    |
| `autoGrow`   | `boolean \| number` | `false` | Auto-grow height to fit content. Number sets max height in pixels   |
| `autoShrink` | `boolean \| number` | `false` | Auto-shrink height to fit content. Number sets min height in pixels |

Plus all [modal options](#modal-options).

### Drawer Options

| Option     | Type                  | Default   | Description                                            |
| ---------- | --------------------- | --------- | ------------------------------------------------------ |
| `position` | `'left'` \| `'right'` | `'right'` | Slide direction                                        |
| `width`    | `number \| string`    | `'420px'` | Panel width                                            |
| `modal`    | `boolean`             | `false`   | Show overlay, lock scroll, and enable Escape key close |

Plus all [modal options](#modal-options).

### Popover Options

| Option       | Type                                | Default          | Description                                                         |
| ------------ | ----------------------------------- | ---------------- | ------------------------------------------------------------------- |
| `position`   | `'bottom-right'` \| `'bottom-left'` | `'bottom-right'` | Corner position                                                     |
| `width`      | `number \| string`                  | `'380px'`        | Panel width                                                         |
| `height`     | `number \| string`                  | `'520px'`        | Panel height                                                        |
| `autoGrow`   | `boolean \| number`                 | `false`          | Auto-grow height to fit content. Number sets max height in pixels   |
| `autoShrink` | `boolean \| number`                 | `false`          | Auto-shrink height to fit content. Number sets min height in pixels |
| `modal`      | `boolean`                           | `false`          | Close on click outside                                              |

Plus all [modal options](#modal-options).

### Modal Options

Shared by dialog, drawer, and popover (not widget).

| Option                 | Type                | Default | Description                                           |
| ---------------------- | ------------------- | ------- | ----------------------------------------------------- |
| `autoClose`            | `boolean \| number` | —       | Auto-close after submit. `true` = 3s, or milliseconds |
| `preventReopenOnClose` | `boolean`           | `false` | Don't re-trigger after user closes                    |
| `keepSession`          | `boolean`           | `false` | Preserve survey state on close/reopen                 |

### Button Options

| Option            | Type                                                         | Default      | Description                                     |
| ----------------- | ------------------------------------------------------------ | ------------ | ----------------------------------------------- |
| `position`        | `'left'` \| `'right'` \| `'bottom-left'` \| `'bottom-right'` | `'right'`    | Screen position. Edge → tab, bottom → FAB       |
| `text`            | `string`                                                     | `'Feedback'` | Button label text                               |
| `tooltip`         | `string`                                                     | —            | Tooltip shown on hover (FAB only)               |
| `icon`            | `string`                                                     | —            | SVG markup, URL, or emoji                       |
| `color`           | `string`                                                     | `'#003366'`  | Background color (light mode)                   |
| `colorDark`       | `string`                                                     | `color`      | Background color (dark mode)                    |
| `textColor`       | `string`                                                     | auto         | Text color (auto-determined from background)    |
| `hideAfterSubmit` | `boolean`                                                    | `false`      | Hide button after survey submitted              |
| `initiallyHidden` | `boolean`                                                    | `false`      | Start hidden; reveal via triggers               |
| `container`       | `HTMLElement`                                                | —            | Use a custom element instead of built-in button |

### Triggers

Triggers are composable — add multiple triggers to a single surface:

```js
const handle = createDialog("ID");

// Open immediately on page load
handle.addTrigger({ type: "load" });

// Open when user scrolls 50% of the page
handle.addTrigger({ type: "scroll", threshold: 50 });

// Open on exit intent (mouse leaves viewport top)
handle.addTrigger({ type: "exit", sensitivity: 20 });

// Open after 5 seconds
handle.addTrigger({ type: "time", delay: 5000 });

// Custom action instead of open
handle.addTrigger({ type: "scroll", threshold: 80, action: "close" });

// Remove a specific trigger
const cleanup = handle.addTrigger({ type: "time", delay: 3000 });
cleanup(); // removes this trigger

// Remove all triggers
handle.clearTriggers();
```

`preventReopenOnClose: true` uses `localStorage` to suppress re-triggers after the user closes the survey.

### Events

All surfaces emit typed events via `handle.on()` / `handle.off()`:

```js
const dialog = createDialog("SURVEY_ID");

dialog.on("ready", ({ surveyId }) => console.log("Loaded"));
dialog.on("started", ({ surveyId, responseId }) => console.log("Started"));
dialog.on("submit", ({ surveyId, responseId }) => console.log("Submitted"));
dialog.on("questionChanged", ({ surveyId, ref }) =>
  console.log("Question:", ref),
);
dialog.on("heightChanged", ({ surveyId, height }) =>
  console.log("Height:", height),
);

// Modal surfaces also emit:
dialog.on("open", () => console.log("Opened"));
dialog.on("close", ({ surveyId }) => console.log("Closed"));
```

All surfaces support `ready`, `started`, `submit`, `questionChanged`, and `heightChanged`. Modal surfaces also support `open` and `close`.

## Return Values

### WidgetHandle (from `createWidget`)

```ts
interface WidgetHandle {
  on(event, callback): void; // Subscribe to events
  off(event, callback): void; // Unsubscribe from events
  addTrigger(config): () => void; // Add behavioral trigger
  clearTriggers(): void; // Remove all triggers
  preload(): void; // Start loading (useful with lazy)
  refresh(): void; // Reload iframe
  unmount(): void; // Remove from DOM
}
```

### ModalHandle (from `createDialog`, `createDrawer`, `createPopover`)

```ts
interface ModalHandle {
  on(event, callback): void; // Subscribe to events
  off(event, callback): void; // Unsubscribe from events
  preload(): void; // Load iframe without showing (requires keepSession)
  open(): void; // Show the surface
  close(): void; // Hide the surface
  toggle(): void; // Toggle open/close
  addTrigger(config): () => void; // Add behavioral trigger
  clearTriggers(): void; // Remove all triggers
  refresh(): void; // Reload iframe
  unmount(): void; // Remove from DOM
}
```

### ButtonHandle (from `createButton`)

```ts
interface ButtonHandle {
  show(): void; // Show the button
  hide(): void; // Hide the button
  addTrigger(config): () => void; // Add behavioral trigger
  clearTriggers(): void; // Remove all triggers
  unmount(): void; // Remove from DOM
}
```

## HTML Data Attributes

All options can be set as `data-yo-*` attributes in kebab-case:

```html
<div
  data-yo-widget="SURVEY_ID"
  data-yo-language="de"
  data-yo-auto-grow="800"
  data-yo-auto-shrink="200"
  data-yo-lazy
></div>
```

Nested options use prefixed attributes:

```html
<div
  data-yo-feedback-tab="SURVEY_ID"
  data-yo-button-text="Feedback"
  data-yo-button-color="#003366"
></div>
```

Elements get a `data-yo-initialized` attribute after initialization to prevent double-init.

## Global API

After loading the script tag, `window.yo` is available:

```js
window.yo.load(); // Re-scan DOM for new data-yo-* elements
window.yo.reload(); // Destroy all embeds and re-initialize

// Also exposes all create functions:
const dialog = window.yo.createDialog("SURVEY_ID", { size: 80 });
dialog.open();
```

## Global Theme

Use `setTheme()` to set the theme for all SDK instances:

```js
import { setTheme } from "@youropinion/embed";

setTheme("dark"); // 'light' | 'dark' | 'auto'
```

Or via `window.yo`:

```js
window.yo.setTheme("auto");
```

Theme is global — all surfaces and buttons update automatically. The default is `'auto'` which detects from `prefers-color-scheme` and syncs with the embedded survey.

You can also set the theme via HTML for the auto-scan API:

```html
<div data-yo-widget="SURVEY_ID" data-yo-theme="dark"></div>
```

## React

```bash
npm install @youropinion/embed
```

Two entry points:

| Import                     | Description                           |
| -------------------------- | ------------------------------------- |
| `@youropinion/embed`       | Main — surfaces, triggers, global API |
| `@youropinion/embed/react` | React hooks and components            |

### EmbedWidget (inline)

```tsx
import { EmbedWidget } from "@youropinion/embed/react";

function Survey() {
  return <EmbedWidget surveyId="SURVEY_ID" autoGrow autoShrink lazy />;
}
```

Accepts all `WidgetOptions` as props (except `container`, which is managed internally). Supports `ref` for accessing `WidgetHandle` methods.

### useDialog / useDrawer / usePopover (hooks)

```tsx
import { useDialog } from "@youropinion/embed/react";

function SurveyButton() {
  const survey = useDialog("SURVEY_ID", {
    size: 80,
    autoClose: 3000,
  });

  return <button onClick={() => survey.open()}>Open Survey</button>;
}
```

Hooks return a `ModalHandle`. The embed remounts when `surveyId` or `language` changes.

### EmbedButton (composable trigger)

```tsx
import { useDrawer, EmbedButton } from "@youropinion/embed/react";

function App() {
  const drawer = useDrawer("SURVEY_ID", { width: "420px" });

  return (
    <EmbedButton
      handle={drawer}
      position="right"
      text="Feedback"
      color="#003366"
    />
  );
}
```

`EmbedButton` renders `null` — the SDK manages the fixed-position UI elements. Supports `ref` for accessing `ButtonHandle` methods.

## Mobile Responsive

- **Dialog**: Full viewport on screens ≤ 768px
- **Drawer**: Full width on mobile
- **Popover**: Becomes a bottom sheet at 85vh

## Raw iframe Protocol

For cases where the SDK doesn't fit, you can embed surveys using a raw iframe and the postMessage API.

### URL Format

```
https://share.youropinion.is/#/{surveySlug}/{channelSlug}?theme=light&language=en&payload=...&hidden=...
```

| Parameter  | Values                       | Description                                      |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `language` | `en`, `et`, `de`, `fr`, etc. | Language code. Defaults to international English |
| `theme`    | `light`, `dark`              | Theme preference. Defaults to browser preference |
| `payload`  | string                       | JWT payload for safe links                       |
| `hidden`   | JSON string                  | Hidden fields as JSON-encoded key-value pairs    |

### Messages from the iframe

```json
{ "message": "survey-ready", "surveyId": "..." }
{ "message": "survey-started", "surveyId": "...", "responseId": "..." }
{ "message": "survey-completed", "surveyId": "...", "responseId": "..." }
{ "message": "survey-question-changed", "surveyId": "...", "ref": "..." }
{ "message": "survey-height-changed", "surveyId": "...", "height": 500 }
```

### Messages you can send to the iframe

```json
{ "message": "theme-change", "theme": "light" }
```

### Example

```js
const iframe = document.createElement("iframe");
iframe.src =
  "https://share.youropinion.is/#/SURVEY_SLUG/CHANNEL_SLUG?theme=light";
iframe.style.cssText = "width: 100%; height: 500px; border: none;";
document.body.appendChild(iframe);

window.addEventListener("message", (event) => {
  if (event.origin !== "https://share.youropinion.is") return;
  if (event.data.message === "survey-ready") {
    iframe.style.opacity = "1";
  }
  if (event.data.message === "survey-completed") {
    iframe.remove();
  }
});
```

## Browser Support

- Chrome 80+, Firefox 80+, Safari 14+, Edge 80+

## License

MIT
