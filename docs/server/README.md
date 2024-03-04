# Server Functions

This part of the library helps you to generate your own "sandbox"
HTML (files) and serve them.

# Table of contents

<!-- TOC -->
* [Server Functions](#server-functions)
* [Table of contents](#table-of-contents)
* [Usage](#usage)
  * [General](#general)
  * [All Options](#all-options)
* [Examples](#examples)
  * [Folder](#folder)
  * [Express](#express)
  * [Next.js App Router](#nextjs-app-router)
  * [Other backend frameworks](#other-backend-frameworks)
<!-- TOC -->

# Usage

## General

To allow only specific origins:

```typescript
import { generateIframeHtml } from "@perspective-software/cross-origin-html-embed/server";

const iframeHtml = generateIframeHtml({
  allowAllOrigins: false,
  originWhitelist: ["https://app.myservice.com"],
});
```

To allow all origins:

```typescript
import { generateIframeHtml } from "@perspective-software/cross-origin-html-embed/server";

const iframeHtml = generateIframeHtml({
  allowAllOrigins: true,
});
```

## All Options

| Option            | Required                       | Description                                                                                                |
| ----------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `allowAllOrigins` | yes                            | If `true`, receiving and sending messages from/to all origins via asterisk `*` is activated.               |
| `originWhitelist` | (depends on `allowAllOrigins`) | A specific list of origins to receive messages from and sent messages to.                                  |
| `name`            |                                | Will be added to the head title element.                                                                   |
| `canoncialUrl`    |                                | If set, the `rel="canonical"` link tag will be added to the head.                                          |
| `favicon`         |                                | If set, this objects describes `href` and `type` for a link tag with `rel="icon"` to be added to the head. |
| `hideBranding`    |                                | If `true`, the iframe will not print the logo to the console.                                              |

# Examples

## Folder

We have also prepared some example under [examples/ 🔗](./examples/).

Clone the repository and check them out.

## Express

There is also an example available: [Express Example 🔗](./examples/express).

```typescript
import { generateIframeHtml } from "@perspective-software/cross-origin-html-embed/server";
import express from "express";

const PORT = process.env.PORT || 4042;
const app = express();

app.get("/", (_, res) => {
  // 🛡️ Here happens the magic
  const iframeHtml = generateIframeHtml({
    allowAllOrigins: false,
    originWhitelist: ["https://app.myservice.com"],
  });

  res.send(iframeHtml);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
```

## Next.js App Router

There is also an example available: [Next.js App Router Example 🔗](./examples/nextjs-app-router).

```typescript
// app/route.ts

import { generateIframeHtml } from "@perspective-software/cross-origin-html-embed/server";

export const dynamic = "force-dynamic"; // defaults to auto

export async function GET() {
  // 🛡️ Here happens the magic
  const iframeHtml = generateIframeHtml({
    allowAllOrigins: false,
    originWhitelist: ["https://app.myservice.com"],
    name: "Next.js App Router Example",
  });

  const response = new Response(iframeHtml);
  response.headers.set("Content-Type", "text/html");
  return response;
}
```

## Other backend frameworks

Basically, you just need to

- create an API endpoint/route handler
- and return the HTML with the correct HTML mime-type.

That's it.
