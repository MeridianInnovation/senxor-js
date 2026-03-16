import { Senxor } from "@senxor/core";
import { isSenxorDevice, SerialTransportBase } from "@senxor/serial-core";
import type { CapacitorSerialPort } from "serial-adaptor-capacitor";
import * as capacitorSerial from "serial-adaptor-capacitor";

export async function listCapacitorSerialSenxors(): Promise<
  Senxor<SerialTransportBase<CapacitorSerialPort>>[]
> {
  const ports = await capacitorSerial.listDevices();
  const senxorPorts = ports.filter((port) => isSenxorDevice(port.deviceInfo));
  const senxorTransports = senxorPorts.map(
    (port) => new SerialTransportBase<CapacitorSerialPort>(port),
  );
  return senxorTransports.map((transport) => new Senxor(transport));
}

export function onCapacitorSerialSenxorConnect(
  listener: (device: Senxor<SerialTransportBase<CapacitorSerialPort>>) => void,
): () => void {
  return capacitorSerial.onDeviceConnect((port) => {
    if (isSenxorDevice(port.deviceInfo)) {
      listener(new Senxor(new SerialTransportBase<CapacitorSerialPort>(port)));
    }
  });
}
