import { describe, expect, test } from "@jest/globals";
import { isValidMessage } from "./message";

describe("isValidMessage", () => {
  test("Yes", () => {
    expect(isValidMessage({ isCrossOriginHtmlEmbedMessage: true })).toBe(true);
  });

  test("Flag false", () => {
    expect(isValidMessage({ isCrossOriginHtmlEmbedMessage: false })).toBe(
      false,
    );
  });

  test("Flag null", () => {
    expect(isValidMessage({ isCrossOriginHtmlEmbedMessage: null })).toBe(false);
  });

  test("Missing flag", () => {
    expect(isValidMessage({})).toBe(false);
  });
});
