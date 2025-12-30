import colormapData from "./colormaps.json";
import type { SenxorData, SenxorHeader } from "./types";

export type senxorNormalizedData = {
  header?: SenxorHeader;
  frame: Float32Array;
  width: number;
  height: number;
  minTemperature: number;
  maxTemperature: number;
  timestamp: number;
};

/**
 * Get minimum and maximum values from Float32Array
 * @param array - Float32Array to get minimum and maximum values from
 * @returns { min: number; max: number }
 */
export const getMinMax = (
  array: Float32Array
): { min: number; max: number } => {
  let min = array[0];
  let max = array[0];

  for (const element of array) {
    const value = element;
    if (value < min) min = value;
    if (value > max) max = value;
  }

  return { min, max };
};

/**
 * Normalize Float32Array to 0-1 range
 * If all values are equal, return an array of 0.5
 * @param array - Temperature array to normalize
 * @param min - Optional minimum value, calculated from array if not provided
 * @param max - Optional maximum value, calculated from array if not provided
 * @returns Normalized Float32Array
 */
export const normalizeFloat32Array = (
  array: Float32Array,
  min?: number,
  max?: number
): Float32Array => {
  let actualMin = min;
  let actualMax = max;

  if (actualMin === undefined || actualMax === undefined) {
    const { min, max } = getMinMax(array);
    actualMin = min;
    actualMax = max;
  }

  if (actualMin === actualMax) {
    return new Float32Array(array.length).fill(0.5);
  }

  const normalized = new Float32Array(array.length);
  const range = actualMax - actualMin;

  for (let i = 0; i < array.length; i++) {
    normalized[i] = (array[i] - actualMin) / range;
  }

  return normalized;
};

/**
 * Normalize SenxorData to Float32Array (0-1 range)
 * @param data - SenxorData to normalize
 * @param min - Optional minimum value, calculated from array if not provided
 * @param max - Optional maximum value, calculated from array if not provided
 * @returns senxorNormalizedData
 */
export const nomalizeSenxorData = (
  data: SenxorData,
  min?: number,
  max?: number
): senxorNormalizedData => {
  let actualMin = min;
  let actualMax = max;

  if (actualMin === undefined || actualMax === undefined) {
    const { min, max } = getMinMax(data.frame);
    actualMin = min;
    actualMax = max;
  }

  const normalized = normalizeFloat32Array(data.frame, actualMin, actualMax);

  return {
    header: data.header,
    frame: normalized,
    width: data.width,
    height: data.height,
    minTemperature: actualMin,
    maxTemperature: actualMax,
    timestamp: data.timestamp,
  };
};

/**
 * Create GrayScale ImageData from senxorNormalizedData
 * Converts single-channel grayscale to RGBA format
 * @param data - senxorNormalizedData to convert
 * @returns ImageData object
 */
export const createGrayScaleImageData = (
  data: senxorNormalizedData
): ImageData => {
  const { frame, width, height } = data;
  const rgbaData = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < frame.length; i++) {
    const grayValue = Math.round(frame[i] * 255);
    const rgbaIndex = i * 4;

    rgbaData[rgbaIndex] = grayValue; // R
    rgbaData[rgbaIndex + 1] = grayValue; // G
    rgbaData[rgbaIndex + 2] = grayValue; // B
    rgbaData[rgbaIndex + 3] = 255; // A
  }

  return new ImageData(rgbaData, width, height);
};

/**
 * Apply Color LUT to senxorNormalizedData
 * @param data - senxorNormalizedData to apply LUT to
 * @param lut - Color LUT to apply, must be a 256x3 Uint8Array, in the order of R, G, B, R, G, B, ...
 * @returns ImageData object
 */
export const applyColorLUT = (
  data: senxorNormalizedData,
  lut: Uint8Array
): ImageData => {
  const { frame, width, height } = data;
  const rgbaData = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < frame.length; i++) {
    const grayValue = Math.round(frame[i] * 255);
    const lutIndex = grayValue * 3;
    const rgbaIndex = i * 4;

    rgbaData[rgbaIndex] = lut[lutIndex]; // R
    rgbaData[rgbaIndex + 1] = lut[lutIndex + 1]; // G
    rgbaData[rgbaIndex + 2] = lut[lutIndex + 2]; // B
    rgbaData[rgbaIndex + 3] = 255; // A
  }

  return new ImageData(rgbaData, width, height);
};

export type ColorMap = "rainbow2";

/**
 * Color maps are stored in base64 format in colormaps.json
 */
const colormaps: Record<string, Uint8Array | undefined> = {
  rainbow2: undefined,
};

/**
 * Register a color map
 * @param name - Color map name
 * @param lut - Color map LUT
 */
export const registerColorMap = (name: string, lut: Uint8Array): void => {
  if (lut.length !== 768) {
    throw new Error(`Color map "${name}" must be a 256x3 Uint8Array`);
  }
  colormaps[name] = lut;
};

const loadColorMap = (name: ColorMap | string): void => {
  if (!(name in colormapData)) {
    throw new Error(`Color map "${name}" not found`);
  }

  const base64 = colormapData[name as keyof typeof colormapData];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  colormaps[name] = bytes;
};

/**
 * Get list of available color maps
 * @returns Array of color map names
 */
export const getColorMapList = (): string[] => {
  return Object.keys(colormaps);
};

/**
 * Apply color map to senxorNormalizedData
 * @param data - senxorNormalizedData to apply color map to
 * @param map - Color map name to apply
 * @returns ImageData object
 */
export const applyColorMap = (
  data: senxorNormalizedData,
  map: ColorMap | string
): ImageData => {
  if (!(map in colormaps)) {
    throw new Error(`Color map "${map}" not found`);
  }

  if (!colormaps[map]) {
    loadColorMap(map);
  }

  const lut = colormaps[map];
  if (!lut) {
    throw new Error(`Failed to load color map "${map}"`);
  }

  return applyColorLUT(data, lut);
};
