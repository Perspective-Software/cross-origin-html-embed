import { generateIframeHtml } from "@perspective-software/cross-origin-html-embed";

export const dynamic = "force-dynamic"; // defaults to auto

export async function GET() {
  // 🛡️ Here happens the magic
  const iframeHtml = generateIframeHtml({
    allowAllOrigins: false,
    originWhitelist: ["http://localhost:5173"],
    name: "Next.js App Router Example",
  });

  const response = new Response(iframeHtml);
  response.headers.set("Content-Type", "text/html");
  return response;
}
