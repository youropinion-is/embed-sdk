/** The origin the SDK expects survey messages from when no custom domain is set. */
export const SURVEY_ORIGIN = "https://share.youropinion.is";

/** The window of an iframe the SDK created; fails the test when the iframe is not in the document. */
export function iframeWindow(iframe: HTMLIFrameElement | null | undefined): Window {
    const source = iframe?.contentWindow;
    if (!source) throw new Error("the SDK's iframe should be in the document");
    return source;
}

/**
 * Dispatch a message on the host window as if `source` had posted it. Uses jsdom's MessageEvent, not
 * Node's, and sets `source`: the SDK ignores a message whose source is not its own iframe's window.
 */
export function postFromWindow(source: Window, data: unknown, origin = SURVEY_ORIGIN): void {
    window.dispatchEvent(new window.MessageEvent("message", { data, origin, source }));
}

/** Dispatch a message as if the survey inside `iframe` had posted it. */
export function postFromIframe(
    iframe: HTMLIFrameElement | null | undefined,
    data: unknown,
    origin = SURVEY_ORIGIN,
): void {
    postFromWindow(iframeWindow(iframe), data, origin);
}
