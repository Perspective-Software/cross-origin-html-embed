import { HostMessage } from "./host";
import { IframeMessage } from "./iframe";

export type BaseMessage = {
  isCrossOriginHtmlEmbedMessage: true;
};

export type Message = IframeMessage | HostMessage;
