import { beforeEach, describe, expect, test } from "@jest/globals";
import { generateIframeHtml } from "../../src/server";
import { beforeAllCreateTestServer } from "../../test-utils/testServer";
import { JSDOM } from "jsdom";
import {
  IframeDimensionsUpdateMessage,
  IframeMessage,
  isValidIframeMessage,
  receiveIframeDimensionUpdates,
  receiveIframeMessages,
  sendSetBodyContentMessage,
  sendSetHeadContentMessage,
} from "../../src/client";
import { pause } from "../../test-utils/pause";

/**
 * In this test file we connect client and server code.
 *
 * We set up a test server that serves HTML generated by the server part
 * of this library.
 *
 * In the tests we use the client methods to send messages / receive messages.
 */

describe("Integration tests with headless browser", () => {
  // Frist we set up two test servers that serve
  // - the host HTML
  // - and the iframe HTML
  const hostOrigin = "http://test.abc.localhost";

  const iframeTestServerState = beforeAllCreateTestServer(() => {
    return generateIframeHtml({
      name: "Integration Test",
      allowAllOrigins: true,
    }).replace(
      "</head>",
      `
            <script>
              ResizeObserver = class ResizeObserver {
                constructor(callback) {
                    if ( !Array.isArray(window.ResizeObserverCallbacks) ) {
                        window.ResizeObserverCallbacks = [];
                    }
                    window.ResizeObserverCallbacks.push(callback);
                }
                observe() {
                  // do nothing
                }
                unobserve() {
                  // do nothing
                }
                disconnect() {
                  // do nothing
                }
              };
            </script>
          </head>`,
    );
  });

  async function createSetup() {
    const hostDom = new JSDOM(
      `<!DOCTYPE html>
    <html lang="de">
        <head>
            <title>Integration Test Host</title>
        </head>
        <body>
            <h1>Integration Test</h1>
            <iframe width="100%" height="200" style="border: 2px solid black;" src="${`http://localhost:${iframeTestServerState.port}`}"></iframe>
        </body>
    </html>
    `,
      {
        url: hostOrigin,
        resources: "usable",
        runScripts: "dangerously",
      },
    );

    const hostWindow = hostDom.window;
    const hostDocument = hostWindow.document;

    (global as unknown as Record<string, unknown>).window = hostWindow;

    const iframe = hostDocument.querySelector("iframe") as HTMLIFrameElement;
    const iframeWindow = iframe.contentWindow as Window;
    const iframeDocument = iframeWindow.document;

    let resolve: () => void = () => undefined;
    const iframeOnLoadPromise = new Promise<void>((r) => {
      resolve = r;
    });
    iframe.onload = resolve;
    await iframeOnLoadPromise;

    return {
      hostDom,
      hostWindow,
      hostDocument,
      iframe,
      iframeWindow,
      iframeDocument,
    };
  }

  const globalWindow: unknown = global.window;
  beforeEach(() => {
    (global as unknown as Record<string, unknown>).window = globalWindow;
  });

  test("Head content is added", async () => {
    const { iframeWindow, iframeDocument } = await createSetup();

    sendSetHeadContentMessage(
      iframeWindow,
      "<meta name='hello' content='world'>",
      {
        targetOrigins: ["*"],
      },
    );

    await pause(1);

    const meta = iframeDocument.head.querySelector("meta[name='hello']");
    expect(meta).toBeTruthy();
    expect(meta?.getAttribute("content")).toBe("world");
  });

  test("Body content is added", async () => {
    const { iframeWindow, iframeDocument } = await createSetup();

    sendSetBodyContentMessage(iframeWindow, "<h1>Hello World!</h1>", {
      targetOrigins: ["*"],
    });

    await pause(1);

    const heading = iframeDocument.body.querySelector("h1");
    expect(heading).toBeTruthy();
    expect(heading?.innerHTML).toBe("Hello World!");
  });

  test("Head inline scripts get executed", async () => {
    const { iframeWindow } = await createSetup();

    sendSetHeadContentMessage(
      iframeWindow,
      "<script>window.RICK_AND = 'MORTY';</script>",
      {
        targetOrigins: ["*"],
      },
    );

    await pause(1);

    expect(
      (iframeWindow as unknown as Record<string, unknown>)["RICK_AND"],
    ).toEqual("MORTY");
  });

  test("Body inline scripts get executed", async () => {
    const { iframeWindow } = await createSetup();

    sendSetBodyContentMessage(
      iframeWindow,
      "<script>window.MR_MEE = 'SEEKS';</script>",
      {
        targetOrigins: ["*"],
      },
    );

    await pause(1);

    expect(
      (iframeWindow as unknown as Record<string, unknown>)["MR_MEE"],
    ).toEqual("SEEKS");
  });

  test("Head external scripts are loaded", async () => {
    const { iframeWindow } = await createSetup();

    sendSetHeadContentMessage(
      iframeWindow,
      `<script src="https://code.jquery.com/jquery-3.7.1.min.js" integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=" crossorigin="anonymous"></script>`,
      {
        targetOrigins: ["*"],
      },
    );

    const windowAsRecord = iframeWindow as unknown as Record<string, unknown>;
    for (let i = 0; i < 40; i++) {
      if (windowAsRecord.$ && windowAsRecord.jQuery) break;
      await pause(250);
    }

    expect(windowAsRecord.$).toBeTruthy();
    expect(windowAsRecord.jQuery).toBeTruthy();
  });

  test("Body external scripts are loaded", async () => {
    const { iframeWindow } = await createSetup();

    sendSetBodyContentMessage(
      iframeWindow,
      `<script src="https://code.jquery.com/jquery-3.7.1.min.js" integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=" crossorigin="anonymous"></script>`,
      {
        targetOrigins: ["*"],
      },
    );

    const windowAsRecord = iframeWindow as unknown as Record<string, unknown>;
    for (let i = 0; i < 40; i++) {
      if (windowAsRecord.$ && windowAsRecord.jQuery) break;
      await pause(250);
    }

    expect(windowAsRecord.$).toBeTruthy();
    expect(windowAsRecord.jQuery).toBeTruthy();
  });

  test("Parent receives size updates on resize event", async () => {
    const { iframeWindow, iframeDocument } = await createSetup();

    let receivedMessage: IframeDimensionsUpdateMessage | null = null;
    receiveIframeDimensionUpdates("*", (message) => {
      receivedMessage = message;
    });

    const resizeEvent = iframeDocument.createEvent("Event");
    resizeEvent.initEvent("resize", true, true);
    iframeWindow.dispatchEvent(resizeEvent);

    await pause(1);

    expect(receivedMessage).toBeTruthy();
    expect(isValidIframeMessage(receivedMessage)).toBe(true);
    expect(
      typeof (receivedMessage as unknown as IframeDimensionsUpdateMessage).data
        .documentElementHeight,
    ).toBe("number");
  });

  test("ResizeObserver triggers size update message", async () => {
    const { iframeWindow, iframeDocument } = await createSetup();

    let receivedMessage: IframeMessage | null = null;
    receiveIframeMessages("*", (message) => {
      receivedMessage = message;
    });

    (
      iframeWindow as unknown as { ResizeObserverCallbacks: (() => void)[] }
    ).ResizeObserverCallbacks.forEach((resizeObserverCallback) => {
      resizeObserverCallback();
    });

    await pause(1);

    expect(receivedMessage).toBeTruthy();
    expect(isValidIframeMessage(receivedMessage)).toBe(true);
    expect((receivedMessage! as IframeDimensionsUpdateMessage).type).toBe(
      "dimensions-update",
    );
    expect(
      typeof (receivedMessage as unknown as IframeDimensionsUpdateMessage).data
        .documentElementHeight,
    ).toBe("number");
  });
});
