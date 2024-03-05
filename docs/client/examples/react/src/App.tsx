import "./App.css";
import { useEffect, useRef, useState } from "react";
import {
  receiveIframeDimensionsUpdates,
  sendSetBodyContentMessage,
} from "@perspective-software/cross-origin-html-embed";

export default function App() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(0);
  const [customHtml, setCustomHtml] = useState<string>("");

  useEffect(() => {
    if (iframeRef.current) {
      return receiveIframeDimensionsUpdates(iframeRef.current, ({ data }) => {
        setIframeHeight(data.documentElementHeight);
      });
    }
  }, []);

  useEffect(() => {
    if (iframeRef.current && iframeLoaded) {
      sendSetBodyContentMessage(iframeRef.current, customHtml);
    }
  }, [customHtml, iframeLoaded]);

  return (
    <>
      <textarea
        id="custom-html"
        value={customHtml}
        onChange={(event) => {
          setCustomHtml(event.target.value);
        }}
      />

      <iframe
        id="custom-html-sandbox"
        src="http://localhost:4042"
        ref={iframeRef}
        onLoad={() => {
          setIframeLoaded(true);
        }}
        style={{ height: `${iframeHeight}px` }}
      />
    </>
  );
}
