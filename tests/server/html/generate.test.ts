import { describe, test, expect } from "@jest/globals";
import { generateIframeHtml } from "../../../src";
import { ConstructorOptions, JSDOM } from "jsdom";
import { GenerateIframeHtmlOptions } from "../../../src";
import { pause } from "../../../test-utils/pause";

const TEST_URL = new URL("https://subdomain.morty.com");
const TEST_NAME = "Pickle Rick";
const TEST_ORIGIN_WHITELIST = [
  "https://project.rick.com",
  "http://my_test.localhost:1234",
];

function createTestHtml(overrideOptions?: Partial<GenerateIframeHtmlOptions>) {
  return generateIframeHtml({
    canonicalUrl: TEST_URL,
    name: TEST_NAME,
    allowAllOrigins: false,
    originWhitelist: TEST_ORIGIN_WHITELIST,
    ...overrideOptions,
  });
}

function createTestHtmlAndReturnContext(
  overrideOptions?: Partial<GenerateIframeHtmlOptions>,
  jsdomOptions?: Partial<ConstructorOptions>,
) {
  const dom = new JSDOM(createTestHtml(overrideOptions), jsdomOptions);
  return { dom, window: dom.window, document: dom.window.document };
}

function getChildNodesWithoutTextNodes(element: HTMLElement) {
  return Array.from(element.children).filter((child) => child.nodeType !== 3);
}

describe("generateIframeHtml static tests", () => {
  test("Starts with doctype", () => {
    const html = createTestHtml();
    expect(html.startsWith("<!DOCTYPE html>"));
  });

  test("Has head node", () => {
    const { document } = createTestHtmlAndReturnContext();
    expect(document.head).toBeTruthy();
  });

  test("Head has title tag", () => {
    const { document } = createTestHtmlAndReturnContext();
    expect(document.head.querySelector("title")).toBeTruthy();
  });

  test("Head has viewport meta tag", () => {
    const { document } = createTestHtmlAndReturnContext();
    const viewportMetaNode = document.head.querySelector(
      "meta[name='viewport']",
    );

    expect(viewportMetaNode).toBeTruthy();
    expect(viewportMetaNode?.getAttribute("content")).toBe(
      "width=device-width, initial-scale=1.0",
    );
  });

  test("Head has utf-8 charset meta tag", () => {
    const { document } = createTestHtmlAndReturnContext();
    const viewportMetaNode = document.head.querySelector(
      "meta[charset='UTF-8']",
    );

    expect(viewportMetaNode).toBeTruthy();
  });

  test("Head has no favicon tag by default", () => {
    const { document } = createTestHtmlAndReturnContext();
    const faviconNode = document.head.querySelector("link[rel='icon']");

    expect(faviconNode).toBeFalsy();
  });

  test("Head has favicon tag if configured", () => {
    const { document } = createTestHtmlAndReturnContext({
      favicon: {
        href: "/my-favicon.png",
        type: "image/png",
      },
    });
    const faviconNode = document.head.querySelector("link[rel='icon']");

    expect(faviconNode).toBeTruthy();
    expect(faviconNode?.getAttribute("type")).toBe("image/png");
    expect(faviconNode?.getAttribute("href")).toBe("/my-favicon.png");
  });

  test("Head has canonical url tag", () => {
    const { document } = createTestHtmlAndReturnContext();
    const canonicalNode = document.head.querySelector("link[rel='canonical']");

    expect(canonicalNode).toBeTruthy();
    expect(canonicalNode?.getAttribute("href")).toBe(TEST_URL.href);
  });

  test("Has body node", () => {
    const { document } = createTestHtmlAndReturnContext();
    expect(document.body).toBeDefined();
  });

  test("Body node only contains our script node", () => {
    const { document } = createTestHtmlAndReturnContext();
    const bodyChildren = getChildNodesWithoutTextNodes(document.body);

    expect(bodyChildren.length).toBe(1);
    expect(bodyChildren[0].tagName).toBe("SCRIPT");
  });

  test("Branding logging", () => {
    const html = createTestHtml({ hideBranding: false });
    expect(html).toContain(`console.log("%c`);
  });

  test("Branding hidden", () => {
    const html = createTestHtml({ hideBranding: true });
    expect(html).not.toContain(`console.log("%c`);
  });

  test("Empty origin whitelist", () => {
    const html = createTestHtml({ originWhitelist: [] });
    expect(html).toContain("for ( const origin of [] )");
    expect(html).toContain("[].includes(event.origin)");
    expect(html).toContain(`[].includes("*")`);
  });

  test("Origin whitelist one entry", () => {
    const html = createTestHtml({ originWhitelist: ["https://abc.def.com"] });
    expect(html).toContain(`for ( const origin of ["https://abc.def.com"] )`);
    expect(html).toContain(`["https://abc.def.com"].includes(event.origin)`);
    expect(html).toContain(`["https://abc.def.com"].includes("*")`);
  });

  test("Origin whitelist multiple entries", () => {
    const html = createTestHtml();
    expect(html).toContain(
      `for ( const origin of ${JSON.stringify(TEST_ORIGIN_WHITELIST)} )`,
    );
    expect(html).toContain(
      `${JSON.stringify(TEST_ORIGIN_WHITELIST)}.includes(event.origin)`,
    );
    expect(html).toContain(
      `${JSON.stringify(TEST_ORIGIN_WHITELIST)}.includes("*")`,
    );
  });

  test("Origin whitelist asterisk entry", () => {
    const html = createTestHtml({
      originWhitelist: ["https://abc.def.com", "*"],
    });
    expect(html).toContain(
      `for ( const origin of ["https://abc.def.com","*"] )`,
    );
    expect(html).toContain(
      `["https://abc.def.com","*"].includes(event.origin)`,
    );
    expect(html).toContain(`["https://abc.def.com","*"].includes("*")`);
  });

  test("allowAllOrigins mode", () => {
    const html = generateIframeHtml({
      name: TEST_NAME,
      canonicalUrl: TEST_URL,
      allowAllOrigins: true,
    });

    expect(html).toContain(`for ( const origin of ["*"] )`);
    expect(html).toContain(`["*"].includes(event.origin)`);
    expect(html).toContain(`["*"].includes("*")`);
  });

  test("Invalid origin whitelist entry", () => {
    expect(() => {
      createTestHtml({
        originWhitelist: ["https://google.de", "invalidOrigin"],
      });
    }).toThrow();
  });

  test("Title is correct", () => {
    const { document } = createTestHtmlAndReturnContext();
    const titleNode = document.head.querySelector("title");
    expect(titleNode?.innerHTML).toBe(
      `Cross-Origin HTML Embed ${TEST_NAME}: Active`,
    );
  });

  test("No name set for title", () => {
    const { document } = createTestHtmlAndReturnContext({ name: undefined });
    const titleNode = document.head.querySelector("title");
    expect(titleNode?.innerHTML).toBe(`Cross-Origin HTML Embed: Active`);
  });

  test("No canonical URL set", () => {
    const { document } = createTestHtmlAndReturnContext({
      canonicalUrl: undefined,
    });
    const canonicalNode = document.head.querySelector("link[rel='canonical']");
    expect(canonicalNode).toBeFalsy();
  });

  test("Extending head HTML works", () => {
    const { document } = createTestHtmlAndReturnContext({
      extendHead: `<meta name="head-extend" content="success">`,
    });

    const headExtendMetaTag = document.head.querySelector(
      "meta[name='head-extend']",
    );

    expect(headExtendMetaTag).toBeTruthy();
  });

  test("Extending body HTML works", () => {
    const { document } = createTestHtmlAndReturnContext({
      extendBody: `<div id="body-extend">I extended the body HTML statically.</div>`,
    });

    const bodyExtendTag = document.body.querySelector("div#body-extend");

    expect(bodyExtendTag).toBeTruthy();
    expect(bodyExtendTag?.innerHTML).toBe(
      "I extended the body HTML statically.",
    );
  });

  test("Extending head and body HTML works", () => {
    const { document } = createTestHtmlAndReturnContext({
      extendHead: `<meta name="head-extend" content="success">`,
      extendBody: `<div id="body-extend">I extended the body HTML statically.</div>`,
    });

    const headExtendMetaTag = document.head.querySelector(
      "meta[name='head-extend']",
    );

    expect(headExtendMetaTag).toBeTruthy();

    const bodyExtendTag = document.body.querySelector("div#body-extend");

    expect(bodyExtendTag).toBeTruthy();
    expect(bodyExtendTag?.innerHTML).toBe(
      "I extended the body HTML statically.",
    );
  });

  test("Script injected by extending HTML is executed", async () => {
    const { window } = createTestHtmlAndReturnContext(
      {
        extendHead: `<script>window.HEAD_EXTENDED = "yes";</script>`,
        extendBody: `<script>window.BODY_EXTENDED = "absolutely";</script>`,
      },
      {
        runScripts: "dangerously",
      },
    );

    await pause(20);

    expect(window["HEAD_EXTENDED"]).toBe("yes");
    expect(window["BODY_EXTENDED"]).toBe("absolutely");
  });
});

describe("postMessage communication", () => {
  function createTestSetup(options?: {
    iframeHtmlOptions?: Partial<GenerateIframeHtmlOptions>;
    jsdomOptions?: Partial<ConstructorOptions>;
    beforeIframeCreationCallback?: (params: {
      hostDom: JSDOM;
      hostDocument: Document;
    }) => void;
  }) {
    const iframeHtml = createTestHtml(options?.iframeHtmlOptions);

    const hostDom = new JSDOM(
      '<html><body><iframe id="test-frame"></iframe></body></html>',
      { runScripts: "dangerously", ...options?.jsdomOptions },
    );

    const hostDocument = hostDom.window.document;

    options?.beforeIframeCreationCallback?.({ hostDom, hostDocument });

    const hostIframe: HTMLIFrameElement = hostDocument.getElementById(
      "test-frame",
    ) as HTMLIFrameElement;

    (
      hostIframe.contentWindow as unknown as Record<string, unknown>
    ).ResizeObserver = class ResizeObserver {
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

    const iframeDocument: Document =
      hostIframe.contentDocument ||
      (hostIframe.contentWindow?.document as Document);

    iframeDocument.open();
    iframeDocument.write(iframeHtml);
    iframeDocument.close();

    return { iframeHtml, hostDom, hostDocument, hostIframe, iframeDocument };
  }

  test("dimensions update sent to host", async () => {
    let gotDimensionsUpdate = false;
    let resolve: (() => void) | null = null;

    const {} = createTestSetup({
      iframeHtmlOptions: { originWhitelist: ["*"] },
      beforeIframeCreationCallback: ({ hostDom }) => {
        hostDom.window.addEventListener("message", (event) => {
          const message = event.data;
          if (
            message.isCrossOriginHtmlEmbedMessage === true &&
            message.source === "iframe" &&
            message.type === "dimensions-update" &&
            typeof message?.data?.documentElementHeight === "number"
          ) {
            gotDimensionsUpdate = true;
            resolve?.();
          }
        });
      },
    });

    await new Promise<void>((r) => {
      resolve = r;
      setTimeout(r, 200);
    });

    expect(gotDimensionsUpdate).toBe(true);
  });

  test("dimensions update not sent to/reeived by unknown host", async () => {
    let gotDimensionsUpdate = false;
    let resolve: (() => void) | null = null;

    const {} = createTestSetup({
      iframeHtmlOptions: { originWhitelist: ["https://bing.com"] },
      jsdomOptions: { url: "https://google.com" },
      beforeIframeCreationCallback: ({ hostDom }) => {
        hostDom.window.addEventListener("message", (event) => {
          const message = event.data;
          if (
            message.isCrossOriginHtmlEmbedMessage === true &&
            message.source === "iframe" &&
            message.type === "dimensions-update" &&
            typeof message?.data?.documentElementHeight === "number"
          ) {
            gotDimensionsUpdate = true;
            resolve?.();
          }
        });
      },
    });

    await new Promise<void>((r) => {
      resolve = r;
      setTimeout(r, 200);
    });

    expect(gotDimensionsUpdate).toBe(false);
  });

  test("sent body content is added to body", async () => {
    const { hostIframe, iframeDocument } = createTestSetup({
      iframeHtmlOptions: { originWhitelist: ["*"] },
    });

    hostIframe.contentWindow?.postMessage(
      {
        isCrossOriginHtmlEmbedMessage: true,
        source: "host",
        type: "set-body-content",
        data: "<h1>Hello World</h1>",
      },
      "*",
    );

    await pause(1);

    const heading = iframeDocument.body.querySelector("h1");
    expect(heading).toBeTruthy();
    expect(heading?.innerHTML).toBe("Hello World");
  });

  test("sent head content is added to head", async () => {
    const { hostIframe, iframeDocument } = createTestSetup({
      iframeHtmlOptions: { originWhitelist: ["*"] },
    });

    hostIframe.contentWindow?.postMessage(
      {
        isCrossOriginHtmlEmbedMessage: true,
        source: "host",
        type: "set-head-content",
        data: `<meta name="test" content="success">`,
      },
      "*",
    );

    await pause(1);

    const metaNode = iframeDocument.head.querySelector("meta[name='test']");
    expect(metaNode).toBeTruthy();
    expect(metaNode?.getAttribute("content")).toBe("success");
  });

  test("set-head-content ignored for unknown origin", async () => {
    const { hostIframe, iframeDocument } = createTestSetup({
      iframeHtmlOptions: { originWhitelist: ["https://bing.com"] },
      jsdomOptions: {
        url: "https://google.com",
      },
    });

    hostIframe.contentWindow?.postMessage(
      {
        isCrossOriginHtmlEmbedMessage: true,
        source: "host",
        type: "set-body-content",
        data: "<h1>Hello World</h1>",
      },
      "*",
    );

    await pause(1);

    const heading = iframeDocument.body.querySelector("h1");
    expect(heading).toBeFalsy();
    expect(iframeDocument.body.innerHTML).not.toContain("Hello World");
  });

  test("set-body-content ignored for unknown origin", async () => {
    const { hostIframe, iframeDocument } = createTestSetup({
      iframeHtmlOptions: { originWhitelist: ["https://bing.com"] },
      jsdomOptions: {
        url: "https://google.com",
      },
    });

    hostIframe.contentWindow?.postMessage(
      {
        isCrossOriginHtmlEmbedMessage: true,
        source: "host",
        type: "set-head-content",
        data: `<meta name="test" content="failure">`,
      },
      "*",
    );

    await pause(1);

    const metaNode = iframeDocument.head.querySelector("meta[name='test']");
    expect(metaNode).toBeFalsy();
  });
});
