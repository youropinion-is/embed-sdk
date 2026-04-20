# YourOpinion Embed SDK

[![npm](https://img.shields.io/npm/v/@youropinion/embed)](https://www.npmjs.com/package/@youropinion/embed)
[![gzip size](https://img.shields.io/bundlephobia/minzip/@youropinion/embed)](https://bundlephobia.com/package/@youropinion/embed)

Drop a survey into any website with one line of HTML. No build step, no dependencies, under 30 KB.

```html
<div data-yo-widget="SURVEY_ID"></div>
<script src="https://share.youropinion.is/embed/latest.js"></script>
```

[YouOpinion](https://youropinion.is) is a survey platform for feedback, research, and satisfaction measurement. Design your survey at [youropinion.is](https://youropinion.is), grab the survey ID, and embed it anywhere — your marketing site, SaaS app, intranet, or mobile webview.

### Why this SDK?

- **One line to embed** — add a `data-yo-widget` attribute and you're done
- **5 embed surfaces** — inline widget, modal dialog, side drawer, corner popover, floating button
- **React bindings** — first-class hooks and components via `@youropinion/embed/react`
- **Smart triggers** — open on load, scroll depth, exit-intent, or timed delay
- **Typed events** — listen for `ready`, `started`, `submit`, `questionChanged`, `heightChanged`
- **Theming** — light, dark, or auto to match the host page
- **Tiny footprint** — zero dependencies, tree-shakeable ESM + UMD, works with any bundler or CDN

## Install

```bash
pnpm add @youropinion/embed
```

Or skip the install and use the CDN — the script tag in the intro is all you need.

## Quick Start

Open a dialog on button click (CDN, no bundler):

```html
<button id="open-survey">Give Feedback</button>
<script src="https://share.youropinion.is/embed/latest.js"></script>
<script>
  const { open, close, toggle } = window.yo.createDialog("SURVEY_ID");
  document.querySelector("#open-survey").onclick = toggle;
</script>
```

### ES module

```js
import { createWidget } from "@youropinion/embed";

createWidget("SURVEY_ID", {
  container: document.querySelector("#survey"),
});
```

### React

```tsx
import { EmbedWidget } from "@youropinion/embed/react";

function App() {
  return <EmbedWidget surveyId="SURVEY_ID" autoGrow />;
}
```

## Surfaces

| Surface | Function          | Description                       |
| ------- | ----------------- | --------------------------------- |
| Widget  | `createWidget()`  | Inline embed inside a container   |
| Dialog  | `createDialog()`  | Centered modal overlay            |
| Drawer  | `createDrawer()`  | Side panel from screen edge       |
| Popover | `createPopover()` | Corner floating panel             |
| Button  | `createButton()`  | UI control that opens any surface |

```js
import { createDialog, createButton } from "@youropinion/embed";

const dialog = createDialog("SURVEY_ID", { size: 80, autoClose: 3000 });
dialog.open();

// Attach a feedback tab button
const tab = createButton(dialog, { position: "right", text: "Feedback" });
```

### HTML shortcuts

```html
<!-- Feedback tab (button + drawer) -->
<div data-yo-feedback-tab="SURVEY_ID" data-yo-button-text="Feedback"></div>

<!-- Chat bubble (FAB + popover) -->
<div
  data-yo-chat-bubble="SURVEY_ID"
  data-yo-button-tooltip="Share your thoughts!"
></div>
```

## Events

```js
handle.on("submit", ({ responseId }) => console.log("Done:", responseId));
handle.on("ready", () => {});
handle.on("started", ({ responseId }) => {});
handle.on("questionChanged", ({ ref }) => {});
handle.on("heightChanged", ({ height }) => {});
```

## Theme

```js
import { setTheme } from "@youropinion/embed";
setTheme("dark"); // 'light' | 'dark' | 'auto'
```

## Documentation

- [Widget](docs/widget.md)
- [Dialog](docs/dialog.md)
- [Drawer](docs/drawer.md)
- [Popover](docs/popover.md)
- [Configuration & API Reference](docs/api.md)
- [React Bindings](docs/react.md)
- [HTML Data Attributes](docs/html-api.md)
- [Raw iframe Protocol](docs/iframe-protocol.md)

## How to Get Your Survey ID

Find your **survey ID** in the share tab of your account. Create a share channel and enable **"Allow embedding in websites"**.

The share link looks like this:

```
https://share.youropinion.is/#/2:stackables:okvs53ja:websites/eRcK
```

Everything after `/#/` is the survey ID — in this case `2:stackables:okvs53ja:websites/eRcK`.

**Custom domains** — if you've enabled a custom domain, the survey ID is shorter:

```
https://survey.createclarity.eu/#/dqe7lhxw/pVnS
```

The survey ID is still everything after `/#/` (`dqe7lhxw/pVnS`), but you also need to set the `domain` attribute so the SDK knows where to look:

```js
createWidget("dqe7lhxw/pVnS", { domain: "survey.createclarity.eu" });
```

You can also load the SDK from your own domain's CDN to eliminate third-party requests:

```html
<script src="https://survey.createclarity.eu/embed/latest.js"></script>
```

## Browser Support

Chrome 80+, Firefox 80+, Safari 14+, Edge 80+

## License

MIT
