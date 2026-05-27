import type { ISerialPort, SerialOptions } from "@senxor/serial-core";

import { PortEmitter } from "./port-emitter";

export interface WebsocketSerialDeviceInfo {
  vendorId: number;
  productId: number;
  host: string;
  port?: number;
  path: string;
  secure: boolean;
}

export class WebsocketPort implements ISerialPort<
  WebsocketSerialDeviceInfo,
  SerialOptions
> {
  readonly deviceInfo: WebsocketSerialDeviceInfo;

  private readonly emitter = new PortEmitter();
  private ws: WebSocket | null = null;
  private _isOpen = false;
  private isClosing = false;
  private hasEmittedDisconnect = false;

  constructor(
    host: string,
    port?: number,
    path: string = "/ws",
    secure: boolean = false,
  ) {
    this.deviceInfo = {
      vendorId: 0,
      productId: 0,
      host,
      port,
      path: path.startsWith("/") ? path : `/${path}`,
      secure,
    };
  }

  get isOpen(): boolean {
    return (
      this._isOpen &&
      this.ws !== null &&
      this.ws.readyState === WebSocket.OPEN
    );
  }

  async open(_options?: SerialOptions): Promise<void> {
    if (this.isOpen) {
      return;
    }
    void _options;
    const ws = await this.connectWebSocket();
    this.ws = ws;
    this._isOpen = true;
    this.isClosing = false;
    this.hasEmittedDisconnect = false;
    this.setupWebSocketListeners(ws);
    this.emitter.emit("open");
  }

  async close(): Promise<void> {
    if (!this.ws && !this._isOpen) {
      return;
    }

    this.isClosing = true;
    this._isOpen = false;

    const ws = this.ws;
    this.ws = null;

    if (ws && ws.readyState !== WebSocket.CLOSED) {
      await new Promise<void>((resolve) => {
        const handleClose = () => {
          ws.removeEventListener("close", handleClose);
          resolve();
        };
        ws.addEventListener("close", handleClose);
        ws.close();
      });
    }

    this.emitter.emit("close");
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.isOpen || !this.ws) {
      throw new Error("Port is not open");
    }

    const buffer = data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength,
    ) as ArrayBuffer;
    this.ws.send(buffer);
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

  private connectWebSocket(): Promise<WebSocket> {
    const { host, port, path, secure } = this.deviceInfo;
    const protocol = secure ? "wss" : "ws";
    const defaultPort = secure ? 443 : 80;
    const effectivePort = port ?? defaultPort;
    
    // Only include port in URL if it's not the default port
    const authority =
      effectivePort === defaultPort
        ? host
        : `${host}:${effectivePort}`;
    const url = `${protocol}://${authority}${path}`;

    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(url);
        ws.binaryType = "arraybuffer";

        const handleOpen = () => {
          ws.removeEventListener("error", handleError);
          resolve(ws);
        };

        const handleError = (event: Event) => {
          ws.removeEventListener("open", handleOpen);
          const errorEvent = event as ErrorEvent;
          reject(
            new Error(
              `WebSocket connection error: ${errorEvent.message || "Unknown error"}`,
            ),
          );
        };

        ws.addEventListener("open", handleOpen);
        ws.addEventListener("error", handleError);
      } catch (error) {
        reject(error);
      }
    });
  }

  private setupWebSocketListeners(ws: WebSocket): void {
    ws.addEventListener("message", (event: MessageEvent<ArrayBuffer>) => {
      if (event.data instanceof ArrayBuffer) {
        this.emitter.emit("data", new Uint8Array(event.data));
      }
    });

    ws.addEventListener("error", (event: Event) => {
      if (!this.isClosing) {
        const errorEvent = event as ErrorEvent;
        const error = new Error(
          `WebSocket error: ${errorEvent.message || "Unknown error"}`,
        );
        this.emitter.emit("error", error);
      }
    });

    ws.addEventListener("close", () => {
      this.handleWebSocketDisconnect();
    });
  }

  private handleWebSocketDisconnect(): void {
    if (this.hasEmittedDisconnect) {
      return;
    }

    this.hasEmittedDisconnect = true;
    this._isOpen = false;
    this.isClosing = true;
    this.ws = null;
    this.emitter.emit("disconnect");
  }
}
