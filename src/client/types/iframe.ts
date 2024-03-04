import { BaseMessage } from "./message";

export type IframeSource = "iframe";

export type IframeBaseMessage = BaseMessage & {
  source: IframeSource;
};

export type IframeDimensionsUpdateMessage = IframeBaseMessage & {
  type: "dimensions-update";
  data: {
    documentElementHeight: number;
  };
};

export type IframeMessage = IframeDimensionsUpdateMessage;
