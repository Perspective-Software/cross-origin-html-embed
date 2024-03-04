import { beforeEach, describe, expect, test } from "@jest/globals";
import {
  IframeMessage,
  isValidIframeMessage,
  receiveIframeDimensionUpdates,
  receiveIframeMessages,
} from "../../../src/client";
import { beforeAllCreateTestServer } from "../../../test-utils/testServer";
import { pause } from "../../../test-utils/pause";
import { createDomWithIframe } from "../../../test-utils/dom";

describe("receiveIframeMessages", () => {
  testScenarios<IframeMessage>(
    {
      message: {
        isCrossOriginHtmlEmbedMessage: true,
        source: "iframe",
        type: "dimensions-update",
        data: { documentElementHeight: 42 },
      },
      messagesToBeNotReceived: null,
    },
    receiveIframeMessages,
  );
});

describe("receiveIframeDimensionUpdates", () => {
  testScenarios<IframeMessage>(
    {
      message: {
        isCrossOriginHtmlEmbedMessage: true,
        source: "iframe",
        type: "dimensions-update",
        data: { documentElementHeight: 42 },
      },
      messagesToBeNotReceived: [
        {
          isCrossOriginHtmlEmbedMessage: true,
          source: "iframe",
          type: `some-unknown-type-42`,
          data: {},
        } as unknown as IframeMessage,
      ],
    },
    receiveIframeDimensionUpdates,
  );
});

function testScenarios<M extends IframeMessage>(
  data: {
    message: M;
    messagesToBeNotReceived: IframeMessage[] | null;
  },
  receive: (
    originOrIframeOrWindow: string | string[] | HTMLIFrameElement | Window,
    callback: (message: M) => void,
  ) => () => void,
) {
  const hostUrl = "https://send.picklerick.com";

  const serverState = beforeAllCreateTestServer(
    `<!DOCTYPE html>
    <html lang='en'>
        <head>
            <title>Test iframe</title>
        </head>
        <body>
            <script>
                window.addEventListener("message", (event) => {
                    if ( event.data && event.data.executePostMessage === true ) {
                        window.top.postMessage(${JSON.stringify(data.message)}, "${hostUrl}");
                    }
                    
                    if ( event.data && event.data.executeFalseDataPostMessage === true ) {
                        window.top.postMessage(${JSON.stringify(data.messagesToBeNotReceived)}, "${hostUrl}");
                    }
                });
            </script>
        </body>
    </html>`,
  );

  function getIframeSrc() {
    return `http://localhost:${serverState.port}`;
  }

  function createTestSetup() {
    return createDomWithIframe({
      iframe: {
        src: getIframeSrc(),
      },
      jsdom: {
        url: hostUrl,
        resources: "usable",
        runScripts: "dangerously",
      },
      host: {
        rewriteMessageEventOriginsIfMissing: true,
      },
    });
  }

  // Reset global window object
  const globalWindow: unknown = global.window;
  beforeEach(() => {
    (global as unknown as Record<string, unknown>).window = globalWindow;
  });

  test("Null window throws error", () => {
    const { hostWindow } = createTestSetup();
    (global as unknown as Record<string, unknown>).window = hostWindow;

    expect(() => {
      receive(null as unknown as Window, () => undefined);
    }).toThrow();
  });

  test("Empty origin list throws error", () => {
    expect(() => {
      receive([], () => undefined);
    }).toThrow();
  });

  test("Null origin throws error", () => {
    expect(() => {
      receive(
        {
          location: { origin: null },
        } as unknown as Window,
        () => undefined,
      );
    }).toThrow();
  });

  test("Non accessible origin throws error", () => {
    expect(() => {
      const windowMock = {
        location: new Proxy(
          {},
          {
            get() {
              throw new Error();
            },
          },
        ),
      } as unknown as Window;

      receive(windowMock, () => undefined);
    }).toThrow();
  });

  test("Receive with iframe element", async () => {
    const { hostWindow, iframe, iframeWindow, iframeOnLoadPromise } =
      createTestSetup();
    (global as unknown as Record<string, unknown>).window = hostWindow;
    await iframeOnLoadPromise;

    let receivedMessage: M | null = null;

    receive(iframe, (message) => {
      receivedMessage = message;
    });

    // This tells our test server HTML to execute "postMessage" with our data.message.
    iframeWindow.postMessage({ executePostMessage: true }, "*");

    // JSDOM needs some execution slot to process message event listeners.
    await pause(10);

    expect(receivedMessage).toBeTruthy();
    expect(receivedMessage).toEqual(data.message);
    expect(isValidIframeMessage(receivedMessage)).toBe(true);
  });

  test("Receive with window element", async () => {
    const { hostWindow, iframeWindow, iframeOnLoadPromise } = createTestSetup();
    (global as unknown as Record<string, unknown>).window = hostWindow;
    await iframeOnLoadPromise;

    let receivedMessage: M | null = null;

    receive(iframeWindow, (message) => {
      receivedMessage = message;
    });

    // This tells our test server HTML to execute "postMessage" with our data.message.
    iframeWindow.postMessage({ executePostMessage: true }, "*");

    // JSDOM needs some execution slot to process message event listeners.
    await pause(10);

    expect(receivedMessage).toBeTruthy();
    expect(receivedMessage).toEqual(data.message);
    expect(isValidIframeMessage(receivedMessage)).toBe(true);
  });

  test("Receive with single origin", async () => {
    const { hostWindow, iframe, iframeWindow, iframeOnLoadPromise } =
      createTestSetup();
    (global as unknown as Record<string, unknown>).window = hostWindow;
    await iframeOnLoadPromise;

    let receivedMessage: M | null = null;

    receive(getIframeSrc(), (message) => {
      receivedMessage = message;
    });

    // This tells our test server HTML to execute "postMessage" with our data.message.
    iframeWindow.postMessage({ executePostMessage: true }, "*");

    // JSDOM needs some execution slot to process message event listeners.
    await pause(10);

    expect(receivedMessage).toBeTruthy();
    expect(receivedMessage).toEqual(data.message);
    expect(isValidIframeMessage(receivedMessage)).toBe(true);
  });

  test("Receive with asterisk", async () => {
    const { hostWindow, iframe, iframeWindow, iframeOnLoadPromise } =
      createTestSetup();
    (global as unknown as Record<string, unknown>).window = hostWindow;
    await iframeOnLoadPromise;

    let receivedMessage: M | null = null;

    receive("*", (message) => {
      receivedMessage = message;
    });

    // This tells our test server HTML to execute "postMessage" with our data.message.
    iframeWindow.postMessage({ executePostMessage: true }, "*");

    // JSDOM needs some execution slot to process message event listeners.
    await pause(10);

    expect(receivedMessage).toBeTruthy();
    expect(receivedMessage).toEqual(data.message);
    expect(isValidIframeMessage(receivedMessage)).toBe(true);
  });

  test("Receive with multiple origins", async () => {
    const { hostWindow, iframe, iframeWindow, iframeOnLoadPromise } =
      createTestSetup();
    (global as unknown as Record<string, unknown>).window = hostWindow;
    await iframeOnLoadPromise;

    let receivedMessage: M | null = null;

    receive(["https://abc.def.test.localhost", getIframeSrc()], (message) => {
      receivedMessage = message;
    });

    // This tells our test server HTML to execute "postMessage" with our data.message.
    iframeWindow.postMessage({ executePostMessage: true }, "*");

    // JSDOM needs some execution slot to process message event listeners.
    await pause(10);

    expect(receivedMessage).toBeTruthy();
    expect(receivedMessage).toEqual(data.message);
    expect(isValidIframeMessage(receivedMessage)).toBe(true);
  });

  test("Ignore unknown origin", async () => {
    const { hostWindow, iframe, iframeWindow, iframeOnLoadPromise } =
      createTestSetup();
    (global as unknown as Record<string, unknown>).window = hostWindow;
    await iframeOnLoadPromise;

    let receivedMessage: M | null = null;

    receive("http://this.is.the.new.origin.localhost", (message) => {
      receivedMessage = message;
    });

    // This tells our test server HTML to execute "postMessage" with our data.message.
    iframeWindow.postMessage({ executePostMessage: true }, "*");

    // JSDOM needs some execution slot to process message event listeners.
    await pause(10);

    expect(receivedMessage).toBeFalsy();
  });

  test("Unlisten removes message listener", async () => {
    const { hostWindow, iframe, iframeWindow, iframeOnLoadPromise } =
      createTestSetup();
    (global as unknown as Record<string, unknown>).window = hostWindow;
    await iframeOnLoadPromise;

    const receivedMessages: M[] = [];

    const unlisten = receive(getIframeSrc(), (message) => {
      receivedMessages.push(message);
    });

    // This tells our test server HTML to execute "postMessage" with our data.message.
    iframeWindow.postMessage({ executePostMessage: true }, "*");

    // JSDOM needs some execution slot to process message event listeners.
    await pause(10);

    expect(receivedMessages.length).toBe(1);
    expect(receivedMessages[0]).toEqual(data.message);
    expect(isValidIframeMessage(receivedMessages[0])).toBe(true);

    // Now we call "unlisten" and check that no new messages are received
    unlisten();

    iframeWindow.postMessage({ executePostMessage: true }, "*");
    await pause(10);
    expect(receivedMessages.length).toBe(1);
    expect(receivedMessages[0]).toEqual(data.message);
    expect(isValidIframeMessage(receivedMessages[0])).toBe(true);
  });

  if (data.messagesToBeNotReceived && data.messagesToBeNotReceived.length > 0) {
    test("Not receiving other message types", async () => {
      const { hostWindow, iframe, iframeWindow, iframeOnLoadPromise } =
        createTestSetup();
      (global as unknown as Record<string, unknown>).window = hostWindow;
      await iframeOnLoadPromise;

      let receivedMessage: M | null = null;

      receive(getIframeSrc(), (message) => {
        receivedMessage = message;
      });

      // This tells our test server HTML to execute "postMessage" with our data.message.
      iframeWindow.postMessage({ executeFalseDataPostMessage: true }, "*");

      // JSDOM needs some execution slot to process message event listeners.
      await pause(10);

      expect(receivedMessage).toBeFalsy();
    });
  }
}
