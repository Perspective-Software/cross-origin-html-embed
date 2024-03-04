import { describe, test, expect } from "@jest/globals";
import { isValidHostMessage } from "../../../src/client";

describe("isValidHostMessage", () => {
  test("Yes", () => {
    expect(
      isValidHostMessage({
        isCrossOriginHtmlEmbedMessage: true,
        source: "host",
      }),
    ).toBe(true);
  });

  test("Missing flag", () => {
    expect(
      isValidHostMessage({
        source: "host",
      }),
    ).toBe(false);
  });

  test("Wrong source", () => {
    expect(
      isValidHostMessage({
        isCrossOriginHtmlEmbedMessage: true,
        source: "42",
      }),
    ).toBe(false);
  });
});
