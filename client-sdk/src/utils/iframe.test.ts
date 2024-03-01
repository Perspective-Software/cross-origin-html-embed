import { describe, expect, test } from "@jest/globals";
import { isValidIframeMessage } from "./iframe";

describe("isValidIframeMessage", () => {
  test("Yes", () => {
    expect(
      isValidIframeMessage({
        isCrossOriginHtmlEmbedMessage: true,
        source: "iframe",
      }),
    ).toBe(true);
  });

  test("Missing flag", () => {
    expect(
      isValidIframeMessage({
        source: "iframe",
      }),
    ).toBe(false);
  });

  test("Wrong source", () => {
    expect(
      isValidIframeMessage({
        isCrossOriginHtmlEmbedMessage: true,
        source: "42",
      }),
    ).toBe(false);
  });
});
