import { IframeDimensionsUpdateMessage, IframeMessage } from "../types";
import { isValidIframeMessage } from "../utils";

export type ReceiveIframeMessagesOptions = {
  iframeEmitterCheck?: "strictSourceCheck" | "sourceOrOriginCheck";
};

/**
 * Listens for messages sent via "postMessage" from the iframe sandbox.
 * Only valid iframe messages are consumed and passed to the given callback.
 * Internally the method uses "isValidIframeMessage" to check that.
 * You can control for which origins to listen for.
 *
 * Regarding options:
 * "iframeEmitterCheck" option allows you to specify how this method shall filter messages in case
 * the first parameter is an iframe. "strictSourceCheck" means, that event.source must
 * be iframe.contentWindow. "sourceOrOriginCheck" means, event.source must match or
 * the origin must match the iframe's src or (in case you passed an origin as string) it event.origin
 * must match the origin(s). Default is "strictSourceCheck".
 *
 * @param originOrIframe Single string or array of strings represent origin(s) to receive messages from. In case you pass an iframe element the methods tries to resolve the origin.
 * @param callback Callback to be executed when a valid iframe message has been received.
 * @param options Optional options.
 * @return Unsubscribe/unlisten function. Detaches the "message" event listener.
 */
export const receiveIframeMessages = /* #__PURE__ */ function (
  originOrIframe: string | string[] | HTMLIFrameElement,
  callback: (message: IframeMessage) => void,
  options: ReceiveIframeMessagesOptions = {
    iframeEmitterCheck: "strictSourceCheck",
  },
): () => void {
  let sourceChecker: ((event: MessageEvent) => boolean) | null = null;

  if (typeof originOrIframe === "string") {
    sourceChecker = (event) => {
      return originOrIframe === "*" || event.origin === originOrIframe;
    };
  } else if (Array.isArray(originOrIframe)) {
    if (originOrIframe.length === 0) {
      throw new Error("Got empty origin list.");
    }

    sourceChecker = (event) => {
      return (
        originOrIframe.includes("*") || originOrIframe.includes(event.origin)
      );
    };
  } else if (
    originOrIframe &&
    (originOrIframe as unknown as Record<string, unknown>).nodeType === 1 &&
    (originOrIframe as unknown as Record<string, unknown>).tagName === "IFRAME"
  ) {
    if (options.iframeEmitterCheck === "strictSourceCheck") {
      sourceChecker = (event) => {
        return event.source === originOrIframe.contentWindow;
      };
    } else if (options.iframeEmitterCheck === "sourceOrOriginCheck") {
      let srcOrigin: string = "";
      const srcAttribute = originOrIframe.getAttribute("src");

      if (srcAttribute && srcAttribute.length > 0) {
        srcOrigin = new URL(srcAttribute, window.location.href).origin;
      }

      if (srcOrigin.length === 0) {
        throw new Error("Iframe's src was not set or empty.");
      }

      sourceChecker = (event) => {
        return (
          event.source === originOrIframe.contentWindow ||
          srcOrigin === event.origin
        );
      };
    }
  }

  if (!sourceChecker) {
    throw new Error(
      "Could not create a source checker. Did you pass null for originOrIframe?",
    );
  }

  const messageListener = (event: MessageEvent) => {
    if (
      sourceChecker &&
      sourceChecker(event) &&
      isValidIframeMessage(event.data)
    ) {
      callback(event.data as IframeMessage);
    }
  };

  window.addEventListener("message", messageListener);

  return () => {
    window.removeEventListener("message", messageListener);
  };
};

/**
 * Listens only for dimension update messages from iframes.
 * Uses "receiveIframeMessages" under the hood and filters received messages.
 *
 * Regarding options:
 * "iframeEmitterCheck" option allows you to specify how this method shall filter messages in case
 * the first parameter is an iframe. "strictSourceCheck" means, that event.source must
 * be iframe.contentWindow. "sourceOrOriginCheck" means, event.source must match or
 * the origin must match the iframe's src or (in case you passed an origin as string) it event.origin
 * must match the origin(s). Default is "strictSourceCheck".
 *
 * @param originOrIframe Single string or array of strings represent origin(s) to receive messages from. In case you pass an iframe element the methods tries to resolve the origin.
 * @param callback Callback to be executed when a dimensions update message has been received.
 * @param options Optional options.
 * @return Unsubscribe/unlisten function. Detaches the "message" event listener.
 */
export const receiveIframeDimensionsUpdates = /* #__PURE__ */ function (
  originOrIframe: string | string[] | HTMLIFrameElement,
  callback: (message: IframeDimensionsUpdateMessage) => void,
  options?: ReceiveIframeMessagesOptions,
): () => void {
  return receiveIframeMessages(
    originOrIframe,
    (message) => {
      if (message.type === "dimensions-update") {
        callback(message as IframeDimensionsUpdateMessage);
      }
    },
    options,
  );
};
