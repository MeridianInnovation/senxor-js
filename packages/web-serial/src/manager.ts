import * as webSerial from "serial-adaptor-web";
import type { SerialFilter, WebSerialPort } from "serial-adaptor-web";

import { SerialTransportBase } from "./transports";
import { isSenxorDevice } from "./utils";
import { consts, Senxor } from "@senxor/core";

/**
 * Manages discovery and connection of Senxor devices using the Web Serial API.
 * Provides methods to list available devices, request device access, and listen for device connections.
 */
export class SenxorManagerWebSerial {
  /**
   * Lists all available Senxor devices that are currently connected.
   * @returns Promise resolving to an array of Senxor device instances
   */
  async listDevices() {
    const ports = await webSerial.listDevices();
    const senxorPorts = ports.filter((port) => isSenxorDevice(port.deviceInfo));
    const senxorTransports = senxorPorts.map(
      (port) => new SerialTransportBase<WebSerialPort>(port)
    );
    const senxorDevices = senxorTransports.map(
      (transport) => new Senxor(transport)
    );
    return senxorDevices;
  }

  /**
   * Requests user permission to access a Senxor device through a browser dialog.
   * @returns Promise resolving to a Senxor device instance if granted, null if cancelled.
   */
  async requestDevice() {
    const filters: SerialFilter[] = Object.keys(consts.SENXOR_PRODUCT_ID).map(
      (pid) => ({
        vendorId: consts.SENXOR_VENDOR_ID,
        productId: parseInt(pid, 10),
      })
    );
    const port = await webSerial.requestDevice(filters);
    if (!port) {
      return null;
    }

    if (!isSenxorDevice(port.deviceInfo)) {
      throw new Error("Selected device is not a Senxor device");
    }

    const transport = new SerialTransportBase<WebSerialPort>(port);
    const senxor = new Senxor(transport);
    return senxor;
  }

  /**
   * Registers a listener for Senxor device connection events.
   * @param listener Callback function called when a Senxor device is connected
   * @returns Cleanup function to remove the event listener
   */
  async onDeviceConnect(
    listener: (device: Senxor<SerialTransportBase<WebSerialPort>>) => void
  ) {
    const cleanup = webSerial.onDeviceConnect((port) => {
      if (isSenxorDevice(port.deviceInfo)) {
        listener(new Senxor(new SerialTransportBase<WebSerialPort>(port)));
      }
    });
    return cleanup;
  }
}
