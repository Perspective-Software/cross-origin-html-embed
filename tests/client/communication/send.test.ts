import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import {
  HostMessage,
  HostSetBodyContentMessage,
  HostSetHeadContentMessage,
  isValidHostMessage,
  Message,
  sendHostMessage,
  SendHostMessageOptions,
  sendSetBodyContentMessage,
  sendSetHeadContentMessage,
} from "../../../src";
import { beforeAllCreateTestServer } from "../../../test-utils/testServer";
import { pause } from "../../../test-utils/pause";
import { createDomWithIframe } from "../../../test-utils/dom";

describe("sendHostMessage", () => {
  const hostMessage: HostMessage = {
    isCrossOriginHtmlEmbedMessage: true,
    source: "host",
    type: "set-body-content",
    data: "<h1>Squirrels are awesome</h1>",
  };

  testSendScenarios<HostMessage, HostMessage>(
    hostMessage,
    hostMessage,
    sendHostMessage,
    isValidHostMessage,
  );
});

describe("sendSetHeadContentMessage", () => {
  testSendScenarios<string, HostSetHeadContentMessage>(
    "<meta name='fun' content='rickandmorty'>",
    {
      isCrossOriginHtmlEmbedMessage: true,
      source: "host",
      type: "set-head-content",
      data: "<meta name='fun' content='rickandmorty'>",
    },
    sendSetHeadContentMessage,
    isValidHostMessage,
  );
});

describe("sendSetBodyContentMessage", () => {
  testSendScenarios<string, HostSetBodyContentMessage>(
    "<h1>Hedgehogs are awesome</h1>",
    {
      isCrossOriginHtmlEmbedMessage: true,
      source: "host",
      type: "set-body-content",
      data: "<h1>Hedgehogs are awesome</h1>",
    },
    sendSetBodyContentMessage,
    isValidHostMessage,
  );
});

function testSendScenarios<S, R extends Message>(
  dataToSend: S,
  expectedReceivedMessage: R,
  sendMethod: (
    iframe: HTMLIFrameElement,
    data: S,
    options?: SendHostMessageOptions,
  ) => void,
  isValidMessageCheck: (message: R) => boolean,
) {
  const serverState = beforeAllCreateTestServer(
    "<!DOCTYPE html><html lang='en'><head><title>Test iframe</title></head><body></body></html>",
  );

  function getIframeSrc() {
    return `http://localhost:${serverState.port}`;
  }

  function createTestSetup() {
    return createDomWithIframe({
      iframe: { src: getIframeSrc() },
      jsdom: {
        url: "https://send.rickandmorty.com",
        resources: "usable",
      },
    });
  }

  // Reset global window object
  const globalWindow: unknown = global.window;
  beforeEach(() => {
    (global as unknown as Record<string, unknown>).window = globalWindow;
  });

  test("Empty iframe src throws error", async () => {
    const { iframe, iframeOnLoadPromise } = createTestSetup();
    await iframeOnLoadPromise;

    iframe.src = "";

    expect(() => {
      sendMethod(iframe, dataToSend);
    }).toThrow();
  });

  test("Empty origin list throws error", () => {
    const { iframe } = createTestSetup();
    expect(() => {
      sendMethod(iframe, dataToSend, { targetOrigins: [] });
    }).toThrow();
  });

  test("null contentWindow throws error", () => {
    const { iframe } = createTestSetup();

    expect(() => {
      sendMethod({ ...iframe, contentWindow: null }, dataToSend);
    }).toThrow();
  });

  test("Send with iframe element (targetOrigin auto resolved)", async () => {
    const { iframe, iframeWindow, hostWindow } = createTestSetup();
    (global as unknown as Record<string, unknown>).window = hostWindow;

    let receivedValidHostMessage = false;
    let receivedMessage: null | R = null;

    iframeWindow.addEventListener("message", (event) => {
      if (isValidMessageCheck(event.data)) {
        receivedValidHostMessage = true;
        receivedMessage = event.data as R;
      }
    });

    const iframeWindowSpy = jest.spyOn(iframeWindow, "postMessage");

    sendMethod(iframe, dataToSend);

    // JSDOM needs some execution time to process the "message" event listener.
    await pause(10);

    expect(iframeWindowSpy).toHaveBeenCalledWith(
      expectedReceivedMessage,
      getIframeSrc(),
    );

    expect(receivedValidHostMessage).toBe(true);
    expect(receivedMessage).toStrictEqual(expectedReceivedMessage);
  });

  test("Send with explicit targetOrigin", async () => {
    const { iframe, iframeWindow } = createTestSetup();

    let receivedValidHostMessage = false;
    let receivedMessage: null | R = null;

    iframeWindow.addEventListener("message", (event) => {
      if (isValidMessageCheck(event.data)) {
        receivedValidHostMessage = true;
        receivedMessage = event.data as R;
      }
    });

    const iframeWindowSpy = jest.spyOn(iframeWindow, "postMessage");

    sendMethod(iframe, dataToSend, {
      targetOrigins: [getIframeSrc()],
    });

    // JSDOM needs some execution time to process the "message" event listener.
    await pause(10);

    expect(iframeWindowSpy).toHaveBeenCalledWith(
      expectedReceivedMessage,
      getIframeSrc(),
    );

    expect(receivedValidHostMessage).toBe(true);
    expect(receivedMessage).toStrictEqual(expectedReceivedMessage);
  });

  test("Send with multiple explicit targetOrigin", async () => {
    const { iframe, iframeWindow } = createTestSetup();

    let receivedValidHostMessage = false;
    let receivedMessage: null | R = null;

    iframeWindow.addEventListener("message", (event) => {
      if (isValidMessageCheck(event.data)) {
        receivedValidHostMessage = true;
        receivedMessage = event.data as R;
      }
    });

    const iframeWindowSpy = jest.spyOn(iframeWindow, "postMessage");

    sendMethod(iframe, dataToSend, {
      targetOrigins: ["https://test.abc.def.localhost", getIframeSrc()],
    });

    // JSDOM needs some execution time to process the "message" event listener.
    await pause(10);

    expect(iframeWindowSpy).toHaveBeenCalledWith(
      expectedReceivedMessage,
      "https://test.abc.def.localhost",
    );
    expect(iframeWindowSpy).toHaveBeenCalledWith(
      expectedReceivedMessage,
      getIframeSrc(),
    );

    expect(receivedValidHostMessage).toBe(true);
    expect(receivedMessage).toStrictEqual(expectedReceivedMessage);
  });

  test("Send with explicit asterisk targetOrigin", async () => {
    const { iframeWindow, iframe } = createTestSetup();

    let receivedValidHostMessage = false;
    let receivedMessage: null | R = null;

    iframeWindow.addEventListener("message", (event) => {
      if (isValidMessageCheck(event.data)) {
        receivedValidHostMessage = true;
        receivedMessage = event.data as R;
      }
    });

    const iframeWindowSpy = jest.spyOn(iframeWindow, "postMessage");

    sendMethod(iframe, dataToSend, {
      targetOrigins: ["*"],
    });

    // JSDOM needs some execution time to process the "message" event listener.
    await pause(10);

    expect(iframeWindowSpy).toHaveBeenCalledWith(expectedReceivedMessage, "*");

    expect(receivedValidHostMessage).toBe(true);
    expect(receivedMessage).toStrictEqual(expectedReceivedMessage);
  });

  test("Send with explicit incorrect targetOrigin", async () => {
    const { iframe, iframeWindow } = createTestSetup();

    let receivedValidHostMessage = false;
    let receivedMessage: null | R = null;

    iframeWindow.addEventListener("message", (event) => {
      if (isValidMessageCheck(event.data)) {
        receivedValidHostMessage = true;
        receivedMessage = event.data as R;
      }
    });

    const iframeWindowSpy = jest.spyOn(iframeWindow, "postMessage");

    sendMethod(iframe, dataToSend, {
      targetOrigins: ["https://test.abc.def.localhost:12345"],
    });

    // JSDOM needs some execution time to process the "message" event listener.
    await pause(100);

    expect(iframeWindowSpy).toHaveBeenCalledWith(
      expectedReceivedMessage,
      "https://test.abc.def.localhost:12345",
    );

    expect(receivedValidHostMessage).toBe(false);
    expect(receivedMessage).toBe(null);
  });
}
