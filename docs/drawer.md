# Drawer

The drawer opens a panel that slides in from the left or right edge of the screen. It overlays the page content without hiding it completely.

**Best for:** Contextual feedback, help desk surveys, non-intrusive feedback collection while users browse.

## Usage

### JavaScript

```js
import { createDrawer } from "@youropinion/embed";

const drawer = createDrawer("YOUR_SURVEY_ID", {
  position: "right",
  width: "450px",
  waitForReady: true,
});

document.querySelector("#open-btn").onclick = () => drawer.open();
```

### React

```tsx
import { useDrawer } from "@youropinion/embed/react";

function SurveyDrawer() {
  const drawer = useDrawer("YOUR_SURVEY_ID", {
    position: "right",
    width: "450px",
    waitForReady: true,
  });

  return <button onClick={() => drawer.open()}>Open Survey</button>;
}
```

### HTML (no JavaScript)

```html
<button data-yo-drawer="YOUR_SURVEY_ID" data-yo-position="right">
  Open Survey
</button>
<script src="https://share.youropinion.is/embed/latest.js"></script>
```

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
| `waitForReady` | `boolean`                     | `false`  | Hold the drawer until the survey is fully loaded. See below.    |

### Modal Options

Shared across all modal surfaces (Dialog, Drawer, Popover):

| Option                 | Type                | Default | Description                                               |
| ---------------------- | ------------------- | ------- | --------------------------------------------------------- |
| `autoClose`            | `boolean \| number` | —       | Auto-close after submit. `true` = 3 s, or milliseconds.   |
| `preventReopenOnClose` | `boolean`           | `false` | Don't re-open after the user closes. Uses `localStorage`. |
| `keepSession`          | `boolean`           | `false` | Preserve survey state when closed and reopened.           |

### Drawer Options

| Option     | Type                | Default   | Description                                                                                         |
| ---------- | ------------------- | --------- | --------------------------------------------------------------------------------------------------- |
| `position` | `'left' \| 'right'` | `'right'` | Which edge the panel slides from.                                                                   |
| `width`    | `number \| string`  | `'420px'` | Panel width. Numbers are treated as pixels. On screens ≤ 768 px the drawer always fills full width. |
| `modal`    | `boolean`           | `false`   | Add a dimming overlay and lock body scroll. Without this the page remains interactive while open.   |

## waitForReady

When `waitForReady: true` the drawer does not open immediately. Instead it slides in ~40 px from the edge to show a loading indicator, then slides fully open once the survey is ready.

This avoids showing the internal loading/splash screen and gives the user a clear signal that something is happening.

## Programmatic Control

```js
const drawer = createDrawer("YOUR_SURVEY_ID", { ... });

drawer.open()      // Slide the panel in
drawer.close()     // Slide the panel out
drawer.toggle()    // Toggle open/close
drawer.refresh()   // Reload the survey
drawer.unmount()   // Remove from DOM and clean up
```

### Events

```js
drawer.on("open", () => {
  /* drawer opened */
});
drawer.on("close", ({ surveyId }) => {
  /* drawer closed */
});
drawer.on("ready", ({ surveyId }) => {
  /* survey loaded */
});
drawer.on("started", ({ surveyId, responseId }) => {
  /* first answer given */
});
drawer.on("submit", ({ surveyId, responseId }) => {
  /* survey submitted */
});
drawer.on("questionChanged", ({ surveyId, ref }) => {
  /* page/question changed */
});

drawer.off("open", handler); // Unsubscribe
```

## CSS Classes

| Class                            | Description                                                      |
| -------------------------------- | ---------------------------------------------------------------- |
| `.yo-embed-drawer-overlay`       | Backdrop overlay (only present when `modal: true`)               |
| `.yo-embed-drawer-overlay--open` | Applied to the overlay while the drawer is open                  |
| `.yo-embed-drawer`               | The drawer panel                                                 |
| `.yo-embed-drawer--right`        | Panel anchored to the right edge                                 |
| `.yo-embed-drawer--left`         | Panel anchored to the left edge                                  |
| `.yo-embed-drawer--open`         | Applied when the drawer is fully open                            |
| `.yo-embed-drawer--peek`         | Applied while `waitForReady` is pending (partial slide-in state) |
| `.yo-embed-drawer-close`         | Close button (hidden during peek)                                |
| `.yo-embed-drawer-body`          | Inner body containing the iframe                                 |

## CSS Custom Properties

Override these on `.yo-embed-drawer` to customise the appearance:

| Property          | Default                        | Description             |
| ----------------- | ------------------------------ | ----------------------- |
| `--yo-bg`         | `#fff` (dark: `#1a1a1a`)       | Panel background colour |
| `--yo-shadow`     | `-4px 0 24px rgba(0,0,0,0.15)` | Panel drop shadow       |
| `--yo-overlay-bg` | `rgba(0, 0, 0, 0.4)`           | Overlay background      |

```css
/* Example: custom background and no shadow */
.yo-embed-drawer {
  --yo-bg: #f5f5f5;
  --yo-shadow: none;
}
```
