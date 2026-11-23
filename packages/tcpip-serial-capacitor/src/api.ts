import { Senxor } from "@senxor/core";
import { ByteTransport } from "@senxor/serial-core";

import { TcpCapacitorSocketPort } from "./tcp-capacitor-socket-port";

export function createTcpIpSerialSenxor(
  host: string,
  port: number,
): Senxor<ByteTransport<TcpCapacitorSocketPort>> {
  const socketPort = new TcpCapacitorSocketPort(host, port);
  const transport = new ByteTransport(socketPort);
  return new Senxor(transport);
}
