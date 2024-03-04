import { ConstructorOptions, JSDOM } from "jsdom";

export function createDomWithIframe(options: {
  iframe: { src: string };
  jsdom?: ConstructorOptions;
  host?: {
    rewriteMessageEventOriginsIfMissing: boolean;
  };
}) {
  const hostHtml = `
    <!doctype html>
    <html lang="en">
        <head>
            <title>Receive test</title>
            <meta charset=utf-8>
        </head>
        <body>
            <iframe id="test-iframe" src="${options.iframe.src}"></iframe>
        </body>
    </html>`;

  const dom = new JSDOM(hostHtml, {
    ...options?.jsdom,
  });

  const hostWindow = dom.window;
  const document = hostWindow.document;

  const iframe = document.getElementById("test-iframe") as HTMLIFrameElement;
  const iframeWindow = iframe.contentWindow as Window;
  const iframeDocument = iframeWindow.document;

  let resolve: () => void = () => undefined;
  const iframeOnLoadPromise = new Promise<void>((r) => {
    resolve = r;
  });
  iframe.onload = resolve;

  if (options.host?.rewriteMessageEventOriginsIfMissing) {
    hostWindow.addEventListener("message", (event) => {
      if (event.origin === "") {
        event.stopImmediatePropagation();

        // @ts-ignore
        const eventWithOrigin: MessageEvent = new event.constructor("message", {
          data: event.data,
          origin: iframeWindow.location.origin,
        });

        hostWindow.dispatchEvent(eventWithOrigin);
      }
    });
  }

  return {
    dom,
    hostWindow,
    document,
    iframe,
    iframeWindow,
    iframeDocument,
    iframeOnLoadPromise,
  };
}
