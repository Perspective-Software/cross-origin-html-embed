import { BaseMessage } from "../types";

/**
 * Checks if a given message is a valid message by checking
 * the presence of a specific boolean flag.
 *
 * @param message Message to be checked.
 * @return true if message is valid (client or iframe).
 */
export function isValidMessage(message: unknown): boolean {
  return (
    !!message &&
    typeof message === "object" &&
    (message as BaseMessage).isCrossOriginHtmlEmbedMessage === true
  );
}
