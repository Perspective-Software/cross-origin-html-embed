import "./style.css";
import {
  receiveIframeDimensionsUpdates,
  sendSetBodyContentMessage,
} from "@perspective-software/cross-origin-html-embed";

const textarea = document.querySelector(
  "textarea#custom-html",
) as HTMLTextAreaElement | null;

const iframe = document.querySelector(
  "iframe#custom-html-sandbox",
) as HTMLIFrameElement | null;

if (textarea && iframe) {
  iframe.onload = () => {
    receiveIframeDimensionsUpdates(iframe, ({ type, data }) => {
      if (type === "dimensions-update") {
        iframe.style.height = `${data.documentElementHeight}px`;
      } else if (type === "utm") {
        const separator = iframe.src.includes('?') ? '&' : '?';
        iframe.src = iframe.src + separator + data;
      }
    });

    textarea.addEventListener("change", () => {
      sendSetBodyContentMessage(iframe, textarea.value);
    });
  };

  iframe.src = "http://localhost:4042";
} else {
  console.warn("Could not find textarea and/or iframe.");
}
