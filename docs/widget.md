# Widget

The widget is an inline embed — it renders the survey directly inside a container element on the page, with no overlay or modal. It is also the underlying primitive that all other surfaces (Dialog, Drawer, Popover) use internally.

**Best for:** Embedding a survey directly on a page (e.g. a dedicated feedback page, a sidebar, a card).

## Usage

### JavaScript

```js
import { createWidget } from "@youropinion/embed";

const widget = createWidget("YOUR_SURVEY_ID", {
    container: document.querySelector("#survey-container"),
    width: "100%",
    height: "500px",
});
```

### React

```tsx
import { useRef, useEffect } from "react";
import { createWidget } from "@youropinion/embed";

function SurveyWidget() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const widget = createWidget("YOUR_SURVEY_ID", {
            container: containerRef.current!,
            width: "100%",
        });
        return () => widget.unmount();
    }, []);

    return <div ref={containerRef} />;
}
```

### HTML (no JavaScript)

```html
<div data-yo-widget="YOUR_SURVEY_ID"></div>
<script src="https://embed.youropinion.is/v1/embed.js"></script>
```

## Options

### Common Options

Shared across all surfaces (Widget, Dialog, Drawer, Popover):

| Option         | Type                          | Default  | Description                                                      |
| -------------- | ----------------------------- | -------- | ---------------------------------------------------------------- |
| `theme`        | `'light' \| 'dark' \| 'auto'` | `'auto'` | Color theme. `'auto'` follows `prefers-color-scheme`.            |
| `language`     | `string`                      | auto     | Language code (`en`, `de`, `et`, `fr`, `es`, `nl`, `pt`, `is`).  |
| `domain`       | `string`                      | —        | Custom survey domain URL.                                        |
| `hidden`       | `object`                      | —        | Key-value pairs passed as hidden fields.                         |
| `payload`      | `string`                      | —        | JWT signed payload for pre-filled data.                          |
| `waitForReady` | `boolean`                     | `false`  | Keep the iframe invisible until the survey signals it is loaded. |

### Widget Options

| Option       | Type                | Default  | Description                                                                                    |
| ------------ | ------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `container`  | `HTMLElement`       | —        | **Required.** The element to mount the survey into.                                            |
| `width`      | `number \| string`  | `'100%'` | Iframe width. Numbers are treated as pixels.                                                   |
| `height`     | `number \| string`  | —        | Starting container height. Used as the initial size before content reports its own height.     |
| `autoGrow`   | `boolean \| number` | `true`   | Grow the container when survey content gets taller. Pass a number to set a max height (px).    |
| `autoShrink` | `boolean \| number` | `true`   | Shrink the container when survey content gets shorter. Pass a number to set a min height (px). |
| `lazy`       | `boolean`           | `false`  | Defer loading until the container scrolls into view (uses `IntersectionObserver`).             |

## Height Management

By default (`autoGrow: true`, `autoShrink: true`) the widget automatically resizes its container to match the survey content height as the user navigates between pages.

```js
// Fixed height — disable both
createWidget("ID", { container, height: "500px", autoGrow: false, autoShrink: false });

// Grow only, cap at 800px
createWidget("ID", { container, autoGrow: 800, autoShrink: false });

// Grow and shrink, minimum 200px, maximum 600px
createWidget("ID", { container, autoGrow: 600, autoShrink: 200 });
```

## waitForReady

When `waitForReady: true` the iframe is rendered with `opacity: 0` and fades in once the survey sends `survey-ready` (which fires after the first question is rendered). This avoids a flash of the internal loading/splash screen.

```js
createWidget("YOUR_SURVEY_ID", { container, waitForReady: true });
```

## Programmatic Control

```js
const widget = createWidget("YOUR_SURVEY_ID", { container });

widget.refresh(); // Reload the survey iframe
widget.setTheme("dark"); // Change theme at runtime
widget.unmount(); // Remove from DOM and clean up
```

### Events

```js
widget.on("ready", ({ surveyId }) => {
    /* survey loaded */
});
widget.on("started", ({ surveyId, responseId }) => {
    /* first answer given */
});
widget.on("submit", ({ surveyId, responseId }) => {
    /* survey submitted */
});
widget.on("questionChanged", ({ surveyId, ref }) => {
    /* page/question changed */
});
widget.on("heightChanged", ({ surveyId, height }) => {
    /* content height changed */
});

widget.off("ready", handler); // Unsubscribe
```

## CSS Custom Properties

Override these on the container element to customise the iframe appearance:

| Property  | Description       |
| --------- | ----------------- |
| `--yo-bg` | Background colour |
