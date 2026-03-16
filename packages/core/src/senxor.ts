import { Mutex } from "async-mutex";
import {
  MCU_TYPE,
  MODULE_TYPE,
  SENXOR_TYPE,
  SENXOR_TYPE2FRAME_SHAPE,
} from "./consts";

import { SenxorError, SenxorTransportError } from "./error";
import type { FieldName } from "./fields";
import { FIELDS, REGISTER2FIELD } from "./fields";
import { REGISTERS } from "./registers";
import type {
  ISenxorTransport,
  SenxorData,
  SenxorModuleName,
  SenxorRawData,
} from "./types";
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

  async open() {
    return this.mutex.runExclusive(async () => {
      if (this._isOpen) return;
      await this.transport.open();
      await this.stopStreaming();

      try {
        await this._refreshRegisters();
      } catch (error) {
        console.warn(
          "Failed to refresh all registers. Some registers may be not available in this device. Error: ",
          error,
        );
      }

      try {
        await this._setUpSenxor();
      } catch (error) {
        console.warn(
          "Failed to set up senxor. Some settings may be not available in this device. Error: ",
          error,
        );
      }

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
      this._refreshField(address, value);
      return value;
    } catch (error) {
      const addressHex = address.toString(16).padStart(2, "0");
      const registerName = REGISTERS[address].name;
      throw new SenxorError(
        `Failed to read register 0x${addressHex} (${registerName}): ${error}`,
      );
    }
  }

  async readRegs(addresses: number[]) {
    try {
      const values = await this.transport.readRegs(addresses);
      this._registers = { ...this._registers, ...values };
      Object.entries(values).forEach(([address, value]) => {
        this._refreshField(Number(address), value);
      });
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
      this._refreshField(address, value);
    } catch (error) {
      const addressHex = address.toString(16).padStart(2, "0");
      const registerName = REGISTERS[address].name;
      throw new SenxorError(
        `Failed to write register 0x${addressHex} (${registerName}). Error: ${error}`,
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
        fieldInfo.endBit,
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
        value,
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

  // Device info helpers

  async getShape(): Promise<[number, number] | undefined> {
    const senxorType = await this.getFieldValue("SENXOR_TYPE");
    const shape =
      SENXOR_TYPE2FRAME_SHAPE[
        senxorType as keyof typeof SENXOR_TYPE2FRAME_SHAPE
      ];
    if (!shape) {
      console.warn(
        "Failed to get frame shape. Unknown SENXOR_TYPE:",
        senxorType,
      );
      return undefined;
    }
    return [shape.height, shape.width];
  }

  async getFwVersion(): Promise<string | undefined> {
    const major = await this.getFieldValue("FW_VERSION_MAJOR");
    const minor = await this.getFieldValue("FW_VERSION_MINOR");
    const build = await this.getFieldValue("FW_VERSION_BUILD");
    if (major === undefined || minor === undefined || build === undefined) {
      console.warn("Failed to get firmware version. Missing version fields.");
      return undefined;
    }
    return `${major}.${minor}.${build}`;
  }

  async getSenxorType(): Promise<string | undefined> {
    const rawType = await this.getFieldValue("SENXOR_TYPE");
    const typeName = SENXOR_TYPE[rawType as keyof typeof SENXOR_TYPE];
    if (!typeName) {
      console.warn("Failed to get senxor type. Unknown SENXOR_TYPE:", rawType);
      return undefined;
    }
    return typeName;
  }

  async getModuleType(): Promise<string | undefined> {
    const raw = await this.getFieldValue("MODULE_TYPE");
    const typeName = MODULE_TYPE[raw as keyof typeof MODULE_TYPE];
    if (!typeName) {
      console.warn("Failed to get module type. Unknown MODULE_TYPE:", raw);
      return undefined;
    }
    return typeName;
  }

  async getMcuType(): Promise<string | undefined> {
    const raw = await this.getFieldValue("MCU_TYPE");
    const typeName = MCU_TYPE[raw as keyof typeof MCU_TYPE];
    if (!typeName) {
      console.warn("Failed to get MCU type. Unknown MCU_TYPE:", raw);
      return undefined;
    }
    return typeName;
  }

  async getModuleName(): Promise<SenxorModuleName | undefined> {
    const shape = await this.getShape();
    if (!shape) {
      console.warn("Failed to get module name. Frame shape is undefined.");
      return undefined;
    }
    const [height, width] = shape;
    if (height === 62 && width === 80) {
      return "Cougar";
    }
    if (height === 120 && width === 160) {
      return "Panther";
    }
    if (height === 50 && width === 50) {
      return "Cheetah";
    }
    console.warn("Failed to get module name. Unknown frame shape:", shape);
    return undefined;
  }

  async getProductionYear(): Promise<number | undefined> {
    const year = await this.getFieldValue("PRODUCTION_YEAR");
    if (year === undefined) {
      console.warn(
        "Failed to get production year. Field PRODUCTION_YEAR missing.",
      );
      return undefined;
    }
    return 2000 + year;
  }

  async getProductionWeek(): Promise<number | undefined> {
    const week = await this.getFieldValue("PRODUCTION_WEEK");
    if (week === undefined) {
      console.warn(
        "Failed to get production week. Field PRODUCTION_WEEK missing.",
      );
      return undefined;
    }
    return week;
  }

  async getManufLocation(): Promise<number | undefined> {
    const location = await this.getFieldValue("MANUF_LOCATION");
    if (location === undefined) {
      console.warn(
        "Failed to get manufacturing location. Field MANUF_LOCATION missing.",
      );
      return undefined;
    }
    return location;
  }

  async getSerialNumber(): Promise<number | undefined> {
    const sn0 = await this.getFieldValue("SERIAL_NUMBER_0");
    const sn1 = await this.getFieldValue("SERIAL_NUMBER_1");
    const sn2 = await this.getFieldValue("SERIAL_NUMBER_2");
    if (sn0 === undefined || sn1 === undefined || sn2 === undefined) {
      console.warn(
        "Failed to get serial number. SERIAL_NUMBER_* fields missing.",
      );
      return undefined;
    }
    const value = (sn0 << 16) | (sn1 << 8) | sn2;
    return value >>> 0;
  }

  async getSn(): Promise<string | undefined> {
    const productionYear = await this.getFieldValue("PRODUCTION_YEAR");
    const productionWeek = await this.getFieldValue("PRODUCTION_WEEK");
    const manufLocation = await this.getFieldValue("MANUF_LOCATION");
    const serialNumber = await this.getSerialNumber();
    if (
      productionYear === undefined ||
      productionWeek === undefined ||
      manufLocation === undefined ||
      serialNumber === undefined
    ) {
      console.warn("Failed to get SN. Some SN related fields are missing.");
      return undefined;
    }
    return `${productionYear.toString(16).padStart(2, "0").toUpperCase()}${productionWeek
      .toString(16)
      .padStart(2, "0")
      .toUpperCase()}${manufLocation
      .toString(16)
      .padStart(2, "0")
      .toUpperCase()}${serialNumber.toString(16).padStart(6, "0").toUpperCase()}`;
  }

  // Frame rate

  async getFrameRateDivider(): Promise<number | undefined> {
    const divider = await this.getFieldValue("FRAME_RATE_DIVIDER");
    if (divider === undefined) {
      console.warn(
        "Failed to get frame rate divider. Field FRAME_RATE_DIVIDER missing.",
      );
      return undefined;
    }
    return divider;
  }

  async setFrameRateDivider(divider: number): Promise<void> {
    await this.setFieldValue("FRAME_RATE_DIVIDER", divider);
  }

  // Gain

  async getModuleGain(): Promise<string | undefined> {
    const value = await this.getFieldValue("MODULE_GAIN");
    if (value === undefined) {
      console.warn("Failed to get module gain. Field MODULE_GAIN missing.");
      return undefined;
    }
    const mapping: Record<number, string> = {
      0: "1.0",
      1: "auto",
      2: "0.25",
      3: "0.5",
    };
    const result = mapping[value];
    if (!result) {
      console.warn(
        "Failed to get module gain. Unknown MODULE_GAIN value:",
        value,
      );
      return undefined;
    }
    return result;
  }

  async setModuleGain(gain: number): Promise<void> {
    await this.setFieldValue("MODULE_GAIN", gain);
  }

  // Temperature correction

  async getSensitivity(): Promise<number | undefined> {
    const raw = await this.getFieldValue("CORR_FACTOR");
    if (raw === undefined) {
      console.warn("Failed to get sensitivity. Field CORR_FACTOR missing.");
      return undefined;
    }
    return Math.round(raw * 0.01 * 100) / 100;
  }

  async setSensitivity(value: number): Promise<void> {
    const fieldValue = Math.round(value * 100);
    await this.setFieldValue("CORR_FACTOR", fieldValue);
  }

  async getEmissivity(): Promise<number | undefined> {
    const raw = await this.getFieldValue("EMISSIVITY");
    if (raw === undefined) {
      console.warn("Failed to get emissivity. Field EMISSIVITY missing.");
      return undefined;
    }
    return Math.round(raw * 0.01 * 100) / 100;
  }

  async setEmissivity(value: number): Promise<void> {
    const fieldValue = Math.round(value * 100);
    await this.setFieldValue("EMISSIVITY", fieldValue);
  }

  async getOffset(): Promise<number | undefined> {
    const raw = await this.getFieldValue("OFFSET");
    if (raw === undefined) {
      console.warn("Failed to get offset. Field OFFSET missing.");
      return undefined;
    }
    const int8 = raw < 128 ? raw : raw - 256;
    return Math.round(int8 * 0.1 * 10) / 10;
  }

  async setOffset(value: number): Promise<void> {
    const int8 = Math.round(value * 10);
    const uint8 = int8 >= 0 ? int8 : int8 + 256;
    await this.setFieldValue("OFFSET", uint8);
  }

  async getOtf(): Promise<number | undefined> {
    const raw = await this.getFieldValue("OTF");
    if (raw === undefined) {
      console.warn("Failed to get OTF. Field OTF missing.");
      return undefined;
    }
    const int8 = raw < 128 ? raw : raw - 256;
    return Math.round(int8 * 0.01 * 100) / 100;
  }

  async setOtf(value: number): Promise<void> {
    const int8 = Math.round(value * 100);
    const uint8 = int8 >= 0 ? int8 : int8 + 256;
    await this.setFieldValue("OTF", uint8);
  }

  // Filters

  async disableAllFilters(): Promise<void> {
    await this.setStarkEnable(false);
    await this.setMmsKxmsEnable(false);
    await this.setMmsRaEnable(false);
    await this.setMedianEnable(false);
    await this.setTemporalEnable(false);
  }

  async getFiltersStatus(): Promise<{
    stark: boolean;
    mms_kxms: boolean;
    mms_ra: boolean;
    median: boolean;
    temporal: boolean;
  }> {
    const [stark, mmsKxms, mmsRa, median, temporal] = await Promise.all([
      this.getStarkEnable(),
      this.getMmsKxmsEnable(),
      this.getMmsRaEnable(),
      this.getMedianEnable(),
      this.getTemporalEnable(),
    ]);
    return {
      stark,
      mms_kxms: mmsKxms,
      mms_ra: mmsRa,
      median,
      temporal,
    };
  }

  async getStarkEnable(): Promise<boolean> {
    const value = await this.getFieldValue("STARK_ENABLE");
    return value === 1;
  }

  async setStarkEnable(enabled: boolean): Promise<void> {
    await this.setFieldValue("STARK_ENABLE", enabled ? 1 : 0);
  }

  async getMmsKxmsEnable(): Promise<boolean> {
    const value = await this.getFieldValue("MMS_KXMS");
    return value === 1;
  }

  async setMmsKxmsEnable(enabled: boolean): Promise<void> {
    await this.setFieldValue("MMS_KXMS", enabled ? 1 : 0);
  }

  async getMmsRaEnable(): Promise<boolean> {
    const value = await this.getFieldValue("MMS_RA");
    return value === 1;
  }

  async setMmsRaEnable(enabled: boolean): Promise<void> {
    await this.setFieldValue("MMS_RA", enabled ? 1 : 0);
  }

  async getMedianEnable(): Promise<boolean> {
    const value = await this.getFieldValue("MEDIAN_ENABLE");
    return value === 1;
  }

  async setMedianEnable(enabled: boolean): Promise<void> {
    await this.setFieldValue("MEDIAN_ENABLE", enabled ? 1 : 0);
  }

  async getTemporalEnable(): Promise<boolean> {
    const value = await this.getFieldValue("TEMPORAL_ENABLE");
    return value === 1;
  }

  async setTemporalEnable(enabled: boolean): Promise<void> {
    await this.setFieldValue("TEMPORAL_ENABLE", enabled ? 1 : 0);
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
        (reg) => reg.name === name,
      );
      return register!.addr;
    });
    const results: Record<number, number> = {};
    for (const addr of addresses) {
      // Using single readReg per address
      results[addr] = await this.readReg(addr);
    }
    return results;
  }

  private _refreshField(regAddr: number, regValue: number) {
    const fields = REGISTER2FIELD[regAddr];
    if (!fields) return;
    fields.forEach((field) => {
      const fieldInfo = FIELDS[field];
      const fieldValue = getBits(
        regValue,
        fieldInfo.startBit,
        fieldInfo.endBit,
      );
      this._fileds[field] = fieldValue;
    });
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
            `TEMP_UNITS is not supported yet in senxor.js.`,
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
    if (!this._isOpen) return;
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
