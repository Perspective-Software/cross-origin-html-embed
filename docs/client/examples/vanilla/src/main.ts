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
    receiveIframeDimensionsUpdates(iframe, (message) => {
      iframe.style.height = `${message.data.documentElementHeight}px`;
    });

    textarea.addEventListener("change", () => {
      sendSetBodyContentMessage(iframe, textarea.value);
    });
  };

  iframe.src = "http://localhost:4042";
} else {
  console.warn("Could not find textarea and/or iframe.");
}
