import { IframeDimensionsUpdateMessage, IframeMessage } from "../types";
import { isValidIframeMessage } from "../utils";

/**
 * Listens for messages sent via "postMessage" from the iframe sandbox.
 * Only valid iframe messages are consumed and passed to the given callback.
 * Internally the method uses "isValidIframeMessage" to check that.
 * You can control for which origins to listen for.
 *
 * @param originOrIframeOrWindow Single string or array of strings represent origin(s) to receive messages from. In case you pass an iframe element or a window object, the method tries to infer the origin.
 * @param callback Callback to be executed when a valid iframe message has been received.
 * @return Unsubscribe/unlisten function. Detaches the "message" event listener.
 */
export function receiveIframeMessages(
  originOrIframeOrWindow: string | string[] | HTMLIFrameElement | Window,
  callback: (message: IframeMessage) => void,
): () => void {
  let origins: string[] = [];

  if (typeof originOrIframeOrWindow === "string") {
    origins.push(originOrIframeOrWindow);
  } else if (Array.isArray(originOrIframeOrWindow)) {
    origins = originOrIframeOrWindow;
  } else {
    let window: Window | null = null;

    if (
      originOrIframeOrWindow &&
      (originOrIframeOrWindow as any).nodeType === 1 &&
      (originOrIframeOrWindow as any).tagName === "IFRAME"
    ) {
      window = (originOrIframeOrWindow as HTMLIFrameElement).contentWindow;
    } else {
      window = originOrIframeOrWindow as Window;
    }

    if (!window) {
      throw new Error(
        "window could not be obtained from iframe element or was null/undefined.",
      );
    }

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

    origins = [windowOrigin];
  }

  if (origins.length === 0) {
    throw new Error("Could not retrieve origins to listen for.");
  }

  const messageListener = (event: MessageEvent) => {
    if (
      (origins.includes("*") || origins.includes(event.origin)) &&
      isValidIframeMessage(event.data)
    ) {
      callback(event.data as IframeMessage);
    }
  };

  window.addEventListener("message", messageListener);

  return () => {
    window.removeEventListener("message", messageListener);
  };
}

/**
 * Listens only for dimension update messages from iframes.
 * Uses "receiveIframeMessages" under the hood and filters received messages.
 *
 * @param originOrIframeOrWindow Single string or array of strings represent origin(s) to receive messages from. In case you pass an iframe element or a window object, the method tries to infer the origin.
 * @param callback Callback to be executed when a dimensions update message has been received.
 * @return Unsubscribe/unlisten function. Detaches the "message" event listener.
 */
export function receiveIframeDimensionUpdates(
  originOrIframeOrWindow: string | string[] | HTMLIFrameElement | Window,
  callback: (message: IframeDimensionsUpdateMessage) => void,
): () => void {
  return receiveIframeMessages(originOrIframeOrWindow, (message) => {
    if (message.type === "dimensions-update") {
      callback(message as IframeDimensionsUpdateMessage);
    }
  });
}
