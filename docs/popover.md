# Popover

The popover opens a small panel anchored to a corner of the viewport. It floats above the page content without blocking interaction — users can continue browsing with the survey open.

**Best for:** Passive feedback collection, NPS widgets, "How are we doing?" prompts that sit out of the way until the user is ready.

## Usage

### JavaScript

```js
import { createPopover } from "@youropinion/embed";

const popover = createPopover("YOUR_SURVEY_ID", {
  position: "bottom-right",
  waitForReady: true,
});

document.querySelector("#feedback-btn").onclick = () => popover.open();
```

### React

```tsx
import { usePopover } from "@youropinion/embed/react";

function FeedbackPopover() {
  const popover = usePopover("YOUR_SURVEY_ID", {
    position: "bottom-right",
    waitForReady: true,
  });

  return <button onClick={() => popover.open()}>Feedback</button>;
}
```

### HTML (no JavaScript)

```html
<button data-yo-popover="YOUR_SURVEY_ID" data-yo-position="bottom-right">
  Feedback
</button>
<script src="https://share.youropinion.is/embed/latest.js"></script>
```

### With a FAB Button

The most common pattern is to pair the popover with a floating action button using `createButton`:

```js
import { createButton, createPopover } from "@youropinion/embed";

const popover = createPopover("YOUR_SURVEY_ID", { waitForReady: true });
createButton(popover, { position: "bottom-right", text: "Feedback" });
```

See [button.md](./button.md) for full button options.

## Options

### Common Options

Shared across all surfaces (Widget, Dialog, Drawer, Popover):

| Option         | Type                          | Default  | Description                                                     |
| -------------- | ----------------------------- | -------- | --------------------------------------------------------------- |
| `theme`        | `'light' \| 'dark' \| 'auto'` | `'auto'` | Color theme. `'auto'` follows `prefers-color-scheme`.           |
| `language`     | `string`                      | auto     | Language code (`en`, `de`, `et`, `fr`, `es`, `nl`, `pt`, `is`). |
| `domain`       | `string`                      | —        | Custom survey domain URL.                                       |
| `hidden`       | `object`                      | —        | Key-value pairs passed as hidden fields.                        |
| `payload`      | `string`                      | —        | JWT signed payload for pre-filled data.                         |
| `waitForReady` | `boolean`                     | `false`  | Keep the panel hidden until the survey is fully loaded.         |

### Modal Options

Shared across all modal surfaces (Dialog, Drawer, Popover):

| Option                 | Type                | Default | Description                                               |
| ---------------------- | ------------------- | ------- | --------------------------------------------------------- |
| `autoClose`            | `boolean \| number` | —       | Auto-close after submit. `true` = 3 s, or milliseconds.   |
| `preventReopenOnClose` | `boolean`           | `false` | Don't re-open after the user closes. Uses `localStorage`. |
| `keepSession`          | `boolean`           | `false` | Preserve survey state when closed and reopened.           |

### Popover Options

| Option       | Type                              | Default          | Description                                                                                |
| ------------ | --------------------------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| `position`   | `'bottom-right' \| 'bottom-left'` | `'bottom-right'` | Which corner the panel anchors to.                                                         |
| `width`      | `number \| string`                | `'380px'`        | Panel width. Numbers are treated as pixels.                                                |
| `height`     | `number \| string`                | `'520px'`        | Panel height. Numbers are treated as pixels.                                               |
| `autoGrow`   | `boolean \| number`               | `false`          | Grow the panel when survey content gets taller. Pass a number to set a max height (px).    |
| `autoShrink` | `boolean \| number`               | `false`          | Shrink the panel when survey content gets shorter. Pass a number to set a min height (px). |
| `modal`      | `boolean`                         | `false`          | Close the panel when the user clicks outside it.                                           |

> **Mobile:** On screens ≤ 768 px the popover fills the full width and 85 vh, anchored to the bottom of the screen with rounded top corners, regardless of `width` or `height`.

## waitForReady

When `waitForReady: true` the panel stays hidden until the survey sends `survey-ready`. This avoids showing the internal loading/splash screen.

```js
createPopover("YOUR_SURVEY_ID", { waitForReady: true });
```

## Programmatic Control

```js
const popover = createPopover("YOUR_SURVEY_ID", { ... });

popover.open()      // Show the panel
popover.close()     // Hide the panel
popover.toggle()    // Toggle open/close
popover.refresh()   // Reload the survey
popover.unmount()   // Remove from DOM and clean up
```

### Events

```js
popover.on("open", () => {
  /* panel opened */
});
popover.on("close", ({ surveyId }) => {
  /* panel closed */
});
popover.on("ready", ({ surveyId }) => {
  /* survey loaded */
});
popover.on("started", ({ surveyId, responseId }) => {
  /* first answer given */
});
popover.on("submit", ({ surveyId, responseId }) => {
  /* survey submitted */
});
popover.on("questionChanged", ({ surveyId, ref }) => {
  /* page/question changed */
});

popover.off("open", handler); // Unsubscribe
```

## CSS Classes

| Class                                   | Description                        |
| --------------------------------------- | ---------------------------------- |
| `.yo-embed-popover-panel`               | The popover panel                  |
| `.yo-embed-popover-panel--bottom-right` | Panel anchored to bottom-right     |
| `.yo-embed-popover-panel--bottom-left`  | Panel anchored to bottom-left      |
| `.yo-embed-popover-panel--open`         | Applied while the panel is visible |
| `.yo-embed-popover-panel-close`         | Close button (top-right corner)    |

## CSS Custom Properties

Override these on `.yo-embed-popover-panel` to customise the appearance:

| Property             | Default                       | Description             |
| -------------------- | ----------------------------- | ----------------------- |
| `--yo-bg`            | `#fff` (dark: `#1a1a1a`)      | Panel background colour |
| `--yo-border-radius` | `12px`                        | Panel corner radius     |
| `--yo-shadow`        | `0 12px 40px rgba(0,0,0,0.2)` | Panel drop shadow       |

```css
/* Example: custom size and no shadow */
.yo-embed-popover-panel {
  --yo-shadow: none;
  --yo-border-radius: 4px;
}
```
