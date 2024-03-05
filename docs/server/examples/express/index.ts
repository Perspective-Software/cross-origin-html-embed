import { generateIframeHtml } from "@perspective-software/cross-origin-html-embed";
import express from "express";

const PORT = process.env.PORT || 4042;
const app = express();

app.get("/", (_, res) => {
  // 🛡️ Here happens the magic
  const iframeHtml = generateIframeHtml({
    allowAllOrigins: false,
    originWhitelist: ["http://localhost:5173"],
  });

  res.send(iframeHtml);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
