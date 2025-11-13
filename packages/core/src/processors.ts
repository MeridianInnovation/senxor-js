import type { SenxorData, SenxorHeader } from "./types";

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
