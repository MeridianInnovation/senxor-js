import { Senxor } from "@senxor/core";
import { ByteTransport } from "@senxor/serial-core";

import { WebsocketPort } from "./websocket-port";

export function createWebsocketSerialSenxor(
  host: string,
  port?: number,
  path?: string,
  secure?: boolean,
): Senxor<ByteTransport<WebsocketPort>> {
  const websocketPort = new WebsocketPort(host, port, path, secure);
  const transport = new ByteTransport(websocketPort);
  return new Senxor(transport);
}
