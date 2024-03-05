import { Message } from "../types";

export type SendHostMessageOptions = {
  targetOrigins?: string[];
};

/**
 * Sends an arbitrary host message to an iframe.
 * By default, the targetOrigin is taken from the iframe's src attribute.
 * You can override the targetOrigin(s) via the "options" parameter.
 *
 * @param iframe Target iframe.
 * @param message Message to be sent.
 * @param options Optional.
 */
export const sendHostMessage = /* #__PURE__ */ function (
  iframe: HTMLIFrameElement,
  message: Message,
  options?: SendHostMessageOptions,
) {
  const iframeWindow: Window | null = iframe.contentWindow;

  if (iframeWindow === null) {
    throw new Error(
      "Could not get the window object. Try altering the iframe settings.",
    );
  }

  // Get origin(s)
  let targetOrigins: string[] = [];

  if (options && options.targetOrigins) {
    targetOrigins = options.targetOrigins;
  } else {
    let srcOrigin: string = "";
    const srcAttribute = iframe.getAttribute("src");

    if (srcAttribute && srcAttribute.length > 0) {
      srcOrigin = new URL(srcAttribute, window.location.href).origin;
    }

    if (srcOrigin.length === 0) {
      throw new Error("Iframe's src was not set or empty.");
    }

    targetOrigins.push(srcOrigin);
  }

  if (targetOrigins.length === 0) {
    throw new Error("Got empty targetOrigin list.");
  }

  for (const targetOrigin of targetOrigins) {
    iframeWindow.postMessage(message, targetOrigin);
  }
};

/**
 * Sends a "set head content" message to the given iframe/window.
 * By default, the targetOrigin is taken from the iframe's src attribute.
 * You can override the targetOrigin(s) via the "options" parameter.
 * Uses "sendHostMessage" under the hood.
 *
 * @param iframe Target iframe or its window.
 * @param headContent Content for iframe head element.
 * @param options Optional.
 */
export const sendSetHeadContentMessage = /* #__PURE__ */ function (
  iframe: HTMLIFrameElement,
  headContent: string,
  options?: SendHostMessageOptions,
) {
  sendHostMessage(
    iframe,
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
 * By default, the targetOrigin is taken from the iframe's src attribute.
 * You can override the targetOrigin(s) via the "options" parameter.
 * Uses "sendHostMessage" under the hood.
 *
 * @param iframe Target iframe or its window.
 * @param bodyContent Content for Embed Guard body element.
 * @param options Optional.
 */
export const sendSetBodyContentMessage = /* #__PURE__ */ function (
  iframe: HTMLIFrameElement,
  bodyContent: string,
  options?: SendHostMessageOptions,
) {
  sendHostMessage(
    iframe,
    {
      isCrossOriginHtmlEmbedMessage: true,
      source: "host",
      type: "set-body-content",
      data: bodyContent,
    },
    options,
  );
};
