/**
 * PostMessage bridge for communication between the SDK and the survey iframe.
 *
 * Messages FROM iframe (survey → parent):
 *   - survey-ready       { surveyId }
 *   - survey-started     { surveyId, responseId }
 *   - survey-completed   { surveyId, responseId }
 *   - survey-question-changed { surveyId, ref }
 *   - survey-height-changed   { surveyId, height }
 *
 * Messages TO iframe (parent → survey):
 *   - theme-change { theme: 'light' | 'dark' }
 */

import type { EmbedEventMap } from "../types.ts";
import type { Emitter } from "./emitter.ts";

type IncomingMessageType =
  | "survey-ready"
  | "survey-started"
  | "survey-completed"
  | "survey-question-changed"
  | "survey-height-changed";

interface IncomingMessage {
  message: IncomingMessageType;
  surveyId?: string;
  responseId?: string;
  ref?: string;
  height?: number;
  completed?: boolean;
  allowEdits?: boolean;
}

/** Allowed origins for postMessage validation. */
const DEFAULT_ORIGIN = "https://share.youropinion.is";

const VALID_MESSAGES: Set<string> = new Set([
  "survey-ready",
  "survey-started",
  "survey-completed",
  "survey-question-changed",
  "survey-height-changed",
]);

export interface PostMessageBridge {
  /** Start listening for messages from the iframe. */
  listen(): void;

  /** Stop listening and clean up. */
  destroy(): void;

  /** Send a theme change to the iframe. */
  sendThemeChange(theme: "light" | "dark"): void;
}

/**
 * Create a postMessage bridge that forwards iframe events to an emitter.
 */
export function createPostMessageBridge(
  iframe: HTMLIFrameElement,
  surveyId: string,
  emitter: Emitter<EmbedEventMap>,
  customDomain?: string,
  onSurveyCompleted?: (info: { allowEdits: boolean }) => void,
): PostMessageBridge {
  const iframeOrigin = customDomain
    ? new URL(customDomain).origin
    : DEFAULT_ORIGIN;

  function handleMessage(event: MessageEvent) {
    // Only accept messages from the iframe's origin
    if (event.origin !== iframeOrigin) {
      return;
    }

    // Only accept messages from THIS iframe, not other iframes on the page
    if (event.source !== iframe.contentWindow) {
      return;
    }

    const data = event.data;
    if (!data || typeof data !== "object" || typeof data.message !== "string") {
      return;
    }

    if (!VALID_MESSAGES.has(data.message)) {
      return;
    }

    const msg = data as IncomingMessage;
    const id = msg.surveyId || surveyId;

    switch (msg.message) {
      case "survey-ready":
        emitter.emit("ready", { surveyId: id });
        break;
      case "survey-started":
        emitter.emit("started", {
          surveyId: id,
          responseId: msg.responseId || "",
        });
        break;
      case "survey-completed":
        emitter.emit("submit", {
          surveyId: id,
          responseId: msg.responseId || "",
        });
        onSurveyCompleted?.({ allowEdits: msg.allowEdits ?? true });
        break;
      case "survey-question-changed":
        emitter.emit("questionChanged", {
          surveyId: id,
          ref: msg.ref || "",
        });
        break;
      case "survey-height-changed":
        emitter.emit("heightChanged", {
          surveyId: id,
          height: msg.height || 0,
        });
        break;
    }
  }

  return {
    listen() {
      window.addEventListener("message", handleMessage);
    },
    destroy() {
      window.removeEventListener("message", handleMessage);
    },
    sendThemeChange(theme: "light" | "dark") {
      iframe.contentWindow?.postMessage(
        { message: "theme-change", theme },
        iframeOrigin,
      );
    },
  };
}
