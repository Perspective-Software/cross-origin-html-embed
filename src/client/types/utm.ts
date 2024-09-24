import { IframeBaseMessage } from "./iframe";

export type IframeUtmParamsUpdateMessage = IframeBaseMessage & {
  type: "utm";
  data: string; // eg: utm_source=platform&utm_medium=foo&utm_campaign=bar
};

export type UtmMessage = IframeUtmParamsUpdateMessage;
