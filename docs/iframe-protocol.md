# Raw iframe Protocol

For cases where the SDK doesn't fit, you can embed surveys using a raw iframe and the postMessage API.

## URL Format

```
https://share.youropinion.is/#/{surveySlug}/{channelSlug}?theme=light&language=en&payload=...&hidden=...
```

| Parameter  | Values                       | Description                                      |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `language` | `en`, `et`, `de`, `fr`, etc. | Language code. Defaults to international English |
| `theme`    | `light`, `dark`              | Theme preference. Defaults to browser preference |
| `payload`  | string                       | JWT payload for safe links                       |
| `hidden`   | JSON string                  | Hidden fields as JSON-encoded key-value pairs    |

## Messages from the iframe

```json
{ "message": "survey-ready", "surveyId": "..." }
{ "message": "survey-started", "surveyId": "...", "responseId": "..." }
{ "message": "survey-completed", "surveyId": "...", "responseId": "..." }
{ "message": "survey-question-changed", "surveyId": "...", "ref": "..." }
{ "message": "survey-height-changed", "surveyId": "...", "height": 500 }
```

## Messages you can send to the iframe

```json
{ "message": "theme-change", "theme": "light" }
```

## Example

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
