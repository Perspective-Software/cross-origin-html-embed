import { GenerateIframeHtmlOptions } from "./types";
import { LogoAsciiArt } from "./constants";

/**
 * Lets you generate the HTML that can be served for an iframe for your cross-origin "sandbox".
 *
 * This HTML allows the host to set body and head contents via "postMessage".
 * This allows you to serve this HTML on a remote/cross-origin.
 * This fact effectively turns such an iframe into a Sandbox. The only way for
 * the host and iframe to communicate with each other is "postMessage".
 *
 * You can use that mechanism to embed user provided HTML securely. The user provided
 * HTML can "run" inside the scope of a totally different origin (cross-origin). Hence,
 * the HTML/Code can not access any data of your website/app or intercept any
 * network traffic (e.g. with service workers).
 *
 * @param options Let's you control the output to some degree.
 */
export const generateIframeHtml = /* #__PURE__ */ function (
  options: GenerateIframeHtmlOptions,
) {
  const whitelistedOrigins = options.allowAllOrigins
    ? ["*"]
    : options.originWhitelist;

  for (const origin of whitelistedOrigins) {
    if (origin === "*") continue;
    try {
      new URL(origin);
    } catch (e) {
      throw new Error(`Got invalid origin entry: ${origin} – ${e}`);
    }
  }

  // The array is inlined so that no custom code can tweak for an example a global array.
  const stringifiedWhitelistedOrigins = JSON.stringify(whitelistedOrigins);

  // Other notes:
  // - The script content is wrapped in another function to not create global
  //   functions that could be altered by custom code.

  return `<!DOCTYPE html>
<html lang="en">
    <head>
        <title>Cross-Origin HTML Embed${options.name ? " " + options.name : ""}: Active</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta charset="UTF-8">
        ${options.favicon ? `<link rel="icon" type="${options.favicon.type}" href="${options.favicon.href}" />` : ""}
        ${options.canonicalUrl ? `<link rel="canonical" href="${options.canonicalUrl.href}" />` : ""}
        ${options.extendHead ? options.extendHead : ""}
    </head>
    
    <body>
        <script>
            (function() {
              ${!options.hideBranding ? `console.log("%c\\n${LogoAsciiArt}\\n\\n", "font-family: monospace;");` : ""}
              
              function sendDimensionsUpdate() {
                  if ( window === window.parent ) {
                      return
                  }
                  
                  for ( const origin of ${stringifiedWhitelistedOrigins} ) {
                      window.parent.postMessage({
                          isCrossOriginHtmlEmbedMessage: true,
                          source: "iframe",
                          type: "dimensions-update",
                          data: {
                              documentElementHeight: document.documentElement.getBoundingClientRect().height
                          }
                      }, origin);
                  }
              }
              
              // Initial size update
              sendDimensionsUpdate();
              
              // Send size updates on resizes
              window.addEventListener('resize', sendDimensionsUpdate);
              new ResizeObserver(sendDimensionsUpdate).observe(document.documentElement);
              
              // We need to remember head and body notes that were already there
              // to prevent them from being removed too on set-{head|body}-content messages.
              const ownHeadChildNodes = Array.from(document.head.childNodes);
              const ownBodyChildNodes = Array.from(document.body.childNodes);
              
              function cleanupNode(targetNode, ownChildNodes) {
                  const targetNodeChildNodes = Array.from(targetNode.childNodes);
    
                  for ( const targetNodeChildNode of targetNodeChildNodes ) {
                      if ( !ownChildNodes.includes(targetNodeChildNode) ) {
                          targetNodeChildNode.remove();
                      }
                  }
              }
    
              function injectHtml(html, targetNode) {
                  const helper = document.createElement("div");
                  helper.innerHTML = html;
    
                  // We need to replace all script nodes in order for the browser to execute them.
                  // script tags being placed in the DOM by setting innerHTML won't be executed.
                  // script tags that are created with createElement and that are attached with
                  // appendChild on the other hand are executed by the browser.
                  const originalScriptNodes = helper.querySelectorAll("script");
    
                  for ( const originalScriptNode of originalScriptNodes ) {
                      const replacementScriptNode = document.createElement("script");
    
                      for ( const attribute of originalScriptNode.attributes ) {
                          replacementScriptNode.setAttribute(attribute.name, attribute.value);
                      }
    
                      replacementScriptNode.text = originalScriptNode.innerHTML;
    
                      originalScriptNode.parentNode.replaceChild(replacementScriptNode, originalScriptNode);
                  }
    
                  for ( const childNode of helper.childNodes ) {
                     targetNode.appendChild(childNode);   
                  }
              }
    
              function setHeadConent(content) {
                  cleanupNode(document.head, ownHeadChildNodes);
                  injectHtml(content, document.head);
              }
    
              function setBodyContent(content) {
                  cleanupNode(document.body, ownBodyChildNodes);
                  injectHtml(content, document.body);
              }
              
              window.addEventListener('message', function(event) {
                  if ( ${stringifiedWhitelistedOrigins}.includes("*") || ${stringifiedWhitelistedOrigins}.includes(event.origin) ) {
                      const message = event.data;
                      if ( message && message.isCrossOriginHtmlEmbedMessage && message.source === "host" ) {
                          if ( message.type === "set-body-content" ) {
                              setBodyContent(message.data);
                          } else if ( message.type === "set-head-content" ) {
                              setHeadConent(message.data);
                          }
                      }   
                  }
              });
            })();
        </script>
        
        ${options.extendBody ? options.extendBody : ""}
    </body>
</html>
`;
};
