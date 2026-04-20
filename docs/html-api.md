# HTML Data Attributes

All options can be set as `data-yo-*` attributes in kebab-case. The script auto-scans the page on load.

```html
<script src="https://share.youropinion.is/embed/latest.js"></script>
```

## Surfaces

```html
<!-- Inline widget -->
<div data-yo-widget="SURVEY_ID" data-yo-auto-grow data-yo-auto-shrink></div>

<!-- Dialog trigger -->
<button data-yo-dialog="SURVEY_ID" data-yo-size="80">Give Feedback</button>

<!-- Drawer trigger -->
<button data-yo-drawer="SURVEY_ID" data-yo-position="right">Open Survey</button>

<!-- Popover trigger -->
<button data-yo-popover="SURVEY_ID" data-yo-position="bottom-right">
  Open
</button>
```

## Shortcuts

```html
<!-- Feedback tab (button + drawer) -->
<div
  data-yo-feedback-tab="SURVEY_ID"
  data-yo-button-text="Feedback"
  data-yo-button-color="#003366"
  data-yo-position="right"
></div>

<!-- Chat bubble (FAB + popover) -->
<div
  data-yo-chat-bubble="SURVEY_ID"
  data-yo-button-tooltip="Share your thoughts!"
  data-yo-position="bottom-right"
></div>
```

## Options as attributes

```html
<div
  data-yo-widget="SURVEY_ID"
  data-yo-language="de"
  data-yo-auto-grow="800"
  data-yo-auto-shrink="200"
  data-yo-lazy
  data-yo-theme="dark"
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

## Triggers via HTML

```html
<button
  data-yo-dialog="SURVEY_ID"
  data-yo-triggers='[{"type":"time","delay":5000}]'
>
  Open
</button>
```

## Notes

- Elements get a `data-yo-initialized` attribute after initialization to prevent double-init.
- Use `window.yo.load()` to re-scan after dynamically adding elements.
- Use `window.yo.reload()` to tear down all embeds and re-initialize.
