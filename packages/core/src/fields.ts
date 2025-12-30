interface FieldInfo {
  name: string;
  readable: boolean;
  writable: boolean;
  addr: number;
  startBit: number;
  endBit: number;
  selfReset: boolean;
}

export const FIELDS: Record<string, FieldInfo> = {
  SW_RESET: {
    name: "SW_RESET",
    readable: false,
    writable: true,
    addr: 0x00,
    startBit: 0,
    endBit: 1,
    selfReset: true,
  },
  DMA_TIMEOUT_ENABLE: {
    name: "DMA_TIMEOUT_ENABLE",
    readable: true,
    writable: true,
    addr: 0x01,
    startBit: 0,
    endBit: 1,
    selfReset: false,
  },
  TIMEOUT_PERIOD: {
    name: "TIMEOUT_PERIOD",
    readable: true,
    writable: true,
    addr: 0x01,
    startBit: 1,
    endBit: 3,
    selfReset: false,
  },
  STOP_HOST_XFER: {
    name: "STOP_HOST_XFER",
    readable: true,
    writable: true,
    addr: 0x01,
    startBit: 3,
    endBit: 4,
    selfReset: true,
  },
  REQ_RETRANSMIT: {
    name: "REQ_RETRANSMIT",
    readable: true,
    writable: true,
    addr: 0x19,
    startBit: 0,
    endBit: 1,
    selfReset: true,
  },
  AUTO_RETRANSMIT: {
    name: "AUTO_RETRANSMIT",
    readable: true,
    writable: true,
    addr: 0x19,
    startBit: 1,
    endBit: 2,
    selfReset: false,
  },
  GET_SINGLE_FRAME: {
    name: "GET_SINGLE_FRAME",
    readable: true,
    writable: true,
    addr: 0xb1,
    startBit: 0,
    endBit: 1,
    selfReset: true,
  },
  CONTINUOUS_STREAM: {
    name: "CONTINUOUS_STREAM",
    readable: true,
    writable: true,
    addr: 0xb1,
    startBit: 1,
    endBit: 2,
    selfReset: false,
  },
  READOUT_MODE: {
    name: "READOUT_MODE",
    readable: true,
    writable: true,
    addr: 0xb1,
    startBit: 2,
    endBit: 5,
    selfReset: false,
  },
  NO_HEADER: {
    name: "NO_HEADER",
    readable: true,
    writable: true,
    addr: 0xb1,
    startBit: 5,
    endBit: 6,
    selfReset: false,
  },
  ADC_ENABLE: {
    name: "ADC_ENABLE",
    readable: true,
    writable: true,
    addr: 0xb1,
    startBit: 7,
    endBit: 8,
    selfReset: false,
  },
  FW_VERSION_MAJOR: {
    name: "FW_VERSION_MAJOR",
    readable: true,
    writable: false,
    addr: 0xb2,
    startBit: 4,
    endBit: 8,
    selfReset: false,
  },
  FW_VERSION_MINOR: {
    name: "FW_VERSION_MINOR",
    readable: true,
    writable: false,
    addr: 0xb2,
    startBit: 0,
    endBit: 4,
    selfReset: false,
  },
  FW_VERSION_BUILD: {
    name: "FW_VERSION_BUILD",
    readable: true,
    writable: false,
    addr: 0xb3,
    startBit: 0,
    endBit: 8,
    selfReset: false,
  },
  FRAME_RATE_DIVIDER: {
    name: "FRAME_RATE_DIVIDER",
    readable: true,
    writable: true,
    addr: 0xb4,
    startBit: 0,
    endBit: 7,
    selfReset: false,
  },
  SLEEP_PERIOD: {
    name: "SLEEP_PERIOD",
    readable: true,
    writable: true,
    addr: 0xb5,
    startBit: 0,
    endBit: 6,
    selfReset: false,
  },
  PERIOD_X100: {
    name: "PERIOD_X100",
    readable: true,
    writable: true,
    addr: 0xb5,
    startBit: 6,
    endBit: 7,
    selfReset: false,
  },
  SLEEP: {
    name: "SLEEP",
    readable: true,
    writable: true,
    addr: 0xb5,
    startBit: 7,
    endBit: 8,
    selfReset: true,
  },
  READOUT_TOO_SLOW: {
    name: "READOUT_TOO_SLOW",
    readable: true,
    writable: false,
    addr: 0xb6,
    startBit: 1,
    endBit: 2,
    selfReset: true,
  },
  SENXOR_IF_ERROR: {
    name: "SENXOR_IF_ERROR",
    readable: true,
    writable: false,
    addr: 0xb6,
    startBit: 2,
    endBit: 3,
    selfReset: false,
  },
  CAPTURE_ERROR: {
    name: "CAPTURE_ERROR",
    readable: true,
    writable: false,
    addr: 0xb6,
    startBit: 3,
    endBit: 4,
    selfReset: false,
  },
  DATA_READY: {
    name: "DATA_READY",
    readable: true,
    writable: false,
    addr: 0xb6,
    startBit: 4,
    endBit: 5,
    selfReset: false,
  },
  BOOTING_UP: {
    name: "BOOTING_UP",
    readable: true,
    writable: false,
    addr: 0xb6,
    startBit: 5,
    endBit: 6,
    selfReset: false,
  },
  CLK_SLOW_DOWN: {
    name: "CLK_SLOW_DOWN",
    readable: true,
    writable: true,
    addr: 0xb7,
    startBit: 0,
    endBit: 1,
    selfReset: false,
  },
  MODULE_GAIN: {
    name: "MODULE_GAIN",
    readable: true,
    writable: true,
    addr: 0xb9,
    startBit: 0,
    endBit: 4,
    selfReset: false,
  },
  SENXOR_TYPE: {
    name: "SENXOR_TYPE",
    readable: true,
    writable: false,
    addr: 0xba,
    startBit: 0,
    endBit: 8,
    selfReset: false,
  },
  MODULE_TYPE: {
    name: "MODULE_TYPE",
    readable: true,
    writable: false,
    addr: 0xbb,
    startBit: 0,
    endBit: 8,
    selfReset: false,
  },
  MCU_TYPE: {
    name: "MCU_TYPE",
    readable: true,
    writable: false,
    addr: 0x33,
    startBit: 0,
    endBit: 8,
    selfReset: false,
  },
  LUT_SOURCE: {
    name: "LUT_SOURCE",
    readable: true,
    writable: true,
    addr: 0xbc,
    startBit: 0,
    endBit: 1,
    selfReset: false,
  },
  LUT_SELECTOR: {
    name: "LUT_SELECTOR",
    readable: true,
    writable: true,
    addr: 0xbc,
    startBit: 1,
    endBit: 3,
    selfReset: false,
  },
  LUT_VERSION: {
    name: "LUT_VERSION",
    readable: true,
    writable: false,
    addr: 0xbc,
    startBit: 4,
    endBit: 8,
    selfReset: false,
  },
  CORR_FACTOR: {
    name: "CORR_FACTOR",
    readable: true,
    writable: true,
    addr: 0xc2,
    startBit: 0,
    endBit: 8,
    selfReset: false,
  },
  START_COLOFFS_CALIB: {
    name: "START_COLOFFS_CALIB",
    readable: true,
    writable: true,
    addr: 0xc5,
    startBit: 1,
    endBit: 2,
    selfReset: true,
  },
  COLOFFS_CALIB_ON: {
    name: "COLOFFS_CALIB_ON",
    readable: true,
    writable: false,
    addr: 0xc5,
    startBit: 2,
    endBit: 3,
    selfReset: false,
  },
  USE_SELF_CALIB: {
    name: "USE_SELF_CALIB",
    readable: true,
    writable: true,
    addr: 0xc5,
    startBit: 4,
    endBit: 5,
    selfReset: true,
  },
  CALIB_SAMPLE_SIZE: {
    name: "CALIB_SAMPLE_SIZE",
    readable: true,
    writable: true,
    addr: 0xc5,
    startBit: 5,
    endBit: 8,
    selfReset: false,
  },
  EMISSIVITY: {
    name: "EMISSIVITY",
    readable: true,
    writable: true,
    addr: 0xca,
    startBit: 0,
    endBit: 8,
    selfReset: false,
  },
  OFFSET: {
    name: "OFFSET",
    readable: true,
    writable: true,
    addr: 0xcb,
    startBit: 0,
    endBit: 8,
    selfReset: false,
  },
  OTF: {
    name: "OTF",
    readable: true,
    writable: true,
    addr: 0xcd,
    startBit: 0,
    endBit: 8,
    selfReset: false,
  },
  PRODUCTION_YEAR: {
    name: "PRODUCTION_YEAR",
    readable: true,
    writable: false,
    addr: 0xe0,
    startBit: 0,
    endBit: 8,
    selfReset: false,
  },
  PRODUCTION_WEEK: {
    name: "PRODUCTION_WEEK",
    readable: true,
    writable: false,
    addr: 0xe1,
    startBit: 0,
    endBit: 8,
    selfReset: false,
  },
  MANUF_LOCATION: {
    name: "MANUF_LOCATION",
    readable: true,
    writable: false,
    addr: 0xe2,
    startBit: 0,
    endBit: 8,
    selfReset: false,
  },
  SERIAL_NUMBER_0: {
    name: "SERIAL_NUMBER_0",
    readable: true,
    writable: false,
    addr: 0xe3,
    startBit: 0,
    endBit: 8,
    selfReset: false,
  },
  SERIAL_NUMBER_1: {
    name: "SERIAL_NUMBER_1",
    readable: true,
    writable: false,
    addr: 0xe4,
    startBit: 0,
    endBit: 8,
    selfReset: false,
  },
  SERIAL_NUMBER_2: {
    name: "SERIAL_NUMBER_2",
    readable: true,
    writable: false,
    addr: 0xe5,
    startBit: 0,
    endBit: 8,
    selfReset: false,
  },
  USER_FLASH_ENABLE: {
    name: "USER_FLASH_ENABLE",
    readable: true,
    writable: true,
    addr: 0xd8,
    startBit: 0,
    endBit: 1,
    selfReset: false,
  },
  TEMP_UNITS: {
    name: "TEMP_UNITS",
    readable: true,
    writable: true,
    addr: 0x31,
    startBit: 0,
    endBit: 3,
    selfReset: false,
  },
  STARK_ENABLE: {
    name: "STARK_ENABLE",
    readable: true,
    writable: true,
    addr: 0x20,
    startBit: 0,
    endBit: 1,
    selfReset: false,
  },
  STARK_TYPE: {
    name: "STARK_TYPE",
    readable: true,
    writable: true,
    addr: 0x20,
    startBit: 1,
    endBit: 4,
    selfReset: false,
  },
  SPATIAL_KERNEL: {
    name: "SPATIAL_KERNEL",
    readable: true,
    writable: true,
    addr: 0x20,
    startBit: 4,
    endBit: 5,
    selfReset: false,
  },
  STARK_CUTOFF: {
    name: "STARK_CUTOFF",
    readable: true,
    writable: true,
    addr: 0x21,
    startBit: 0,
    endBit: 7,
    selfReset: false,
  },
  STARK_GRADIENT: {
    name: "STARK_GRADIENT",
    readable: true,
    writable: true,
    addr: 0x22,
    startBit: 0,
    endBit: 8,
    selfReset: false,
  },
  STARK_SCALE: {
    name: "STARK_SCALE",
    readable: true,
    writable: true,
    addr: 0x23,
    startBit: 0,
    endBit: 8,
    selfReset: false,
  },
  MMS_KXMS: {
    name: "MMS_KXMS",
    readable: true,
    writable: true,
    addr: 0x25,
    startBit: 0,
    endBit: 1,
    selfReset: false,
  },
  MMS_RA: {
    name: "MMS_RA",
    readable: true,
    writable: true,
    addr: 0x25,
    startBit: 1,
    endBit: 2,
    selfReset: false,
  },
  MEDIAN_ENABLE: {
    name: "MEDIAN_ENABLE",
    readable: true,
    writable: true,
    addr: 0x30,
    startBit: 0,
    endBit: 1,
    selfReset: false,
  },
  MEDIAN_KERNEL_SIZE: {
    name: "MEDIAN_KERNEL_SIZE",
    readable: true,
    writable: true,
    addr: 0x30,
    startBit: 1,
    endBit: 2,
    selfReset: false,
  },
  TEMPORAL_ENABLE: {
    name: "TEMPORAL_ENABLE",
    readable: true,
    writable: true,
    addr: 0xd0,
    startBit: 0,
    endBit: 1,
    selfReset: false,
  },
  TEMPORAL_INIT: {
    name: "TEMPORAL_INIT",
    readable: true,
    writable: true,
    addr: 0xd0,
    startBit: 1,
    endBit: 2,
    selfReset: true,
  },
  TEMPORAL_LSB: {
    name: "TEMPORAL_LSB",
    readable: true,
    writable: true,
    addr: 0xd1,
    startBit: 0,
    endBit: 8,
    selfReset: false,
  },
  TEMPORAL_MSB: {
    name: "TEMPORAL_MSB",
    readable: true,
    writable: true,
    addr: 0xd2,
    startBit: 0,
    endBit: 8,
    selfReset: false,
  },
};

export const REGISTER2FIELD: Record<number, FieldName[]> = (() => {
  const result: Record<number, FieldName[]> = {};
  (Object.keys(FIELDS) as FieldName[]).forEach((fieldName) => {
    const field = FIELDS[fieldName];
    const addr = field.addr;
    if (!result[addr]) {
      result[addr] = [];
    }
    result[addr].push(fieldName);
  });
  return result;
})();

export type FieldName =
  | "SW_RESET"
  | "DMA_TIMEOUT_ENABLE"
  | "TIMEOUT_PERIOD"
  | "STOP_HOST_XFER"
  | "REQ_RETRANSMIT"
  | "AUTO_RETRANSMIT"
  | "GET_SINGLE_FRAME"
  | "CONTINUOUS_STREAM"
  | "READOUT_MODE"
  | "NO_HEADER"
  | "ADC_ENABLE"
  | "FW_VERSION_MAJOR"
  | "FW_VERSION_MINOR"
  | "FW_VERSION_BUILD"
  | "FRAME_RATE_DIVIDER"
  | "SLEEP_PERIOD"
  | "PERIOD_X100"
  | "SLEEP"
  | "READOUT_TOO_SLOW"
  | "SENXOR_IF_ERROR"
  | "CAPTURE_ERROR"
  | "DATA_READY"
  | "BOOTING_UP"
  | "CLK_SLOW_DOWN"
  | "MODULE_GAIN"
  | "SENXOR_TYPE"
  | "MODULE_TYPE"
  | "MCU_TYPE"
  | "LUT_SOURCE"
  | "LUT_SELECTOR"
  | "LUT_VERSION"
  | "CORR_FACTOR"
  | "START_COLOFFS_CALIB"
  | "COLOFFS_CALIB_ON"
  | "USE_SELF_CALIB"
  | "CALIB_SAMPLE_SIZE"
  | "EMISSIVITY"
  | "OFFSET"
  | "OTF"
  | "PRODUCTION_YEAR"
  | "PRODUCTION_WEEK"
  | "MANUF_LOCATION"
  | "SERIAL_NUMBER_0"
  | "SERIAL_NUMBER_1"
  | "SERIAL_NUMBER_2"
  | "USER_FLASH_ENABLE"
  | "TEMP_UNITS"
  | "STARK_ENABLE"
  | "STARK_TYPE"
  | "SPATIAL_KERNEL"
  | "STARK_CUTOFF"
  | "STARK_GRADIENT"
  | "STARK_SCALE"
  | "MMS_KXMS"
  | "MMS_RA"
  | "MEDIAN_ENABLE"
  | "MEDIAN_KERNEL_SIZE"
  | "TEMPORAL_ENABLE"
  | "TEMPORAL_INIT"
  | "TEMPORAL_LSB"
  | "TEMPORAL_MSB";
