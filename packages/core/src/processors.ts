import type { SenxorData, SenxorHeader } from "./types";
import colormapData from "./colormaps.json";

export type senxorNormalizedData<T = Uint8ClampedArray | Float32Array> = {
  header?: SenxorHeader;
  frame: T;
  width: number;
  height: number;
  timestamp: number;
};

/**
 * Normalize Float32Array to 0-1 range
 * If all values are equal, return an array of 0.5
 * @param array - Temperature array to normalize
 * @param min - Optional minimum value, calculated from array if not provided
 * @param max - Optional maximum value, calculated from array if not provided
 * @returns Normalized Float32Array
 */
export const normalize = (
  array: Float32Array,
  min?: number,
  max?: number
): Float32Array => {
  let actualMin = min;
  let actualMax = max;

  if (actualMin === undefined || actualMax === undefined) {
    actualMin = Infinity;
    actualMax = -Infinity;

    for (let i = 0; i < array.length; i++) {
      const value = array[i];
      if (value < actualMin) actualMin = value;
      if (value > actualMax) actualMax = value;
    }
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
 * Convert SenxorData to grayscale image with Uint8ClampedArray (0-255 range)
 * @param data - SenxorData to convert
 * @returns senxorNormalizedData<Uint8ClampedArray>
 */
export const dataToGrayScaleUint8 = (
  data: SenxorData
): senxorNormalizedData<Uint8ClampedArray> => {
  const normalized = normalize(data.frame);
  const uint8Data = new Uint8ClampedArray(data.frame.length);

  for (let i = 0; i < normalized.length; i++) {
    uint8Data[i] = Math.round(normalized[i] * 255);
  }

  return {
    header: data.header,
    frame: uint8Data,
    width: data.width,
    height: data.height,
    timestamp: data.timestamp,
  };
};

/**
 * Convert SenxorData to grayscale image with Float32Array (0-1 range)
 * @param data - SenxorData to convert
 * @returns senxorNormalizedData<Float32Array>
 */
export const dataToGrayScaleFloat = (
  data: SenxorData
): senxorNormalizedData<Float32Array> => {
  const normalized = normalize(data.frame);

  return {
    header: data.header,
    frame: normalized,
    width: data.width,
    height: data.height,
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
    let grayValue: number;

    if (frame instanceof Float32Array) {
      grayValue = Math.round(frame[i] * 255);
    } else {
      grayValue = frame[i];
    }

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
    let grayValue: number;

    if (frame instanceof Float32Array) {
      grayValue = Math.round(frame[i] * 255);
    } else {
      grayValue = frame[i];
    }

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
const colormaps: Record<ColorMap, Uint8Array | undefined> = {
  rainbow2: undefined,
};

/**
 * Load color map from colormaps.json into colormaps
 * @param name - Color map name to load
 * @returns void
 */
export const loadColorMap = async (name: ColorMap): Promise<void> => {
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
  return Object.keys(colormapData);
};

/**
 * Apply color map to senxorNormalizedData
 * @param data - senxorNormalizedData to apply color map to
 * @param map - Color map name to apply
 * @returns ImageData object
 */
export const applyColorMap = async (
  data: senxorNormalizedData,
  map: ColorMap
): Promise<ImageData> => {
  if (!(map in colormapData)) {
    throw new Error(`Color map "${map}" not found`);
  }

  if (!colormaps[map]) {
    await loadColorMap(map);
  }

  const lut = colormaps[map];
  if (!lut) {
    throw new Error(`Failed to load color map "${map}"`);
  }

  return applyColorLUT(data, lut);
};
