import { isValidMessage } from "./message";
import { IframeMessage } from "../types";

/**
 * Checks if a given message is a message sent by the iframe or not.
 * @param message Message to be checked.
 * @return true if message is from iframe.
 */
export const isValidIframeMessage = /* #__PURE__ */ function (
  message: unknown,
): boolean {
  return (
    isValidMessage(message) && (message as IframeMessage).source === "iframe"
  );
};
