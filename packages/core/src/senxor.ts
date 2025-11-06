import { Mutex } from "async-mutex";
import { SenxorError, SenxorTransportError } from "./error";
import type { ISenxorTransport, SenxorRawData } from "./types";
import { REGISTERS } from "./registers";
import { FIELDS } from "./fields";
import { getBits, setBits, processRawSenxorData } from "./processors";
import type { FieldName } from "./fields";
import type { SenxorData } from "./types";

export class Senxor<TTransport extends ISenxorTransport = ISenxorTransport> {
  private transport: TTransport;
  private registers: Record<number, number> = {};
  private _isStreaming: boolean = false;
  private _isOpen: boolean = false;

  private mutex: Mutex = new Mutex();
  private dataListener?: (data: SenxorData) => void;
  private errorListener?: (error: SenxorError) => void;
  private openListener?: () => void;
  private closeListener?: () => void;
  private disconnectListener?: () => void;

  constructor(transport: TTransport) {
    this.transport = transport;
    this.transport.onData((data) => this.handleTransportData(data));
    this.transport.onDisconnect(() => this.handleTransportDisconnect());
    this.transport.onError((error) => this.handleTransportError(error));
  }

  get isOpen() {
    return this._isOpen;
  }

  get deviceInfo() {
    return this.transport.deviceInfo;
  }

  get isStreaming() {
    return this._isStreaming;
  }

  async open() {
    return this.mutex.runExclusive(async () => {
      if (this._isOpen) return;
      await this.transport.open();
      await this.refreshRegisters();
      const isStreaming = await this.getFieldValue("CONTINUOUS_STREAM", {
        refresh: false,
      });
      this._isStreaming = isStreaming === 1 ? true : false;
      await this.setUpSenxor();
      this._isOpen = true;
      this.openListener?.();
    });
  }

  async close() {
    return this.mutex.runExclusive(async () => {
      if (!this._isOpen) return;
      await this.transport.close();
      this.registers = {};
      this._isOpen = false;
      this.closeListener?.();
    });
  }

  async startStreaming() {
    await this.setFieldValue("CONTINUOUS_STREAM", 1);
    this._isStreaming = true;
  }

  async stopStreaming() {
    await this.setFieldValue("CONTINUOUS_STREAM", 0);
    this._isStreaming = false;
  }

  async readReg(address: number) {
    try {
      const value = await this.transport.readReg(address);
      this.registers[address] = value;
      return value;
    } catch (error) {
      throw new SenxorError(`Failed to read register ${address}: ${error}`);
    }
  }

  async readRegs(addresses: number[]) {
    const values = await this.transport.readRegs(addresses);
    this.registers = { ...this.registers, ...values };
    return values;
  }

  async writeReg(address: number, value: number) {
    try {
      this.validateWriteReg(address, value);
      await this.transport.writeReg(address, value);
      this.registers[address] = value;
    } catch (error) {
      throw new SenxorError(`Failed to write register ${address}: ${error}`);
    }
  }

  async refreshRegisters() {
    const addresses = Object.values(REGISTERS).map((register) => register.addr);
    const values = await this.readRegs(addresses);
    return values;
  }

  async getFieldValue(
    field: FieldName,
    options: { refresh?: boolean } = { refresh: true }
  ) {
    const { refresh } = options;
    const fieldInfo = FIELDS[field];
    if (!fieldInfo) {
      throw new SenxorError(`Invalid field name: ${field}`);
    }

    if (fieldInfo.selfReset && refresh) {
      await this.readReg(fieldInfo.addr);
    }

    const regValue = this.registers[fieldInfo.addr];
    return getBits(regValue, fieldInfo.startBit, fieldInfo.endBit);
  }

  async setFieldValue(field: FieldName, value: number) {
    const fieldInfo = FIELDS[field];
    if (!fieldInfo) {
      throw new SenxorError(`Invalid field name: ${field}`);
    }
    if (!fieldInfo.writable) {
      throw new SenxorError(`Field ${field} is read-only`);
    }
    this.validateSetFieldValue(field, value);

    if (fieldInfo.selfReset) {
      await this.readReg(fieldInfo.addr);
    }
    const regValue = this.registers[fieldInfo.addr];
    const newRegValue = setBits(
      regValue,
      fieldInfo.startBit,
      fieldInfo.endBit,
      value
    );
    await this.writeReg(fieldInfo.addr, newRegValue);
  }

  onData(listener: (data: SenxorData) => void) {
    this.dataListener = listener;
  }

  onError(listener: (error: SenxorError) => void) {
    this.errorListener = listener;
  }

  onOpen(listener: () => void) {
    this.openListener = listener;
  }

  onClose(listener: () => void) {
    this.closeListener = listener;
  }

  onDisconnect(listener: () => void) {
    this.disconnectListener = listener;
  }

  private async setUpSenxor() {
    // Some settings are not supported yet.
    // So we need to set them to default values.

    await this.setFieldValue("TEMP_UNITS", 0);
    await this.setFieldValue("NO_HEADER", 0);
  }

  private validateWriteReg(addr: number, value: number) {
    if (addr < 0 || addr > 0xff) {
      throw new SenxorError(`Invalid register address: ${addr}`);
    }
    if (value < 0 || value > 0xff) {
      throw new SenxorError(`Invalid register value: ${value}`);
    }
  }

  private validateSetFieldValue(field: FieldName, value: number) {
    switch (field) {
      case "TEMP_UNITS":
        if (value !== 0) {
          throw new SenxorError(
            `TEMP_UNITS is not supported yet in senxor.js.`
          );
        }
        break;
      case "NO_HEADER":
        if (value !== 0) {
          throw new SenxorError(`NO_HEADER is not supported yet in senxor.js.`);
        }
        break;
      default:
        break;
    }
  }

  private handleTransportData(data: SenxorRawData) {
    const senxorData = processRawSenxorData(data);

    try {
      this.dataListener?.(senxorData);
    } catch (error) {
      this.errorListener?.(error as SenxorError);
    }
  }

  private handleTransportDisconnect() {
    try {
      this.close();
    } finally {
      this.disconnectListener?.();
    }
  }

  private handleTransportError(error: SenxorTransportError) {
    this.errorListener?.(error);
  }
}
