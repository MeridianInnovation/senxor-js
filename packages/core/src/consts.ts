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
  0: "MI0801 non-MP", // non-MP modules
  1: "MI0801", // MP modules
  4: "MI0802", // cougar 80x62
  5: "MI0802", // cougar 80x62
  6: "MI1602", // panther 120x160
  8: "MI0802", // cougar 80x62, high sensitivity
  9: "MI0502", // Cheetah 50x50
};

export const MODULE_TYPE = {
  19: "MI0802-M5S",
  20: "MI0802-M6S",
  21: "MI0802-M7G",
  22: "MI0802-50",
  24: "MI0802-M230", // M230-022
  28: "MI1602-M5S",
  29: "MI1602-M6C",
  40: "MI1602-M5S", // Panther engineering sample
  41: "MI1602-M6C", // Panther engineering sample
  50: "MI0502-M230F", // Cheetah WFOV, FPC
  255: "MI0801", // Bobcat FW does not have this register; read returns 0xFF
  42: "MI1602-Z6C", // Panther MP, Zn-Alloy LHA
  0: "MI0505-M240", // Cheetah, WFOV, FPC
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
  0: "MI48D4", // MI48, Cougar
  1: "MI48D5", // MI48, Panther
  2: "MI48E", // MI467, Panther
  3: "MI48G", // GPM4, Panther
  4: "MI49", // CCore 4201, Cougar, Cheetah
  5: "MI40", // CCore 4001, Cougar, Cheetah
  255: "MI48D4", // MI48, Cougar (older FW has 0x33 Reserved, returning 255)
};
