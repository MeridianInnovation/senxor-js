import { connect, type Socket } from "node:net";

import {
  PortEmitter,
  type IBytePort,
  type SerialOptions,
} from "@senxor/serial-core";

export interface TcpIpSerialDeviceInfo {
  vendorId: number;
  productId: number;
  host: string;
  port: number;
}

export class TcpSocketPort implements IBytePort<TcpIpSerialDeviceInfo> {
  readonly deviceInfo: TcpIpSerialDeviceInfo;

  private readonly emitter = new PortEmitter();
  private socket: Socket | null = null;
  private _isOpen = false;
  private isClosing = false;
  private hasEmittedDisconnect = false;

  constructor(host: string, port: number) {
    this.deviceInfo = {
      vendorId: 0,
      productId: 0,
      host,
      port,
    };
  }

  get isOpen(): boolean {
    return (
      this._isOpen &&
      this.socket !== null &&
      !this.socket.destroyed &&
      this.socket.writable
    );
  }

  async open(_options?: SerialOptions): Promise<void> {
    if (this.isOpen) {
      return;
    }
    void _options;
    const socket = await this.connectSocket();
    this.socket = socket;
    this._isOpen = true;
    this.isClosing = false;
    this.hasEmittedDisconnect = false;
    this.setupSocketListeners(socket);
    this.emitter.emit("open");
  }

  async close(): Promise<void> {
    if (!this.socket && !this._isOpen) {
      return;
    }

    this.isClosing = true;
    this._isOpen = false;

    const socket = this.socket;
    this.socket = null;

    if (socket && !socket.destroyed) {
      await new Promise<void>((resolve) => {
        socket.once("close", () => resolve());
        socket.destroy();
      });
    }

    this.emitter.emit("close");
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.isOpen || !this.socket) {
      throw new Error("Port is not open");
    }

    await new Promise<void>((resolve, reject) => {
      this.socket!.write(data, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
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

  private connectSocket(): Promise<Socket> {
    const { host, port } = this.deviceInfo;

    return new Promise((resolve, reject) => {
      const socket = connect({ host, port }, () => {
        socket.setNoDelay(true);
        socket.removeListener("error", onConnectError);
        resolve(socket);
      });

      const onConnectError = (error: Error) => {
        socket.removeListener("error", onConnectError);
        reject(error);
      };

      socket.once("error", onConnectError);
    });
  }

  private setupSocketListeners(socket: Socket): void {
    socket.on("data", (chunk: Buffer) => {
      this.emitter.emit("data", new Uint8Array(chunk));
    });

    socket.on("error", (error: Error) => {
      if (!this.isClosing) {
        this.emitter.emit("error", error);
      }
    });

    socket.on("close", () => {
      this.handleSocketDisconnect();
    });
  }

  private handleSocketDisconnect(): void {
    if (this.isClosing || this.hasEmittedDisconnect) {
      return;
    }

    this.hasEmittedDisconnect = true;
    this._isOpen = false;
    this.isClosing = true;
    this.socket = null;
    this.emitter.emit("disconnect");
  }
}
