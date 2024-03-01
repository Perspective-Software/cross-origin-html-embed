<p align="center">
    <br>
    <br>
    <img src="assets/server-sdk-logo.png" width="100" height="100">
    <br>
    <br>
</p>

<p align="center">
  <img alt="JavaScript | TypeScript" src="https://img.shields.io/badge/JavaScript-TypeScript-blue">
  <a href="https://www.npmjs.com/package/@perspective-software/cross-origin-html-embed-server-sdk">
    <img alt="npm" src="https://img.shields.io/npm/v/@perspective-software/cross-origin-html-embed-server-sdk?color=%23e62770&label=NPM">
  </a>
  <br>
  <br>
</p>

# Cross-Origin HTML Embed Server SDK

This SDK helps you to build your own cross-origin iframe sandboxes. This SDK is very small.

# Table of contents

<!-- TOC -->
* [Cross-Origin HTML Embed Server SDK](#cross-origin-html-embed-server-sdk)
* [Table of contents](#table-of-contents)
* [Installation](#installation)
* [Usage](#usage)
  * [General](#general)
  * [All Options](#all-options)
* [Examples](#examples)
  * [Folder](#folder)
  * [Express](#express)
  * [Next.js App Router](#nextjs-app-router)
  * [Other backend frameworks](#other-backend-frameworks)
* [Development](#development)
  * [Setup](#setup)
  * [Running tests](#running-tests)
  * [Build](#build)
  * [Lint](#lint)
  * [Publish](#publish)
<!-- TOC -->

# Installation

Run:

```bash
npm add @perspective-software/cross-origin-html-embed-server-sdk
```

To get the lastest version, run:

```bash
npm add @perspective-software/cross-origin-html-embed-server-sdk@latest
```

# Usage

## General

To allow only specific origins:

```typescript
import { generateIframeHtml } from "@perspective-software/cross-origin-html-embed-server-sdk";

const iframeHtml = generateIframeHtml({
  allowAllOrigins: false,
  originWhitelist: ["https://app.myservice.com"],
});
```

To allow all origins:

```typescript
import { generateIframeHtml } from "@perspective-software/cross-origin-html-embed-server-sdk";

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

We have also prepared some example under [examples/ 🔗](examples/).

Clone the repository and check them out.

## Express

There is also an example available: [Express Example 🔗](examples/express).

```typescript
import { generateIframeHtml } from "@perspective-software/cross-origin-html-embed-server-sdk";
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

There is also an example available: [Next.js App Router Example 🔗](examples/nextjs-app-router).

```typescript
// app/route.ts

import { generateIframeHtml } from "@perspective-software/cross-origin-html-embed-server-sdk";

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

# Development

Only for developers of the organization `Perspective-Software`.

## Setup

```bash
nvm use
node install
```

## Running tests

```bash
npm run test
```

With coverage:

```bash
npm run test:cov
```

## Build

```bash
npm run build
```

## Lint

```bash
npm run lint:fix
```

To just check the code:

```bash
npm run lint:check
```

## Publish

- Increment `package.json` version.
- Create a `CHANGELOG` entry.
- Publish to npm.

```bash
npm publish
```

_(Runs tests, eslint and prettier before the actual publish step.)_
