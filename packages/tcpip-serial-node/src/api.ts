import { Senxor } from "@senxor/core";
import { SerialTransportBase } from "@senxor/serial-core";

import { TcpSocketPort } from "./tcp-socket-port";

export function createTcpIpSerialSenxor(
  host: string,
  port: number,
): Senxor<SerialTransportBase<TcpSocketPort>> {
  const socketPort = new TcpSocketPort(host, port);
  const transport = new SerialTransportBase(socketPort);
  return new Senxor(transport);
}
