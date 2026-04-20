# Dialog

The dialog opens a centered modal overlay. It dims the page, locks body scroll, and traps focus until the user closes it.

**Best for:** Post-action surveys, onboarding flows, NPS prompts where you need the user's full attention.

## Usage

### JavaScript

```js
import { createDialog } from "@youropinion/embed";

const dialog = createDialog("YOUR_SURVEY_ID", {
    size: 70,
    waitForReady: true,
});

document.querySelector("#open-btn").onclick = () => dialog.open();
```

### React

```tsx
import { useDialog } from "@youropinion/embed/react";

function SurveyDialog() {
    const dialog = useDialog("YOUR_SURVEY_ID", {
        size: 70,
        waitForReady: true,
    });

    return <button onClick={() => dialog.open()}>Give Feedback</button>;
}
```

### HTML (no JavaScript)

```html
<button data-yo-dialog="YOUR_SURVEY_ID">Give Feedback</button>
<script src="https://embed.youropinion.is/v1/embed.js"></script>
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
| `waitForReady` | `boolean`                     | `false`  | Keep the dialog hidden until the survey is fully loaded.        |

### Modal Options

Shared across all modal surfaces (Dialog, Drawer, Popover):

| Option                 | Type                | Default | Description                                               |
| ---------------------- | ------------------- | ------- | --------------------------------------------------------- |
| `autoClose`            | `boolean \| number` | —       | Auto-close after submit. `true` = 3 s, or milliseconds.   |
| `preventReopenOnClose` | `boolean`           | `false` | Don't re-open after the user closes. Uses `localStorage`. |
| `keepSession`          | `boolean`           | `false` | Preserve survey state when closed and reopened.           |

### Dialog Options

| Option       | Type                | Default | Description                                                                                        |
| ------------ | ------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| `size`       | `number`            | `80`    | Dialog dimensions as a percentage of the viewport (`80` → 80 vw × 80 vh). Desktop only.            |
| `width`      | `number \| string`  | —       | Explicit width. Overrides `size`. Numbers are treated as pixels.                                   |
| `height`     | `number \| string`  | —       | Explicit height. Overrides `size`. Numbers are treated as pixels.                                  |
| `autoGrow`   | `boolean \| number` | `false` | Grow the dialog height when survey content gets taller. Pass a number to set a max height (px).    |
| `autoShrink` | `boolean \| number` | `false` | Shrink the dialog height when survey content gets shorter. Pass a number to set a min height (px). |
| `fullScreen` | `boolean`           | `false` | Open in full-screen mode (100 vw × 100 vh, no border-radius).                                      |

> **Mobile:** On screens ≤ 768 px the dialog always fills the full viewport regardless of `size`, `width`, or `height`.

## waitForReady

When `waitForReady: true` the overlay stays hidden until the survey sends `survey-ready`. This avoids showing the internal loading/splash screen to the user.

```js
createDialog("YOUR_SURVEY_ID", { waitForReady: true });
```

## Programmatic Control

```js
const dialog = createDialog("YOUR_SURVEY_ID", { ... });

dialog.open()      // Show the dialog
dialog.close()     // Hide the dialog
dialog.toggle()    // Toggle open/close
dialog.refresh()   // Reload the survey
dialog.unmount()   // Remove from DOM and clean up
```

### Preloading

With `keepSession: true` you can silently preload the survey before the user triggers the dialog:

```js
const dialog = createDialog("YOUR_SURVEY_ID", { keepSession: true, waitForReady: true });
dialog.preload(); // Start loading immediately, dialog stays hidden
// Later...
dialog.open(); // Opens instantly — already loaded
```

### Events

```js
dialog.on("open", () => {
    /* dialog opened */
});
dialog.on("close", ({ surveyId }) => {
    /* dialog closed */
});
dialog.on("ready", ({ surveyId }) => {
    /* survey loaded */
});
dialog.on("started", ({ surveyId, responseId }) => {
    /* first answer given */
});
dialog.on("submit", ({ surveyId, responseId }) => {
    /* survey submitted */
});
dialog.on("questionChanged", ({ surveyId, ref }) => {
    /* page/question changed */
});

dialog.off("open", handler); // Unsubscribe
```

## CSS Classes

| Class                            | Description                         |
| -------------------------------- | ----------------------------------- |
| `.yo-embed-dialog-overlay`       | Full-screen dimming overlay         |
| `.yo-embed-dialog-overlay--open` | Applied while the dialog is visible |
| `.yo-embed-dialog`               | The dialog panel                    |
| `.yo-embed-dialog--fullscreen`   | Applied when `fullScreen: true`     |
| `.yo-embed-dialog-close`         | Close button (top-right corner)     |

## CSS Custom Properties

Override these on `.yo-embed-dialog` to customise the appearance:

| Property             | Default                              | Description             |
| -------------------- | ------------------------------------ | ----------------------- |
| `--yo-bg`            | `#fff` (dark: `#1a1a1a`)             | Panel background colour |
| `--yo-border-radius` | `12px`                               | Panel corner radius     |
| `--yo-shadow`        | `0 25px 50px -12px rgba(0,0,0,0.25)` | Panel drop shadow       |
| `--yo-overlay-bg`    | `rgba(0, 0, 0, 0.6)`                 | Overlay background      |

```css
/* Example: square corners and a lighter overlay */
.yo-embed-dialog {
    --yo-border-radius: 0;
    --yo-overlay-bg: rgba(0, 0, 0, 0.3);
}
```
