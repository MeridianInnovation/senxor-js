import { Senxor } from "@senxor/core";
import { SerialTransportBase } from "@senxor/serial-core";

import { TcpCapacitorSocketPort } from "./tcp-capacitor-socket-port";

export function createTcpIpSerialSenxor(
  host: string,
  port: number,
): Senxor<SerialTransportBase<TcpCapacitorSocketPort>> {
  const socketPort = new TcpCapacitorSocketPort(host, port);
  const transport = new SerialTransportBase(socketPort);
  return new Senxor(transport);
}
