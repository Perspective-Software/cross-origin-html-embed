import {
  afterAll,
  beforeAll,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";
import { ConstructorOptions, JSDOM } from "jsdom";
import {
  sendHostMessage,
  SendHostMessageOptions,
  sendSetHeadContentMessage,
} from "./send";
import { isValidHostMessage } from "../utils";
import { HostMessage, HostSetHeadContentMessage, Message } from "../types";
import express from "express";
import { AddressInfo } from "net";

async function expressServer() {
  const app = express();
  let resolve: null | (() => void) = null;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });

  app.get("/", (_, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(
      "<!DOCTYPE html><html lang='en'><head><title>Test iframe</title><body></body></head></html>",
    );
  });

  const server = app.listen(0, () => {
    resolve?.();
  });

  await promise;

  return { app, server, port: (server.address() as AddressInfo).port };
}

const TEST_HOST_URL = "https://picklerick.com";

function createTestSetup(options: {
  iframe: { src: string };
  jsdom?: ConstructorOptions;
}) {
  const hostHtml = `
    <!doctype html>
    <html lang="en">
        <head>
            <title>Test Setup</title>
            <meta charset=utf-8>
        </head>
        <body>
            <iframe id="test-iframe" src="${options.iframe.src}"></iframe>
        </body>
    </html>`;

  const dom = new JSDOM(hostHtml, {
    resources: "usable",
    url: TEST_HOST_URL,
    virtualConsole: undefined,
    ...options?.jsdom,
  });
  const window = dom.window;
  const document = window.document;

  const iframe = document.getElementById("test-iframe") as HTMLIFrameElement;
  const iframeWindow = iframe.contentWindow as Window;
  const iframeDocument = iframeWindow.document;

  return {
    dom,
    window,
    document,
    iframe,
    iframeWindow,
    iframeDocument,
  };
}

// TODO create tests

describe("sendHostMessage", () => {
  let closeServer: () => Promise<void> = () => Promise.resolve();
  let port: number = 0;

  beforeAll(async () => {
    const { port: serverPort, server } = await expressServer();
    port = serverPort;

    closeServer = () => {
      let resolve: () => void = () => undefined;
      const promise = new Promise<void>((r) => (resolve = r));
      server.close(() => {
        resolve();
      });
      return promise;
    };
  });

  afterAll(async () => {
    await closeServer();
  });

  const hostMessage: HostMessage = {
    isCrossOriginHtmlEmbedMessage: true,
    source: "host",
    type: "set-body-content",
    data: "<h1>Squirrels are awesome</h1>",
  };

  testVariousThings<HostMessage, HostMessage>(
    hostMessage,
    hostMessage,
    sendHostMessage,
    isValidHostMessage,
    () => `http://localhost:${port}`,
  );
});

describe("sendSetHeadContentMessage", () => {
  testVariousThings<string, HostSetHeadContentMessage>(
    "<meta name='fun' content='rickandmorty'>",
    {
      isCrossOriginHtmlEmbedMessage: true,
      source: "host",
      type: "set-head-content",
      data: "<meta name='fun' content='rickandmorty'>",
    },
    sendSetHeadContentMessage,
    isValidHostMessage,
    () => "",
  );
});

describe("sendSetBodyContentMessage", () => {
  testVariousThings<string, HostSetHeadContentMessage>(
    "<h1>Hedgehogs are awesome</h1>",
    {
      isCrossOriginHtmlEmbedMessage: true,
      source: "host",
      type: "set-head-content",
      data: "<h1>Hedgehogs are awesome</h1>",
    },
    sendSetHeadContentMessage,
    isValidHostMessage,
    () => "",
  );
});

function testVariousThings<S, R extends Message>(
  dataToSend: S,
  expectedReceivedMessage: R,
  sendMethod: (
    iframeOrWindow: HTMLIFrameElement | Window,
    data: S,
    options?: SendHostMessageOptions,
  ) => void,
  isValidMessageCheck: (message: R) => boolean,
  getIframeSrc: () => string,
) {
  test("Correct targetOrigin auto resolved (iframe element)", () => {
    const { iframe, iframeWindow } = createTestSetup({
      iframe: { src: getIframeSrc() },
    });

    const iframeWindowSpy = jest.spyOn(iframeWindow, "postMessage");

    sendMethod(iframe, dataToSend);

    expect(iframeWindowSpy).toHaveBeenCalledWith(
      expectedReceivedMessage,
      getIframeSrc(),
    );
  });

  test("Correct targetOrigin auto resolved (window element)", () => {
    const { iframeWindow } = createTestSetup({
      iframe: { src: getIframeSrc() },
    });

    const iframeWindowSpy = jest.spyOn(iframeWindow, "postMessage");

    sendMethod(iframeWindow, dataToSend);

    expect(iframeWindowSpy).toHaveBeenCalledWith(
      expectedReceivedMessage,
      getIframeSrc(),
    );
  });

  test("Correct targetOrigins taken from options", () => {
    const { iframeWindow } = createTestSetup({
      iframe: { src: getIframeSrc() },
    });

    const iframeWindowSpy = jest.spyOn(iframeWindow, "postMessage");

    sendMethod(iframeWindow, dataToSend, {
      targetOrigins: ["*", "https://test.localhost:54321"],
    });

    expect(iframeWindowSpy).toHaveBeenCalledWith(expectedReceivedMessage, "*");
    expect(iframeWindowSpy).toHaveBeenCalledWith(
      expectedReceivedMessage,
      "https://test.localhost:54321",
    );
  });

  test("Send with iframe element", async () => {
    const { iframe, iframeWindow } = createTestSetup({
      iframe: { src: getIframeSrc() },
    });

    let receivedValidHostMessage = false;
    let receivedMessage: null | R = null;

    iframeWindow.addEventListener("message", (event) => {
      if (isValidMessageCheck(event.data)) {
        receivedValidHostMessage = true;
        receivedMessage = event.data as R;
      }
    });

    sendMethod(iframe, dataToSend, {
      targetOrigins: ["*", "https://test.localhost:54321"],
    });

    await new Promise((r) => setTimeout(r, 1));

    expect(receivedValidHostMessage).toBe(true);
    expect(receivedMessage).toStrictEqual(expectedReceivedMessage);
  });

  test("Send with window object", async () => {
    const { iframeWindow } = createTestSetup({
      iframe: { src: getIframeSrc() },
    });

    let receivedValidHostMessage = false;
    let receivedMessage: null | R = null;

    iframeWindow.addEventListener("message", (event) => {
      if (isValidMessageCheck(event.data)) {
        receivedValidHostMessage = true;
        receivedMessage = event.data as R;
      }
    });

    sendMethod(iframeWindow, dataToSend, {
      targetOrigins: ["*", "https://test.localhost:54321"],
    });

    await new Promise((r) => setTimeout(r, 1));

    expect(receivedValidHostMessage).toBe(true);
    expect(receivedMessage).toStrictEqual(expectedReceivedMessage);
  });

  test("Send with incorrect manual targetOrigin", async () => {
    const { iframe, iframeWindow } = createTestSetup({
      iframe: { src: getIframeSrc() },
    });

    let receivedValidHostMessage = false;

    iframeWindow.addEventListener("message", (event) => {
      if (isValidMessageCheck(event.data)) {
        receivedValidHostMessage = true;
      }
    });

    sendMethod(iframeWindow, dataToSend, {
      targetOrigins: ["*", "https://test.localhost:54321"],
    });

    await new Promise((r) => setTimeout(r, 50));

    expect(receivedValidHostMessage).toBe(true);
  });
}
