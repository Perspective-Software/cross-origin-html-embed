import { afterAll, beforeAll } from "@jest/globals";
import express from "express";
import { AddressInfo } from "net";

export function beforeAllCreateTestServer(
  htmlToServe: string | (() => string),
) {
  const state = {
    port: 0,
  };

  let closeServer: () => Promise<void> = () => Promise.resolve();

  beforeAll(async () => {
    const { port, server } = await createServer(htmlToServe);
    state.port = port;

    closeServer = () => {
      let resolve: () => void = () => undefined;
      const promise = new Promise<void>((r) => (resolve = r));

      server.close(() => {
        resolve();
      });

      return promise;
    };
  });

  afterAll(async () => {
    await closeServer();
  });

  return state;
}

async function createServer(htmlToServe: string | (() => string)) {
  const app = express();
  let resolve: null | (() => void) = null;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });

  app.get("/", (_, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(typeof htmlToServe === "string" ? htmlToServe : htmlToServe());
  });

  const server = app.listen(0, () => {
    resolve?.();
  });

  await promise;

  return { app, server, port: (server.address() as AddressInfo).port };
}
