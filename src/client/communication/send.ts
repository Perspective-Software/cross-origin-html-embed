import { Message } from "../types";

export type SendHostMessageOptions = {
  targetOrigins?: string[];
};

/**
 * Sends an arbitrary host message to an iframe.
 * By default, the targetOrigin is taken from the iframe/window object.
 * You can override the targetOrigin(s) via the "options" parameter.
 *
 * @param iframeOrWindow Target iframe or its window.
 * @param message Message to be sent.
 * @param options Optional.
 */
export const sendHostMessage = /* #__PURE__ */ function (
  iframeOrWindow: HTMLIFrameElement | Window,
  message: Message,
  options?: SendHostMessageOptions,
) {
  let window: Window | null = null;

  // Get window
  if (
    iframeOrWindow &&
    (iframeOrWindow as any).nodeType === 1 &&
    (iframeOrWindow as any).tagName === "IFRAME"
  ) {
    window = (iframeOrWindow as HTMLIFrameElement).contentWindow;
  } else {
    window = iframeOrWindow as Window;
  }

  if (window === null) {
    throw new Error(
      "Could not get the window object. Try altering the iframe settings.",
    );
  }

  // Get origin(s)
  let targetOrigins = [];

  if (options && options.targetOrigins) {
    targetOrigins = options.targetOrigins;
  } else {
    let windowOrigin = null;

    try {
      windowOrigin = window.location.origin;
    } catch (e) {
      throw new Error(
        `Could not infer window origin automatically. Either change the iframe settings or specify 'options.origins' manually. (${e})`,
      );
    }

    if (!windowOrigin || windowOrigin === "null") {
      throw new Error("window's origin was undefined or null.");
    }

    targetOrigins = [windowOrigin];
  }

  if (targetOrigins.length === 0) {
    throw new Error("Got empty targetOrigin list.");
  }

  for (const targetOrigin of targetOrigins) {
    window.postMessage(message, targetOrigin);
  }
};

/**
 * Sends a "set head content" message to the given iframe/window.
 * By default, the targetOrigin is taken from the iframe/window object.
 * You can override the targetOrigin(s) via the "options" parameter.
 * Uses "sendHostMessage" under the hood.
 *
 * @param iframeOrWindow Target iframe or its window.
 * @param headContent Content for iframe head element.
 * @param options Optional.
 */
export const sendSetHeadContentMessage = /* #__PURE__ */ function (
  iframeOrWindow: HTMLIFrameElement | Window,
  headContent: string,
  options?: SendHostMessageOptions,
) {
  sendHostMessage(
    iframeOrWindow,
    {
      isCrossOriginHtmlEmbedMessage: true,
      source: "host",
      type: "set-head-content",
      data: headContent,
    },
    options,
  );
};

/**
 * Sends a "set body content" message to the given iframe/window.
 * By default, the targetOrigin is taken from the iframe/window object.
 * You can override the targetOrigin(s) via the "options" parameter.
 * Uses "sendHostMessage" under the hood.
 *
 * @param iframeOrWindow Target iframe or its window.
 * @param bodyContent Content for Embed Guard body element.
 * @param options Optional.
 */
export const sendSetBodyContentMessage = /* #__PURE__ */ function (
  iframeOrWindow: HTMLIFrameElement | Window,
  bodyContent: string,
  options?: SendHostMessageOptions,
) {
  sendHostMessage(
    iframeOrWindow,
    {
      isCrossOriginHtmlEmbedMessage: true,
      source: "host",
      type: "set-body-content",
      data: bodyContent,
    },
    options,
  );
};
