import { Senxor } from "@senxor/core";
import { SerialTransportBase } from "@senxor/serial-core";

import { WebsocketPort } from "./websocket-port";

export function createWebsocketSerialSenxor(
  host: string,
  port?: number,
  path?: string,
  secure?: boolean,
): Senxor<SerialTransportBase<WebsocketPort>> {
  const websocketPort = new WebsocketPort(host, port, path, secure);
  const transport = new SerialTransportBase(websocketPort);
  return new Senxor(transport);
}
