import { KELVIN, SENXOR_FRAME_SHAPE } from "./consts";
import { SenxorError } from "./error";
import type {
  DataUnit,
  SenxorData,
  SenxorHeader,
  SenxorRawData,
} from "./types";

export const getBits = (value: number, start: number, end: number) => {
  if (value < 0 || value > 0xffffffff) {
    throw new Error("Value must be a valid 32-bit unsigned integer");
  }
  if (start < 0 || end > 31) {
    throw new Error("Start and end indices must be between 0 and 31");
  }
  if (start > end) {
    throw new Error("Start index must be less than end index");
  }

  const numberOfBits = end - start + 1;
  const shiftedValue = value >> start;

  if (numberOfBits === 32) {
    return shiftedValue >>> 0;
  }
  return shiftedValue & ((1 << numberOfBits) - 1);
};

const MAX_VALUES = [
  0, 1, 3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047, 4095, 8191, 16383, 32767,
  65535, 131071, 262143, 524287, 1048575, 2097151, 4194303, 8388607, 16777215,
  33554431, 67108863, 134217727, 268435455, 536870911, 1073741823, 2147483647,
  0xffffffff,
];

export const setBits = (
  value: number,
  start: number,
  end: number,
  newBits: number
) => {
  if (value < 0 || value > 0xffffffff || newBits < 0) {
    throw new Error("Values must be valid 32-bit unsigned integers");
  }
  if (start < 0 || end > 31 || start > end) {
    throw new Error(
      "Start and end indices must be between 0 and 31, start <= end"
    );
  }

  const numberOfBits = end - start + 1;
  if (newBits > MAX_VALUES[numberOfBits]) {
    throw new Error(`Write value must fit in ${numberOfBits} bits`);
  }

  if (numberOfBits === 32) {
    return newBits;
  }

  const bitMask = MAX_VALUES[numberOfBits];
  const mask = ~(bitMask << start);
  const clearedValue = value & mask;
  const shiftedWriteValue = newBits << start;

  return clearedValue | shiftedWriteValue;
};

export const dkToCelsius = (dk: number): number => {
  return dk * 0.1 - KELVIN;
};

export const dkToKelvin = (dk: number): number => {
  return dk * 0.1;
};

export const getFrameShape = (
  frameLength: number
): { width: number; height: number } => {
  const shape =
    SENXOR_FRAME_SHAPE[frameLength as keyof typeof SENXOR_FRAME_SHAPE];
  if (!shape) {
    throw new SenxorError(
      `Parse Senxor Data Error: Unknown frame shape for length: ${frameLength}`
    );
  }
  return shape;
};

export const parseHeader = (
  header: Uint8Array,
  dataUnit: DataUnit
): SenxorHeader => {
  const view = new DataView(
    header.buffer,
    header.byteOffset,
    header.byteLength
  );
  let offset = 0;

  const frameCount = view.getUint16(offset, true);
  offset += 2;

  const vddRaw = view.getUint16(offset, true);
  const vdd = vddRaw * 0.0001;
  offset += 2;

  const dieTempRaw = view.getUint16(offset, true);
  const dieTempKelvin = dieTempRaw * 0.01;
  const dieTemp = dataUnit === "C" ? dieTempKelvin - KELVIN : dieTempKelvin;

  offset += 2;

  const timestamp = view.getUint32(offset, true);
  offset += 4;

  const maxValDk = view.getUint16(offset, true);
  const maxVal =
    dataUnit === "C" ? dkToCelsius(maxValDk) : dkToKelvin(maxValDk);
  offset += 2;

  const minValDk = view.getUint16(offset, true);
  const minVal =
    dataUnit === "C" ? dkToCelsius(minValDk) : dkToKelvin(minValDk);
  offset += 2;

  const crc = view.getUint16(offset, true);

  return {
    frameCount,
    vdd,
    dieTemp,
    timestamp,
    maxVal,
    minVal,
    crc,
  };
};

export const processRawSenxorData = (
  data: SenxorRawData,
  dataUnit: DataUnit
): SenxorData => {
  const raw = data.frame;
  const rawFrame = new Uint16Array(raw.buffer, raw.byteOffset, raw.length / 2);
  const shape = getFrameShape(rawFrame.length);
  const celsiusFrame = Float32Array.from(
    rawFrame,
    dataUnit === "C" ? dkToCelsius : dkToKelvin
  );

  const header = data.header ? parseHeader(data.header, dataUnit) : undefined;
  return {
    header,
    frame: celsiusFrame,
    width: shape.width,
    height: shape.height,
    timestamp: data.timestamp,
    dataUnit,
  };
};
