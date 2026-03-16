import type { SerialFilter, WebSerialPort } from "serial-adaptor-web";
import * as webSerial from "serial-adaptor-web";

import { consts, Senxor } from "@senxor/core";
import { isSenxorDevice, SerialTransportBase } from "@senxor/serial-core";

export async function listWebSerialSenxors() {
  const ports = await webSerial.listDevices();
  const senxorPorts = ports.filter((port) => isSenxorDevice(port.deviceInfo));
  const senxorTransports = senxorPorts.map(
    (port) => new SerialTransportBase<WebSerialPort>(port),
  );
  return senxorTransports.map((transport) => new Senxor(transport));
}

export async function requestWebSerialSenxor(): Promise<
  Senxor<SerialTransportBase<WebSerialPort>> | null
> {
  const filters: SerialFilter[] = Object.keys(consts.SENXOR_PRODUCT_ID).map(
    (pid) => ({
      vendorId: consts.SENXOR_VENDOR_ID,
      productId: parseInt(pid, 10),
    }),
  );
  const port = await webSerial.requestDevice(filters);
  if (!port) {
    return null;
  }

  if (!isSenxorDevice(port.deviceInfo)) {
    throw new Error("Selected device is not a Senxor device");
  }

  const transport = new SerialTransportBase<WebSerialPort>(port);
  return new Senxor(transport);
}

export function onWebSerialSenxorConnect(
  listener: (device: Senxor<SerialTransportBase<WebSerialPort>>) => void,
): () => void {
  return webSerial.onDeviceConnect((port) => {
    if (isSenxorDevice(port.deviceInfo)) {
      listener(new Senxor(new SerialTransportBase<WebSerialPort>(port)));
    }
  });
}
