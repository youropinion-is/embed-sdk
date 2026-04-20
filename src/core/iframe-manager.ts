/**
 * Iframe manager: creates, configures, and manages survey iframes.
 *
 * Responsible for:
 * - Constructing the share URL from surveyId + options
 * - Creating and configuring the iframe element
 * - Wiring up postMessage bridge + theme controller
 * - Providing refresh/unmount operations
 */

import type { CommonOptions, EmbedEventMap } from "../types.ts";
import type { Emitter } from "./emitter.ts";
import { createPostMessageBridge, type PostMessageBridge } from "./postmessage.ts";
import { getGlobalTheme } from "./theme-manager.ts";
import { createThemeController, resolveTheme, type ThemeController } from "./theme.ts";

const DEFAULT_DOMAIN = "https://share.youropinion.is";

export interface IframeInstance {
    /** The iframe element. */
    iframe: HTMLIFrameElement;

    /** The postMessage bridge. */
    bridge: PostMessageBridge;

    /** The theme controller. */
    themeController: ThemeController;

    /** Reload the iframe by resetting its src. */
    refresh(): void;

    /** Remove the iframe and clean up all listeners. */
    destroy(): void;
}

/**
 * Build the share URL for a survey.
 * SurveyId already includes channel: "surveySlug/channelSlug".
 */
export function buildShareUrl(surveyId: string, options: CommonOptions): string {
    const domain = options.domain || DEFAULT_DOMAIN;

    if (domain !== DEFAULT_DOMAIN && !/^https:\/\//i.test(domain)) {
        throw new Error("[@youropinion/embed] domain must use HTTPS.");
    }

    const base = `${domain}/#/${surveyId}`;

    const url = new URL(base);
    const theme = resolveTheme(getGlobalTheme());
    url.searchParams.set("theme", theme);

    if (options.language) {
        url.searchParams.set("language", options.language);
    }
    if (options.payload) {
        url.searchParams.set("payload", options.payload);
    }
    if (options.hidden) {
        // Pass hidden fields as a JSON-encoded string
        url.searchParams.set("hidden", JSON.stringify(options.hidden));
    }

    return url.toString();
}

/**
 * Create a managed iframe instance.
 */
export function createIframeInstance(
    surveyId: string,
    options: CommonOptions,
    emitter: Emitter<EmbedEventMap>,
    onSurveyCompleted?: (info: { allowEdits: boolean }) => void
): IframeInstance {
    const src = buildShareUrl(surveyId, options);

    // Create iframe
    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.style.border = "none";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.display = "block";
    iframe.style.colorScheme = "normal";
    iframe.style.minHeight = "inherit";
    iframe.setAttribute("title", "YouOpinion Survey");
    iframe.setAttribute("allow", "clipboard-write");
    iframe.setAttribute("sandbox", "allow-scripts allow-forms allow-same-origin allow-popups");

    // Create postMessage bridge
    const bridge = createPostMessageBridge(iframe, surveyId, emitter, options.domain, onSurveyCompleted);

    // Create theme controller
    const themeController = createThemeController(bridge);

    // Start listening
    bridge.listen();
    themeController.listen();

    return {
        iframe,
        bridge,
        themeController,
        refresh() {
            // eslint-disable-next-line no-self-assign
            iframe.src = iframe.src;
        },
        destroy() {
            themeController.destroy();
            bridge.destroy();
            iframe.remove();
        },
    };
}
