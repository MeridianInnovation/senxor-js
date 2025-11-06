import type { ISenxorTransport, SenxorRawData } from "@senxor/core";
import type { ISerialPort, SerialOptions } from "./types";
import { PrefixLengthParser } from "serial-packet-parser";
import {
  messageParserOptions,
  parseMessageBody,
  senxorAckDecoder,
  senxorAckEncoder,
} from "./parser";
import { SenxorTransportError } from "./error";
import { CommandSender } from "./command-sender";

export const senxorPortOptions: SerialOptions = {
  baudRate: 115200,
  bytesize: 8,
  stopbits: 1,
};

export class SerialTransportBase<TPort extends ISerialPort>
  implements ISenxorTransport
{
  private port: TPort;
  private parser: PrefixLengthParser;
  private commandSender: CommandSender<TPort>;

  private dataListener?: (data: SenxorRawData) => void;
  private errorListener?: (error: SenxorTransportError) => void;
  private openListener?: () => void;
  private closeListener?: () => void;
  private disconnectListener?: () => void;

  constructor(port: TPort) {
    this.port = port;
    this.commandSender = new CommandSender(this.port);

    const parserOptions = {
      ...messageParserOptions,
      onMessage: this.handleMessage.bind(this),
      onError: this.handlePortError.bind(this),
    };
    this.parser = new PrefixLengthParser(parserOptions);
    this.setupPortEventListeners();
  }

  get isOpen() {
    return this.port.isOpen;
  }

  get deviceInfo() {
    return this.port.deviceInfo;
  }

  async open() {
    await this.port.open(senxorPortOptions);
  }

  async close() {
    await this.port.close();
  }

  async readReg(address: number): Promise<number> {
    if (!this.port.isOpen) {
      throw new SenxorTransportError("Cannot read register: port is closed");
    }
    const command = senxorAckEncoder.RREG(address);
    return this.commandSender.sendCommand("RREG", command, 2000, 2);
  }

  async readRegs(addresses: number[]): Promise<Record<number, number>> {
    if (!this.port.isOpen) {
      throw new SenxorTransportError("Cannot read registers: port is closed");
    }
    const commands = senxorAckEncoder.RRSE(addresses);
    return this.commandSender.sendCommand("RRSE", commands, 2000, 2);
  }

  async writeReg(address: number, value: number): Promise<void> {
    if (!this.port.isOpen) {
      throw new SenxorTransportError("Cannot write register: port is closed");
    }
    const command = senxorAckEncoder.WREG(address, value);
    return this.commandSender.sendCommand("WREG", command, 2000, 2);
  }

  onData(listener: (data: SenxorRawData) => void): void {
    this.dataListener = listener;
  }

  onError(listener: (error: SenxorTransportError) => void): void {
    this.errorListener = listener;
    this.commandSender.onError(listener);
  }

  onOpen(listener: () => void): void {
    this.openListener = listener;
  }

  onClose(listener: () => void): void {
    this.closeListener = listener;
  }

  onDisconnect(listener: () => void): void {
    this.disconnectListener = listener;
  }

  private setupPortEventListeners() {
    this.port.on("data", (data) => this.parser.push(data));
    this.port.on("error", (error) => this.handlePortError(error));
    this.port.on("open", () => this.handlePortOpen());
    this.port.on("close", () => this.handlePortClose());
    this.port.on("disconnect", () => this.handlePortDisconnect());
  }

  private handleMessage(message: Uint8Array, _totalLength: number) {
    void _totalLength;
    const { cmd: cmdStr, data } = parseMessageBody(message);

    switch (cmdStr) {
      case "RREG": {
        const regValue = senxorAckDecoder.RREG(data);
        this.commandSender.resolveAck("RREG", regValue);
        break;
      }
      case "WREG": {
        const wregResult = senxorAckDecoder.WREG(data);
        this.commandSender.resolveAck("WREG", wregResult);
        break;
      }
      case "RRSE": {
        const rrseResult = senxorAckDecoder.RRSE(data);
        this.commandSender.resolveAck("RRSE", rrseResult);
        break;
      }
      case "GFRA": {
        const gfraData = senxorAckDecoder.GFRA(data);
        this.handleGfraAck(gfraData);
        break;
      }
      case "SERR": {
        this.handleSerrAck();
        break;
      }
      default: {
        this.handleUnknownAck(cmdStr);
        break;
      }
    }
  }

  private handlePortDisconnect() {
    this.disconnectListener?.();
  }

  private handlePortClose() {
    this.closeListener?.();
  }

  private handlePortOpen() {
    this.openListener?.();
  }

  private handleGfraAck(gfraData: { header?: Uint8Array; frame: Uint8Array }) {
    const timestamp = Date.now();
    const senxorRawData: SenxorRawData = {
      header: gfraData.header,
      frame: gfraData.frame,
      timestamp,
    };
    this.dataListener?.(senxorRawData);
  }

  private handlePortError(error: Error) {
    const err = new SenxorTransportError("Port I/O error", error);
    this.errorListener?.(err);
  }

  private handleSerrAck() {
    const err = new SenxorTransportError(
      "SERR Error: The device does not have a lens module installed"
    );
    this.errorListener?.(err);
  }

  private handleUnknownAck(cmd: string) {
    const err = new SenxorTransportError(`Unknown ACK: ${cmd}`);
    this.errorListener?.(err);
  }
}
