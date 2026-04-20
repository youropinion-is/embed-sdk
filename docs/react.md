# React Bindings

```bash
pnpm add @youropinion/embed
```

Two entry points:

| Import                     | Description                           |
| -------------------------- | ------------------------------------- |
| `@youropinion/embed`       | Main — surfaces, triggers, global API |
| `@youropinion/embed/react` | React hooks and components            |

## EmbedWidget (inline)

```tsx
import { EmbedWidget } from "@youropinion/embed/react";

function Survey() {
  return <EmbedWidget surveyId="SURVEY_ID" autoGrow autoShrink lazy />;
}
```

Accepts all `WidgetOptions` as props (except `container`, which is managed internally). Supports `ref` for accessing `WidgetHandle` methods.

## useDialog / useDrawer / usePopover

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

## EmbedButton

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
