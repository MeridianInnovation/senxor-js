import { Senxor } from "@senxor/core";
import { ByteTransport } from "@senxor/serial-core";

import { TcpSocketPort } from "./tcp-socket-port";

export function createTcpIpSerialSenxor(
  host: string,
  port: number,
): Senxor<ByteTransport<TcpSocketPort>> {
  const socketPort = new TcpSocketPort(host, port);
  const transport = new ByteTransport(socketPort);
  return new Senxor(transport);
}
