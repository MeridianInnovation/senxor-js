export const SENXOR_VENDOR_ID = 0x0416;
export const SENXOR_PRODUCT_ID = {
  0xb002: "EVK",
  0xb020: "XPRO",
  0x9393: "XCAM",
};

export const KELVIN = 273.15;
export const FAHRENHEIT_OFFSET = 32;
export const CELSIUS_TO_FAHRENHEIT_RATIO = 9 / 5;
export const FAHRENHEIT_TO_CELSIUS_RATIO = 5 / 9;

export const SENXOR_FRAME_SHAPE = {
  4960: { height: 62, width: 80 },
  19200: { height: 120, width: 160 },
  2500: { height: 50, width: 50 },
};

export const SENXOR_TYPE = {
  0: "MI0801-non-MP",
  1: "MI0801",
  2: "MI0802",
  4: "MI0802-Rev1",
  5: "MI0802-Rev2",
  6: "MI16XX-Rev1",
};

export const MODULE_TYPE = {
  19: "MI0802M5S",
  20: "MI0802M6S",
  21: "MI0802M7G",
  22: "MI080250",
  24: "MI0802M230",
  25: "MI0802M231",
  26: "MI0802M232",
  27: "MI0802M233",
};

export const SENXOR_TYPE2FRAME_SHAPE = {
  0: { height: 62, width: 80 },
  1: { height: 62, width: 80 },
  3: { height: 62, width: 80 },
  4: { height: 62, width: 80 },
  5: { height: 62, width: 80 },
  6: { height: 120, width: 160 },
  8: { height: 62, width: 80 },
  9: { height: 50, width: 50 },
};

export const MCU_TYPE = {
  0: "MI48D4",
  1: "MI48D5",
  2: "MI48E",
  3: "MI48G",
  4: "MI48C",
  255: "MI48D4",
};
