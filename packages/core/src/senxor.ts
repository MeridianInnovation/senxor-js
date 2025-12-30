import { Mutex } from "async-mutex";
import { MODULE_TYPE, SENXOR_TYPE2FRAME_SHAPE } from "./consts";
import { SenxorError, SenxorTransportError } from "./error";
import type { FieldName } from "./fields";
import { FIELDS } from "./fields";
import { REGISTERS } from "./registers";
import type { ISenxorTransport, SenxorData, SenxorRawData } from "./types";
import { getBits, processRawSenxorData, setBits } from "./utils";

export class Senxor<TTransport extends ISenxorTransport = ISenxorTransport> {
  private readonly transport: TTransport;
  private _registers: Record<number, number> = {};
  private _fileds: Partial<Record<FieldName, number>> = {};
  private _isStreaming: boolean = false;
  private _isOpen: boolean = false;

  private readonly mutex: Mutex = new Mutex();
  private dataListener?: (data: SenxorData) => void;
  private errorListener?: (error: SenxorError) => void;
  private openListener?: () => void;
  private closeListener?: () => void;
  private disconnectListener?: () => void;

  constructor(transport: TTransport) {
    this.transport = transport;
    this.transport.onData((data) => this._handleTransportData(data));
    this.transport.onDisconnect(() => this._handleTransportDisconnect());
    this.transport.onError((error) => this._handleTransportError(error));
  }

  get isOpen() {
    return this._isOpen;
  }

  get deviceInfo() {
    return { ...this.transport.deviceInfo };
  }

  get isStreaming() {
    return this._isStreaming;
  }

  get fieldsCache() {
    return { ...this._fileds };
  }

  get registersCache() {
    return { ...this._registers };
  }

  get frameShape() {
    const senxorType = this._fileds["SENXOR_TYPE"];
    if (senxorType === undefined) {
      console.warn(
        "Failed to get frame shape. Open device and load fields first."
      );
      return undefined;
    }
    if (senxorType in SENXOR_TYPE2FRAME_SHAPE) {
      return SENXOR_TYPE2FRAME_SHAPE[
        senxorType as keyof typeof SENXOR_TYPE2FRAME_SHAPE
      ];
    }
    console.warn(
      "Failed to get frame shape. Unknown SENXOR_TYPE: ",
      senxorType
    );
    return undefined;
  }

  get moduleType() {
    const moduleType = this._fileds["MODULE_TYPE"];
    if (moduleType === undefined) {
      console.warn(
        "Failed to get module type. Open device and load fields first."
      );
      return undefined;
    }
    if (moduleType in MODULE_TYPE) {
      return MODULE_TYPE[moduleType as keyof typeof MODULE_TYPE];
    }
    console.warn(
      "Failed to get module type. Unknown MODULE_TYPE: ",
      moduleType
    );
    return undefined;
  }

  async open() {
    return this.mutex.runExclusive(async () => {
      if (this._isOpen) return;
      await this.transport.open();
      this._refreshRegisters().catch((error) => {
        console.warn(
          "Failed to refresh all registers. Some registers may be not available in this device. Error: ",
          error
        );
      });
      this._setUpSenxor().catch((error) => {
        console.warn(
          "Failed to set up senxor. Some settings may be not available in this device. Error: ",
          error
        );
      });
      this.getFieldValue("CONTINUOUS_STREAM", false)
        .then((isStreaming) => {
          this._isStreaming = isStreaming === 1;
        })
        .catch((error) => {
          console.warn("Failed to get continuous stream. Error: ", error);
        });

      this._isOpen = true;
      this.openListener?.();
    });
  }

  async close() {
    return this.mutex.runExclusive(async () => {
      if (!this._isOpen) return;
      await this.transport.close();
      this._registers = {};
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
      this._registers[address] = value;
      return value;
    } catch (error) {
      const addressHex = address.toString(16).padStart(2, "0");
      const registerName = REGISTERS[address].name;
      throw new SenxorError(
        `Failed to read register 0x${addressHex} (${registerName}): ${error}`
      );
    }
  }

  async readRegs(addresses: number[]) {
    try {
      const values = await this.transport.readRegs(addresses);
      this._registers = { ...this._registers, ...values };
      return values;
    } catch (error) {
      throw new SenxorError(`Failed to read registers. Error: ${error}`);
    }
  }

  async writeReg(address: number, value: number) {
    try {
      this._validateWriteReg(address, value);
      await this.transport.writeReg(address, value);
      this._registers[address] = value;
    } catch (error) {
      const addressHex = address.toString(16).padStart(2, "0");
      const registerName = REGISTERS[address].name;
      throw new SenxorError(
        `Failed to write register 0x${addressHex} (${registerName}). Error: ${error}`
      );
    }
  }

  async getFieldValue(field: FieldName, refresh: boolean = true) {
    const fieldInfo = FIELDS[field];
    if (!fieldInfo) {
      throw new SenxorError(`Invalid field name: ${field}`);
    }

    try {
      if (fieldInfo.selfReset && refresh) {
        await this.readReg(fieldInfo.addr);
      }

      const regValue = this._registers[fieldInfo.addr];
      const fieldValue = getBits(
        regValue,
        fieldInfo.startBit,
        fieldInfo.endBit
      );
      this._fileds[field] = fieldValue;
      return fieldValue;
    } catch (error) {
      throw new SenxorError(`Failed to get field ${field}. Error: ${error}`);
    }
  }

  async setFieldValue(field: FieldName, value: number) {
    const fieldInfo = FIELDS[field];
    if (!fieldInfo) {
      throw new SenxorError(`Invalid field name: ${field}`);
    }
    if (!fieldInfo.writable) {
      throw new SenxorError(`Field ${field} is read-only`);
    }
    this._validateSetFieldValue(field, value);

    try {
      if (fieldInfo.selfReset) {
        await this.readReg(fieldInfo.addr);
      }
      const regValue = this._registers[fieldInfo.addr];
      const newRegValue = setBits(
        regValue,
        fieldInfo.startBit,
        fieldInfo.endBit,
        value
      );
      await this.writeReg(fieldInfo.addr, newRegValue);
      this._fileds[field] = value;
    } catch (error) {
      throw new SenxorError(`Failed to set field ${field}. Error: ${error}`);
    }
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

  private async _setUpSenxor() {
    // Some settings are not supported yet.
    // So we need to set them to default values.
    await this.setFieldValue("TEMP_UNITS", 0);
    await this.setFieldValue("NO_HEADER", 0);
  }

  private async _refreshRegisters() {
    const commonNames = [
      "FRAME_MODE",
      "FW_VERSION_1",
      "FW_VERSION_2",
      "FRAME_RATE",
      "SENXOR_GAIN",
      "SENXOR_TYPE",
      "MODULE_TYPE",
      "MCU_TYPE",
      "TEMP_CONVERT_CTRL",
      "SENSITIVITY_FACTOR",
      "EMISSIVITY",
      "OFFSET_CORR",
      "OBJECT_TEMP_FACTOR",
      "SENXOR_ID_0",
      "SENXOR_ID_1",
      "SENXOR_ID_2",
      "SENXOR_ID_3",
      "SENXOR_ID_4",
      "SENXOR_ID_5",
      "SENXOR_ID_6",
      "USER_FLASH_CTRL",
    ];

    const addresses = commonNames.map((name) => {
      const register = Object.values(REGISTERS).find(
        (reg) => reg.name === name
      );
      return register!.addr;
    });
    const values = await this.readRegs(addresses);
    return values;
  }

  private _validateWriteReg(addr: number, value: number) {
    if (addr < 0 || addr > 0xff) {
      throw new SenxorError(`Invalid register address: ${addr}`);
    }
    if (value < 0 || value > 0xff) {
      throw new SenxorError(`Invalid register value: ${value}`);
    }
  }

  private _validateSetFieldValue(field: FieldName, value: number) {
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

  private _handleTransportData(data: SenxorRawData) {
    const senxorData = processRawSenxorData(data);

    try {
      this.dataListener?.(senxorData);
    } catch (error) {
      this.errorListener?.(error as SenxorError);
    }
  }

  private _handleTransportDisconnect() {
    try {
      this.close();
    } finally {
      this.disconnectListener?.();
    }
  }

  private _handleTransportError(error: SenxorTransportError) {
    this.errorListener?.(error);
  }
}
