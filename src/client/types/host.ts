import { BaseMessage } from "./message";

export type HostSource = "host";

export type HostBaseMessage = BaseMessage & {
  source: HostSource;
};

export type HostSetHeadContentMessage = HostBaseMessage & {
  type: "set-head-content";
  data: string;
};

export type HostSetBodyContentMessage = HostBaseMessage & {
  type: "set-body-content";
  data: string;
};

export type HostMessage = HostSetHeadContentMessage | HostSetBodyContentMessage;
