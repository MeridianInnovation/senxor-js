import { SenxorTransportError } from "@senxor/core";
import { Mutex } from "async-mutex";
import type { ISerialPort, SenxorAck, SenxorCommand } from "./types.ts";

export class CommandSender<TPort extends ISerialPort> {
  private port: TPort;
  private commandMutex: Mutex;
  private encoder = new TextEncoder();
  private pendingCommand?: {
    type: keyof SenxorCommand;
    resolve: (value: SenxorAck[keyof SenxorCommand]) => void;
    reject: (error: Error) => void;
  };
  private errorListener?: (error: SenxorTransportError) => void;

  constructor(port: TPort) {
    this.port = port;
    this.commandMutex = new Mutex();
  }

  onError(listener: (error: SenxorTransportError) => void) {
    this.errorListener = listener;
  }

  async sendCommand<K extends keyof SenxorCommand>(
    type: K,
    command: string,
    timeout: number = 2000,
    attempts: number = 3,
  ): Promise<SenxorAck[K]> {
    return this.commandMutex.runExclusive(async () => {
      return this.sendCommandWithRetry(type, command, timeout, attempts);
    });
  }

  resolveAck<K extends keyof SenxorCommand>(type: K, data: SenxorAck[K]): void {
    if (!this.pendingCommand) {
      const err = new SenxorTransportError(
        `Bare ACK received: ${type} without a corresponding command`,
      );
      this.errorListener?.(err);
      return;
    }

    if (this.pendingCommand.type !== type) {
      const err = new SenxorTransportError(
        `ACK type mismatch: expected ${this.pendingCommand.type}, received ${type}`,
      );
      this.pendingCommand.reject(err);
      this.pendingCommand = undefined;
      return;
    }

    this.pendingCommand.resolve(data);
    this.pendingCommand = undefined;
  }

  private async sendCommandWithRetry<K extends keyof SenxorCommand>(
    type: K,
    command: string,
    timeout: number,
    attempts: number,
  ): Promise<SenxorAck[K]> {
    let lastError: Error | undefined;
    for (let i = 0; i < attempts; i++) {
      try {
        return await this.sendCommandOnce(type, command, timeout);
      } catch (error) {
        lastError = error as Error;
      }
    }
    throw lastError;
  }

  private async sendCommandOnce<K extends keyof SenxorCommand>(
    type: K,
    command: string,
    timeout: number,
  ): Promise<SenxorAck[K]> {
    return new Promise((resolve, reject) => {
      this.pendingCommand = {
        type,
        resolve: resolve as (value: SenxorAck[keyof SenxorCommand]) => void,
        reject: reject,
      };

      const timeoutId = setTimeout(() => {
        this.pendingCommand = undefined;
        reject(
          new SenxorTransportError(
            `Command timeout: no ACK received for ${type}`,
          ),
        );
      }, timeout);

      this.port.write(this.encoder.encode(command)).catch((err) => {
        clearTimeout(timeoutId);
        this.pendingCommand = undefined;
        reject(
          new SenxorTransportError(
            `Failed to write command: ${type}`,
            err as Error,
          ),
        );
      });
    });
  }
}
