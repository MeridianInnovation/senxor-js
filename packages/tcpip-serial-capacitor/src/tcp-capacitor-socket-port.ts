import type { ISerialPort, SerialOptions } from "@senxor/serial-core";
import { DataEncoding, TcpSocket } from "capacitor-tcp-socket";

import { base64ToUint8Array, uint8ArrayToBase64 } from "./binary-codec";
import { PortEmitter } from "./port-emitter";

const READ_BUFFER_SIZE = 8192;
const READ_TIMEOUT_SECONDS = 10;

export interface TcpIpSerialDeviceInfo {
  vendorId: number;
  productId: number;
  host: string;
  port: number;
}

export class TcpCapacitorSocketPort implements ISerialPort<
  TcpIpSerialDeviceInfo,
  SerialOptions
> {
  readonly deviceInfo: TcpIpSerialDeviceInfo;

  private readonly emitter = new PortEmitter();
  private clientId: number | null = null;
  private _isOpen = false;
  private isClosing = false;
  private hasEmittedDisconnect = false;
  private readLoopRunning = false;
  private abortReadLoop = false;

  constructor(host: string, port: number) {
    this.deviceInfo = {
      vendorId: 0,
      productId: 0,
      host,
      port,
    };
  }

  get isOpen(): boolean {
    return this._isOpen && this.clientId !== null;
  }

  async open(_options?: SerialOptions): Promise<void> {
    if (this.isOpen) {
      return;
    }
    void _options;

    const { host, port } = this.deviceInfo;
    const { client } = await TcpSocket.connect({
      ipAddress: host,
      port,
    });

    this.clientId = client;
    this._isOpen = true;
    this.isClosing = false;
    this.hasEmittedDisconnect = false;
    this.abortReadLoop = false;
    this.startReadLoop();
    this.emitter.emit("open");
  }

  async close(): Promise<void> {
    if (!this.clientId && !this._isOpen) {
      return;
    }

    this.isClosing = true;
    this._isOpen = false;
    this.abortReadLoop = true;

    const clientId = this.clientId;
    this.clientId = null;

    if (clientId !== null) {
      try {
        await TcpSocket.disconnect({ client: clientId });
      } catch {
        // Ignore disconnect errors during intentional close.
      }
    }

    this.emitter.emit("close");
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.isOpen || this.clientId === null) {
      throw new Error("Port is not open");
    }

    await TcpSocket.send({
      client: this.clientId,
      data: uint8ArrayToBase64(data),
      encoding: DataEncoding.BASE64,
    });
  }

  on<K extends "data" | "error" | "open" | "close" | "disconnect">(
    event: K,
    listener: K extends "data"
      ? (data: Uint8Array) => void
      : K extends "error"
        ? (error: Error) => void
        : () => void,
  ): () => void {
    return this.emitter.on(event, listener as never);
  }

  private startReadLoop(): void {
    if (this.readLoopRunning) {
      return;
    }
    this.readLoopRunning = true;
    void this.runReadLoop().finally(() => {
      this.readLoopRunning = false;
    });
  }

  private async runReadLoop(): Promise<void> {
    while (this._isOpen && !this.abortReadLoop && this.clientId !== null) {
      const clientId = this.clientId;

      try {
        const { result } = await TcpSocket.read({
          client: clientId,
          expectLen: READ_BUFFER_SIZE,
          timeout: READ_TIMEOUT_SECONDS,
          encoding: DataEncoding.BASE64,
        });

        if (result && result.length > 0) {
          this.emitter.emit("data", base64ToUint8Array(result));
        }
      } catch (error) {
        if (!this.isClosing && !this.abortReadLoop) {
          this.emitter.emit(
            "error",
            error instanceof Error ? error : new Error(String(error)),
          );
          this.handleDisconnect();
        }
        break;
      }
    }
  }

  private handleDisconnect(): void {
    if (this.hasEmittedDisconnect) {
      return;
    }

    this.hasEmittedDisconnect = true;
    this._isOpen = false;
    this.isClosing = true;
    this.abortReadLoop = true;
    this.clientId = null;
    this.emitter.emit("disconnect");
  }
}
