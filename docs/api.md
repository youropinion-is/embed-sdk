# Configuration & API Reference

## Common Options

Shared by all embed modes.

| Option         | Type                     | Default                        | Description                                  |
| -------------- | ------------------------ | ------------------------------ | -------------------------------------------- |
| `language`     | `string`                 | auto-detect                    | Language code (`en`, `de`, `et`, `fr`, etc.) |
| `domain`       | `string`                 | `https://share.youropinion.is` | Custom share domain (must be HTTPS)          |
| `hidden`       | `Record<string, string>` | —                              | Hidden fields as key-value pairs             |
| `payload`      | `string`                 | —                              | JWT payload for safe links                   |
| `waitForReady` | `boolean`                | `false`                        | Hide iframe until survey signals it's loaded |

## Modal Options

Shared by dialog, drawer, and popover (not widget).

| Option                 | Type                | Default | Description                                           |
| ---------------------- | ------------------- | ------- | ----------------------------------------------------- |
| `autoClose`            | `boolean \| number` | —       | Auto-close after submit. `true` = 3s, or milliseconds |
| `preventReopenOnClose` | `boolean`           | `false` | Don't re-trigger after user closes                    |
| `keepSession`          | `boolean`           | `false` | Preserve survey state on close/reopen                 |

## Widget Options

| Option       | Type                | Default      | Description                                                         |
| ------------ | ------------------- | ------------ | ------------------------------------------------------------------- |
| `container`  | `HTMLElement`       | **required** | Container element                                                   |
| `width`      | `number \| string`  | —            | Widget width                                                        |
| `height`     | `number \| string`  | —            | Widget height (starting point when auto-grow/shrink enabled)        |
| `autoGrow`   | `boolean \| number` | `true`       | Auto-grow height to fit content. Number sets max height in pixels   |
| `autoShrink` | `boolean \| number` | `true`       | Auto-shrink height to fit content. Number sets min height in pixels |
| `lazy`       | `boolean`           | `false`      | Lazy-load with IntersectionObserver                                 |

## Dialog Options

| Option       | Type                | Default | Description                                                         |
| ------------ | ------------------- | ------- | ------------------------------------------------------------------- |
| `size`       | `number`            | `80`    | Percentage of viewport (desktop)                                    |
| `width`      | `number \| string`  | —       | Width override                                                      |
| `height`     | `number \| string`  | —       | Height override                                                     |
| `fullScreen` | `boolean`           | `false` | Full-screen mode                                                    |
| `autoGrow`   | `boolean \| number` | `false` | Auto-grow height to fit content. Number sets max height in pixels   |
| `autoShrink` | `boolean \| number` | `false` | Auto-shrink height to fit content. Number sets min height in pixels |

Plus all [modal options](#modal-options) and [common options](#common-options).

## Drawer Options

| Option     | Type                  | Default   | Description                                            |
| ---------- | --------------------- | --------- | ------------------------------------------------------ |
| `position` | `'left'` \| `'right'` | `'right'` | Slide direction                                        |
| `width`    | `number \| string`    | `'420px'` | Panel width                                            |
| `modal`    | `boolean`             | `false`   | Show overlay, lock scroll, and enable Escape key close |

Plus all [modal options](#modal-options) and [common options](#common-options).

## Popover Options

| Option       | Type                                | Default          | Description                                                         |
| ------------ | ----------------------------------- | ---------------- | ------------------------------------------------------------------- |
| `position`   | `'bottom-right'` \| `'bottom-left'` | `'bottom-right'` | Corner position                                                     |
| `width`      | `number \| string`                  | `'380px'`        | Panel width                                                         |
| `height`     | `number \| string`                  | `'520px'`        | Panel height                                                        |
| `autoGrow`   | `boolean \| number`                 | `false`          | Auto-grow height to fit content. Number sets max height in pixels   |
| `autoShrink` | `boolean \| number`                 | `false`          | Auto-shrink height to fit content. Number sets min height in pixels |
| `modal`      | `boolean`                           | `false`          | Close on click outside                                              |

Plus all [modal options](#modal-options) and [common options](#common-options).

## Button Options

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

## Triggers

Triggers are composable — add multiple triggers to a single surface:

```js
const handle = createDialog("ID");

handle.addTrigger({ type: "load" }); // Open on page load
handle.addTrigger({ type: "scroll", threshold: 50 }); // Open at 50% scroll
handle.addTrigger({ type: "exit", sensitivity: 20 }); // Open on exit intent
handle.addTrigger({ type: "time", delay: 5000 }); // Open after 5s
handle.addTrigger({ type: "scroll", threshold: 80, action: "close" }); // Custom action

// Remove a specific trigger
const cleanup = handle.addTrigger({ type: "time", delay: 3000 });
cleanup();

// Remove all triggers
handle.clearTriggers();
```

`preventReopenOnClose: true` uses `localStorage` to suppress re-triggers after the user closes.

## Events

All surfaces emit typed events via `handle.on()` / `handle.off()`:

| Event             | Payload                    | Surfaces   |
| ----------------- | -------------------------- | ---------- |
| `ready`           | `{ surveyId }`             | All        |
| `started`         | `{ surveyId, responseId }` | All        |
| `submit`          | `{ surveyId, responseId }` | All        |
| `questionChanged` | `{ surveyId, ref }`        | All        |
| `heightChanged`   | `{ surveyId, height }`     | All        |
| `open`            | `void`                     | Modal only |
| `close`           | `{ surveyId }`             | Modal only |

## Return Values

### WidgetHandle

```ts
interface WidgetHandle {
  on(event, callback): void;
  off(event, callback): void;
  addTrigger(config): () => void;
  clearTriggers(): void;
  preload(): void;
  refresh(): void;
  unmount(): void;
}
```

### ModalHandle

```ts
interface ModalHandle {
  on(event, callback): void;
  off(event, callback): void;
  preload(): void; // Requires keepSession
  open(): void;
  close(): void;
  toggle(): void;
  addTrigger(config): () => void;
  clearTriggers(): void;
  refresh(): void;
  unmount(): void;
}
```

### ButtonHandle

```ts
interface ButtonHandle {
  show(): void;
  hide(): void;
  addTrigger(config): () => void;
  clearTriggers(): void;
  unmount(): void;
}
```

## Global API

After loading the script tag, `window.yo` is available:

```js
window.yo.load(); // Re-scan DOM for new data-yo-* elements
window.yo.reload(); // Destroy all embeds and re-initialize
window.yo.setTheme("dark");

// All create functions are also available:
const dialog = window.yo.createDialog("SURVEY_ID", { size: 80 });
```
