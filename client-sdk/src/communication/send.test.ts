import { describe, expect, test } from "@jest/globals";
import { ConstructorOptions, JSDOM } from "jsdom";
import { sendHostMessage } from "./send";
import { isValidHostMessage } from "../utils";

const TEST_HOST_URL = "https://picklerick.com";

function createTestSetup(options?: { jsdomOptions?: ConstructorOptions }) {
  const hostHtml = `
    <!doctype html>
    <html lang="en">
        <head>
            <title>Test Setup</title>
            <meta charset=utf-8>
        </head>
        <body>
            <iframe id="test-iframe"></iframe>
        </body>
    </html>`;

  const dom = new JSDOM(hostHtml, options?.jsdomOptions);
  const window = dom.window;
  const document = window.document;

  const iframe = document.getElementById("test-iframe") as HTMLIFrameElement;
  const iframeWindow = iframe.contentWindow as Window;
  const iframeDocument = iframeWindow.document;

  return { dom, window, document, iframe, iframeWindow, iframeDocument };
}

// TODO create tests

describe("sendHostMessage", () => {
  test("Send with iframe element", async () => {
    const { iframe, iframeWindow } = createTestSetup({
      jsdomOptions: { url: TEST_HOST_URL },
    });

    let receivedValidHostMessage = false;

    iframeWindow.addEventListener("message", (event) => {
      if (isValidHostMessage(event.data)) {
        receivedValidHostMessage = true;
      }
    });

    sendHostMessage(
      iframe,
      {
        isCrossOriginHtmlEmbedMessage: true,
        source: "host",
        type: "set-body-content",
        data: "<h1>Squirrels</h1>",
      },
      { targetOrigins: ["*"] },
    );

    await new Promise((r) => setTimeout(r, 1));

    expect(receivedValidHostMessage).toBe(true);
  });

  test("Send with window object", async () => {
    const { iframeWindow } = createTestSetup({
      jsdomOptions: { url: TEST_HOST_URL },
    });

    let receivedValidHostMessage = false;

    iframeWindow.addEventListener("message", (event) => {
      if (isValidHostMessage(event.data)) {
        receivedValidHostMessage = true;
      }
    });

    sendHostMessage(
      iframeWindow,
      {
        isCrossOriginHtmlEmbedMessage: true,
        source: "host",
        type: "set-body-content",
        data: "<h1>Two Squirrels</h1>",
      },
      { targetOrigins: ["*"] },
    );

    await new Promise((r) => setTimeout(r, 1));

    expect(receivedValidHostMessage).toBe(true);
  });

  test("Send with incorrect manual targetOrigin", async () => {
    const { iframe, iframeWindow } = createTestSetup({
      jsdomOptions: { url: TEST_HOST_URL },
    });

    let receivedValidHostMessage = false;

    iframeWindow.addEventListener("message", (event) => {
      if (isValidHostMessage(event.data)) {
        receivedValidHostMessage = true;
      }
    });

    sendHostMessage(
      iframe,
      {
        isCrossOriginHtmlEmbedMessage: true,
        source: "host",
        type: "set-body-content",
        data: "<h1>Squirrels</h1>",
      },
      { targetOrigins: ["https://mortysmith.com"] },
    );

    await new Promise((r) => setTimeout(r, 50));

    expect(receivedValidHostMessage).toBe(false);
  });
});

describe("sendSetHeadContentMessage", () => {
  // TODO copy tests from above and adjust
  test("Send with iframe element", () => {});

  test("Send with window object", () => {});

  test("Send with incorrect manual targetOrigin", () => {});
});

describe("sendSetBodyContentMessage", () => {
  // TODO copy tests from above and adjust
  test("Send with iframe element", () => {});

  test("Send with window object", () => {});

  test("Send with incorrect manual targetOrigin", () => {});
});
