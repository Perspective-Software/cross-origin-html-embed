import { isValidMessage } from "./message";
import { HostBaseMessage } from "../types";

/**
 * Checks if a given message is a valid message sent by the client/host or not.
 * @param message Message to be checked.
 * @return true if message is from host.
 */
export function isValidHostMessage(message: unknown): boolean {
  return (
    isValidMessage(message) && (message as HostBaseMessage).source === "host"
  );
}
