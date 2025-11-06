import { isSenxorDevice, SerialTransportBase } from "@senxor/web-serial";
import type { CapacitorSerialPort } from "serial-adaptor-capacitor";
import { Senxor } from "@senxor/core";
import * as capacitorSerial from "serial-adaptor-capacitor";

/**
 * Manages discovery and connection of Senxor devices using the Capacitor Serial API.
 * Provides methods to list available devices, request device access, and listen for device connections.
 */
export class SenxorManagerCapacitorSerial {
  /**
   * Lists all available Senxor devices that are currently connected.
   * @returns Promise resolving to an array of Senxor device instances
   */
  async listDevices() {
    const ports = await capacitorSerial.listDevices();
    const senxorPorts = ports.filter((port) => isSenxorDevice(port.deviceInfo));
    const senxorTransports = senxorPorts.map(
      (port) => new SerialTransportBase<CapacitorSerialPort>(port)
    );
    const senxorDevices = senxorTransports.map(
      (transport) => new Senxor(transport)
    );
    return senxorDevices;
  }

  /**
   * Registers a listener for Senxor device connection events.
   * @param listener Callback function called when a Senxor device is connected
   * @returns Cleanup function to remove the event listener
   */
  async onDeviceConnect(
    listener: (device: Senxor<SerialTransportBase<CapacitorSerialPort>>) => void
  ) {
    const cleanup = capacitorSerial.onDeviceConnect((port) => {
      if (isSenxorDevice(port.deviceInfo)) {
        listener(
          new Senxor(new SerialTransportBase<CapacitorSerialPort>(port))
        );
      }
    });
    return cleanup;
  }
}
